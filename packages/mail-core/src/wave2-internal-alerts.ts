import { randomUUID } from "node:crypto";

import type { MailQueueAddress, MailQueueSubmitPayload } from "./mail-queue.js";

export type Wave2InternalAlertKind =
  | "low_risk_internal_alert"
  | "low_volume_notification";

export type Wave2Locale = "vi" | "en";

export type Wave2AlertSeverity = "info" | "warning";

export interface Wave2InternalAlertInput {
  alertId: string;
  contextLines?: string[];
  message: string;
  recordedAt: string;
  scope: string;
  severity: Wave2AlertSeverity;
  sourceRef?: string;
  title: string;
}

export interface Wave2InternalAlertConfig {
  credentialId: string;
  fromMailbox: MailQueueAddress;
  recipients: MailQueueAddress[];
  replyTo?: MailQueueAddress;
  senderIdentityId?: string;
  workspaceId: string;
}

export function buildWave2InternalAlertPayload(
  kind: Wave2InternalAlertKind,
  locale: Wave2Locale,
  input: Wave2InternalAlertInput,
  config: Wave2InternalAlertConfig
): MailQueueSubmitPayload {
  if (config.recipients.length === 0) {
    throw new Error("Wave2 internal alert requires at least one recipient.");
  }

  const normalized = normalizeAlertInput(input);
  const traceId = `trace_${randomUUID()}`;
  const messageId = `msg_${randomUUID()}`;
  const submittedAt = new Date().toISOString();
  const labels = getKindLabels(kind);
  const subject = buildBilingualSubject(labels, locale, normalized);
  const text = buildBilingualText(labels, normalized);
  const html = buildBilingualHtml(subject, labels, normalized);

  return {
    attachments: [],
    bcc: [],
    cc: [],
    credentialId: config.credentialId,
    envelopeFrom: config.fromMailbox.email,
    from: config.fromMailbox,
    headerFrom: formatMailbox(config.fromMailbox),
    headers: {
      "x-iai-alert-id": normalized.alertId,
      "x-iai-alert-scope": normalized.scope,
      "x-iai-alert-severity": normalized.severity,
      "x-iai-flow-kind": kind
    },
    html,
    messageId,
    messageIdempotencyKey: `${normalized.alertId}:${kind}`,
    recipients: config.recipients.map((item) => item.email),
    replyTo: config.replyTo,
    senderIdentityId: config.senderIdentityId,
    source: "api",
    stream: "transactional",
    submittedAt,
    subject,
    text,
    to: config.recipients.map(cloneAddress),
    traceId,
    workspaceId: config.workspaceId
  };
}

interface KindLabels {
  bannerEn: string;
  bannerVi: string;
  subjectPrefixEn: string;
  subjectPrefixVi: string;
  summaryEn: string;
  summaryVi: string;
}

function getKindLabels(kind: Wave2InternalAlertKind): KindLabels {
  switch (kind) {
    case "low_volume_notification":
      return {
        bannerEn: "Low-volume internal notification",
        bannerVi: "Thông báo nội bộ khối lượng thấp",
        subjectPrefixEn: "Notice",
        subjectPrefixVi: "Thông báo",
        summaryEn: "This message is part of a low-volume notification stream and does not require immediate action.",
        summaryVi: "Thông điệp này thuộc luồng thông báo khối lượng thấp và không yêu cầu hành động ngay."
      };
    case "low_risk_internal_alert":
    default:
      return {
        bannerEn: "Low-risk internal alert",
        bannerVi: "Cảnh báo nội bộ rủi ro thấp",
        subjectPrefixEn: "Alert",
        subjectPrefixVi: "Cảnh báo",
        summaryEn: "This alert is informational. Operators should review during the next regular check.",
        summaryVi: "Cảnh báo này mang tính thông tin. Vận hành rà soát ở vòng kiểm tra định kỳ tiếp theo."
      };
  }
}

function buildBilingualSubject(
  labels: KindLabels,
  locale: Wave2Locale,
  normalized: NormalizedAlert
): string {
  const primary =
    locale === "en"
      ? `${labels.subjectPrefixEn}: ${normalized.title}`
      : `${labels.subjectPrefixVi}: ${normalized.title}`;
  const secondary =
    locale === "en"
      ? `${labels.subjectPrefixVi}: ${normalized.title}`
      : `${labels.subjectPrefixEn}: ${normalized.title}`;
  return `${primary} / ${secondary}`;
}

