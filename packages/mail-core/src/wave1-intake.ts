import { randomUUID } from "node:crypto";

import type { MailQueueAddress, MailQueueSubmitPayload } from "./mail-queue.js";

export type Wave1FlowKind =
  | "contact_form_submission"
  | "life_contact_briefing_request"
  | "support_form_submission";

export type Wave1Locale = "vi" | "en";

export interface Wave1SubmissionInput {
  email: string;
  goal?: string;
  lifeState?: string;
  message: string;
  name: string;
  source?: string;
}

export interface Wave1MailboxConfig {
  credentialId: string;
  mailbox: MailQueueAddress;
  senderIdentityId?: string;
  workspaceId: string;
}

export interface Wave1MailPair {
  autoReply: MailQueueSubmitPayload;
  operatorNotification: MailQueueSubmitPayload;
}

export interface InternalMailQueueClientConfig {
  baseUrl: string;
  fetchImpl?: typeof globalThis.fetch;
  token: string;
}

export interface InternalMailQueueResult {
  messageEventId?: string;
  messageId: string;
  providerRoute?: string;
  queuedAt: string;
  smtpSessionId?: string;
  traceId?: string;
}

export interface InternalMailQueuePairResult {
  autoReply: InternalMailQueueResult;
  operatorNotification: InternalMailQueueResult;
}

export function buildWave1MailPair(
  flow: Wave1FlowKind,
  locale: Wave1Locale,
  submission: Wave1SubmissionInput,
  config: Wave1MailboxConfig
): Wave1MailPair {
  const normalized = normalizeSubmission(submission);
  const traceRoot = `trace_${randomUUID()}`;
  const submittedAt = new Date().toISOString();
  const stream = "transactional";

  return {
    autoReply: buildQueuePayload({
      config,
      flow,
      kind: "auto_reply",
      locale,
      normalized,
      stream,
      submittedAt,
      traceId: `${traceRoot}_reply`
    }),
    operatorNotification: buildQueuePayload({
      config,
      flow,
      kind: "operator_notification",
      locale,
      normalized,
      stream,
      submittedAt,
      traceId: `${traceRoot}_ops`
    })
  };
}

export async function queueWave1MailPair(
  client: InternalMailQueueClientConfig,
  pair: Wave1MailPair
): Promise<InternalMailQueuePairResult> {
  const [operatorNotification, autoReply] = await Promise.all([
    queueMail(client, pair.operatorNotification),
    queueMail(client, pair.autoReply)
  ]);

  return {
    autoReply,
    operatorNotification
  };
}

export async function queueMail(
  client: InternalMailQueueClientConfig,
  payload: MailQueueSubmitPayload
): Promise<InternalMailQueueResult> {
  const fetchImpl = client.fetchImpl ?? globalThis.fetch;
  const response = await fetchImpl(resolveQueueUrl(client.baseUrl), {
    body: JSON.stringify(payload),
    headers: {
      authorization: `Bearer ${client.token}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      isRecord(body) && typeof body.message === "string"
        ? body.message
        : `Internal mail queue failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (!isRecord(body) || typeof body.messageId !== "string" || typeof body.queuedAt !== "string") {
    throw new Error("Internal mail queue returned an invalid response shape.");
  }

  return {
    messageEventId: typeof body.messageEventId === "string" ? body.messageEventId : undefined,
    messageId: body.messageId,
    providerRoute: typeof body.providerRoute === "string" ? body.providerRoute : undefined,
    queuedAt: body.queuedAt,
    smtpSessionId: typeof body.smtpSessionId === "string" ? body.smtpSessionId : undefined,
    traceId: typeof body.traceId === "string" ? body.traceId : undefined
  };
}

interface BuildQueuePayloadInput {
  config: Wave1MailboxConfig;
  flow: Wave1FlowKind;
  kind: "operator_notification" | "auto_reply";
  locale: Wave1Locale;
  normalized: Required<Wave1SubmissionInput>;
  stream: string;
  submittedAt: string;
  traceId: string;
}

function buildQueuePayload(input: BuildQueuePayloadInput): MailQueueSubmitPayload {
  const draft = buildMailDraft(input);
  const messageId = `msg_${randomUUID()}`;

  return {
    attachments: [],
    bcc: [],
    cc: [],
    credentialId: input.config.credentialId,
    envelopeFrom: input.config.mailbox.email,
    from: input.config.mailbox,
    headerFrom: formatMailbox(input.config.mailbox),
    headers: {
      "x-iai-flow-kind": input.flow,
      "x-iai-mail-kind": input.kind,
      "x-iai-source-surface": input.normalized.source
    },
    html: draft.html,
    messageId,
    messageIdempotencyKey: `${input.traceId}:${input.kind}`,
    recipients: draft.to.map((item) => item.email),
    replyTo: draft.replyTo,
    senderIdentityId: input.config.senderIdentityId,
    source: "api",
    stream: input.stream,
    submittedAt: input.submittedAt,
    subject: draft.subject,
    text: draft.text,
    to: draft.to,
    traceId: input.traceId,
    workspaceId: input.config.workspaceId
  };
}

function buildMailDraft(input: BuildQueuePayloadInput) {
  const flowLabel = getFlowLabel(input.flow);
  const locale = input.locale;
  const mailbox = input.config.mailbox;
  const submittedLines = [
    `Họ và tên / Name: ${input.normalized.name}`,
    `Email: ${input.normalized.email}`,
    `Nguồn / Source: ${input.normalized.source}`,
    `Mục tiêu / Goal: ${input.normalized.goal}`,
    `Nhịp sống hiện tại / Current life state: ${input.normalized.lifeState}`,
    "",
    "Nội dung / Message:",
    input.normalized.message
  ];

  if (input.kind === "operator_notification") {
    const subject = `${flowLabel.subjectOpsVi} / ${flowLabel.subjectOpsEn}: ${input.normalized.name}`;
    const text = [
      `${flowLabel.titleVi}`,
      flowLabel.titleEn,
      "",
      ...submittedLines
    ].join("\n");

    const html = renderHtmlSections(
      subject,
      [
        {
          body: "Một yêu cầu mới vừa được gửi vào hệ email.",
          heading: flowLabel.titleVi
        },
        {
          body: "A new request has entered the email system.",
          heading: flowLabel.titleEn
        }
      ],
      submittedLines
    );

    return {
      html,
      replyTo: {
        email: input.normalized.email,
        name: input.normalized.name
      },
      subject,
      text,
      to: [mailbox]
    };
  }

  const localizedSummary =
    locale === "en"
      ? "We received your request and will reply from the correct mailbox when triage is complete."
      : "Chúng tôi đã nhận được yêu cầu của bạn và sẽ phản hồi từ đúng hộp thư sau khi hoàn tất bước rà soát.";
  const subject = `${flowLabel.subjectReplyVi} / ${flowLabel.subjectReplyEn}`;
  const text = [
    `${flowLabel.replyHeadingVi}`,
    flowLabel.replyHeadingEn,
    "",
    localizedSummary,
    "",
    `Hộp thư phản hồi / Reply mailbox: ${mailbox.email}`,
    "",
    "Bản tóm tắt yêu cầu / Request summary:",
    ...submittedLines
  ].join("\n");

  const html = renderHtmlSections(
    subject,
    [
      {
        body: "Chúng tôi đã nhận được yêu cầu của bạn. Vui lòng giữ lại email này để đối chiếu khi cần.",
        heading: flowLabel.replyHeadingVi
      },
      {
        body: "We received your request. Please keep this email for reference if follow-up is needed.",
        heading: flowLabel.replyHeadingEn
      }
    ],
    [
      `Hộp thư phản hồi / Reply mailbox: ${mailbox.email}`,
      "",
      ...submittedLines
    ]
  );

  return {
    html,
    replyTo: mailbox,
    subject,
    text,
    to: [
      {
        email: input.normalized.email,
        name: input.normalized.name
      }
    ]
  };
}

function renderHtmlSections(subject: string, sections: { body: string; heading: string }[], lines: string[]) {
  return [
    "<!doctype html>",
    '<html lang="vi">',
    "<body style=\"font-family:Arial,sans-serif;color:#18211f;line-height:1.6;background:#f7f7f5;padding:24px;\">",
    '<div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #dde4de;border-radius:16px;padding:24px;">',
    `<h1 style="margin-top:0;font-size:22px;">${escapeHtml(subject)}</h1>`,
    ...sections.map(
      (section) =>
        `<section style="margin-bottom:16px;"><h2 style="font-size:16px;margin-bottom:8px;">${escapeHtml(section.heading)}</h2><p style="margin:0;">${escapeHtml(section.body)}</p></section>`
    ),
    '<section style="margin-top:20px;padding-top:16px;border-top:1px solid #dde4de;">',
    `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;margin:0;">${escapeHtml(lines.join("\n"))}</pre>`,
    "</section>",
    "</div>",
    "</body>",
    "</html>"
  ].join("");
}

function getFlowLabel(flow: Wave1FlowKind) {
  switch (flow) {
    case "life_contact_briefing_request":
      return {
        replyHeadingEn: "Life IAI One received your briefing",
        replyHeadingVi: "Life IAI One đã nhận brief của bạn",
        subjectOpsEn: "New Life briefing request",
        subjectOpsVi: "Brief mới từ Life IAI One",
        subjectReplyEn: "Life IAI One received your briefing",
        subjectReplyVi: "Life IAI One đã nhận brief của bạn",
        titleEn: "Life briefing request",
        titleVi: "Yêu cầu brief Life IAI One"
      };
    case "support_form_submission":
      return {
        replyHeadingEn: "IAI support received your request",
        replyHeadingVi: "IAI support đã nhận yêu cầu của bạn",
        subjectOpsEn: "New support request",
        subjectOpsVi: "Yêu cầu hỗ trợ mới",
        subjectReplyEn: "IAI support received your request",
        subjectReplyVi: "IAI support đã nhận yêu cầu của bạn",
        titleEn: "Support request",
        titleVi: "Yêu cầu hỗ trợ"
      };
    case "contact_form_submission":
    default:
      return {
        replyHeadingEn: "IAI received your contact request",
        replyHeadingVi: "IAI đã nhận yêu cầu liên hệ của bạn",
        subjectOpsEn: "New contact request",
        subjectOpsVi: "Yêu cầu liên hệ mới",
        subjectReplyEn: "IAI received your contact request",
        subjectReplyVi: "IAI đã nhận yêu cầu liên hệ của bạn",
        titleEn: "Contact request",
        titleVi: "Yêu cầu liên hệ"
      };
  }
}

function normalizeSubmission(submission: Wave1SubmissionInput): Required<Wave1SubmissionInput> {
  return {
    email: normalizeText(submission.email),
    goal: normalizeText(submission.goal),
    lifeState: normalizeText(submission.lifeState),
    message: normalizeText(submission.message),
    name: normalizeText(submission.name),
    source: normalizeText(submission.source) || "unknown"
  };
}

function resolveQueueUrl(baseUrl: string) {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  if (normalized.endsWith("/v1/internal/smtp/queue")) {
    return normalized;
  }

  if (normalized.endsWith("/v1/internal/smtp")) {
    return `${normalized}/queue`;
  }

  return `${normalized}/v1/internal/smtp/queue`;
}

function formatMailbox(address: MailQueueAddress) {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

function normalizeText(value: string | undefined) {
  return String(value ?? "").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