function buildBilingualText(labels: KindLabels, normalized: NormalizedAlert): string {
  const lines = [
    labels.bannerVi,
    labels.bannerEn,
    "",
    `Tiêu đề / Title: ${normalized.title}`,
    `Phạm vi / Scope: ${normalized.scope}`,
    `Mức độ / Severity: ${normalized.severity}`,
    `Mã cảnh báo / Alert ID: ${normalized.alertId}`,
    `Ghi nhận lúc / Recorded at: ${normalized.recordedAt}`
  ];

  if (normalized.sourceRef) {
    lines.push(`Tham chiếu nguồn / Source ref: ${normalized.sourceRef}`);
  }

  lines.push("", "Tóm tắt / Summary:", labels.summaryVi, labels.summaryEn, "", "Nội dung / Detail:", normalized.message);

  if (normalized.contextLines.length > 0) {
    lines.push("", "Ngữ cảnh / Context:", ...normalized.contextLines);
  }

  return lines.join("\n");
}

function buildBilingualHtml(
  subject: string,
  labels: KindLabels,
  normalized: NormalizedAlert
): string {
  const sections = [
    { body: labels.summaryVi, heading: labels.bannerVi },
    { body: labels.summaryEn, heading: labels.bannerEn }
  ];
  const detailLines = [
    `Tiêu đề / Title: ${normalized.title}`,
    `Phạm vi / Scope: ${normalized.scope}`,
    `Mức độ / Severity: ${normalized.severity}`,
    `Mã cảnh báo / Alert ID: ${normalized.alertId}`,
    `Ghi nhận lúc / Recorded at: ${normalized.recordedAt}`
  ];

  if (normalized.sourceRef) {
    detailLines.push(`Tham chiếu nguồn / Source ref: ${normalized.sourceRef}`);
  }

  detailLines.push("", "Nội dung / Detail:", normalized.message);

  if (normalized.contextLines.length > 0) {
    detailLines.push("", "Ngữ cảnh / Context:", ...normalized.contextLines);
  }

  return [
    "<!doctype html>",
    '<html lang="vi">',
    '<body style="font-family:Arial,sans-serif;color:#18211f;line-height:1.6;background:#f7f7f5;padding:24px;">',
    '<div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #dde4de;border-radius:16px;padding:24px;">',
    `<h1 style="margin-top:0;font-size:22px;">${escapeHtml(subject)}</h1>`,
    ...sections.map(
      (section) =>
        `<section style="margin-bottom:16px;"><h2 style="font-size:16px;margin-bottom:8px;">${escapeHtml(section.heading)}</h2><p style="margin:0;">${escapeHtml(section.body)}</p></section>`
    ),
    '<section style="margin-top:20px;padding-top:16px;border-top:1px solid #dde4de;">',
    `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;margin:0;">${escapeHtml(detailLines.join("\n"))}</pre>`,
    "</section>",
    "</div>",
    "</body>",
    "</html>"
  ].join("");
}

interface NormalizedAlert {
  alertId: string;
  contextLines: string[];
  message: string;
  recordedAt: string;
  scope: string;
  severity: Wave2AlertSeverity;
  sourceRef: string;
  title: string;
}

function normalizeAlertInput(input: Wave2InternalAlertInput): NormalizedAlert {
  return {
    alertId: requireText(input.alertId, "alertId"),
    contextLines: (input.contextLines ?? []).map((line) => String(line ?? "").trim()).filter((line) => line.length > 0),
    message: requireText(input.message, "message"),
    recordedAt: requireText(input.recordedAt, "recordedAt"),
    scope: requireText(input.scope, "scope"),
    severity: input.severity,
    sourceRef: String(input.sourceRef ?? "").trim(),
    title: requireText(input.title, "title")
  };
}

function requireText(value: string, field: string): string {
  const normalized = String(value ?? "").trim();
  if (normalized.length === 0) {
    throw new Error(`Wave2 internal alert requires non-empty "${field}".`);
  }
  return normalized;
}

function cloneAddress(address: MailQueueAddress): MailQueueAddress {
  return address.name ? { email: address.email, name: address.name } : { email: address.email };
}

function formatMailbox(address: MailQueueAddress): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
