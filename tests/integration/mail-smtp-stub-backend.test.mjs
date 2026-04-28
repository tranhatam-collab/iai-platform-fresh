import test from "node:test";
import assert from "node:assert/strict";

import { loadMailSmtpConfig } from "../../packages/config/dist/index.js";
import { createStubMailSmtpDependencies } from "../../apps/mail-smtp/dist/dev-backend.js";
import { createRuntimeStats } from "../../apps/mail-smtp/dist/stats.js";

function createConfig() {
  return loadMailSmtpConfig({
    MAIL_DB_URL: "postgres://postgres:postgres@localhost:5432/iai_mail",
    MAIL_SMTP_BACKEND_MODE: "stub",
    MAIL_SMTP_DEV_ALLOWED_SENDERS: "no-reply@tx.iai.one,system@sys.iai.one",
    MAIL_SMTP_DEV_ALLOWED_STREAMS: "transactional,system",
    MAIL_SMTP_DEV_AUTH_PASS: "dev-secret",
    MAIL_SMTP_DEV_AUTH_USER: "smtp-dev",
    MAIL_SMTP_DEV_SUPPRESSED_RECIPIENTS: "blocked@example.com",
    MAIL_SMTP_DEV_VERIFIED_DOMAINS: "tx.iai.one,sys.iai.one",
    MAIL_SMTP_PRIMARY_ROUTE: "transactional_primary",
    NODE_ENV: "development"
  });
}

function createMime({ from, streamHeader, subject }) {
  const streamLine = streamHeader ? `X-IAI-Stream: ${streamHeader}\r\n` : "";

  return Buffer.from(
    `From: ${from}\r\nSubject: ${subject}\r\n${streamLine}\r\nhello`,
    "utf8"
  );
}

function createMultipartMime() {
  return Buffer.from(
    [
      'From: "IAI Ops" <no-reply@tx.iai.one>',
      'To: "User Example" <user@example.com>',
      "Cc: audit@example.com",
      "Bcc: hidden@example.com",
      "Reply-To: support@iai.one",
      "Message-ID: <header-msg-123@tx.iai.one>",
      "Subject: =?UTF-8?B?SGVsbG8gZnJvbSBTTVRQ?=",
      "MIME-Version: 1.0",
      'Content-Type: multipart/mixed; boundary="mix"',
      "",
      "--mix",
      'Content-Type: multipart/alternative; boundary="alt"',
      "",
      "--alt",
      'Content-Type: text/plain; charset="utf-8"',
      "Content-Transfer-Encoding: quoted-printable",
      "",
      "Hello=20from=20SMTP",
      "--alt",
      'Content-Type: text/html; charset="utf-8"',
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from("<p>Hello from SMTP</p>", "utf8").toString("base64"),
      "--alt--",
      "--mix",
      "Content-Type: application/pdf; name=\"guide.pdf\"",
      "Content-Disposition: attachment; filename=\"guide.pdf\"",
      "Content-Transfer-Encoding: base64",
      "",
      Buffer.from("%PDF-1.4", "utf8").toString("base64"),
      "--mix--",
      ""
    ].join("\r\n"),
    "utf8"
  );
}

function createEncodedMultipartMime() {
  const pdfPayload = Buffer.from("fake pdf payload", "utf8").toString("base64");
  const inlinePayload = Buffer.from("inline-image", "utf8").toString("base64");

  return Buffer.from(
    [
      "From: =?UTF-8?Q?IAI_H=E1=BB=87_th=E1=BB=91ng?= <no-reply@tx.iai.one>",
      "To: Nguyen Van A <user@example.com>",
      "Cc: =?UTF-8?Q?Ng=C6=B0=E1=BB=9Di_C=C3=B9ng_nh=C3=B3m?= <cc@example.com>",
      "Bcc: Hidden Recipient <hidden@example.com>",
      "Reply-To: IAI Support <support@iai.one>",
      "Subject: =?UTF-8?Q?B=C3=A1o_c=C3=A1o_th=C3=A1ng_4?=",
      "Message-ID: <message-123@tx.iai.one>",
      "X-IAI-Stream: system",
      'Content-Type: multipart/mixed; boundary="mix"',
      "",
      "--mix",
      'Content-Type: multipart/alternative; boundary="alt"',
      "",
      "--alt",
      'Content-Type: text/plain; charset="utf-8"',
      "Content-Transfer-Encoding: quoted-printable",
      "",
      "Xin ch=C3=A0o =C4=91=E1=BB=99i ng=C5=A9 IAI",
      "--alt",
      'Content-Type: text/html; charset="utf-8"',
      "Content-Transfer-Encoding: quoted-printable",
      "",
      "<p>Xin ch=C3=A0o <strong>=C4=91=E1=BB=99i ng=C5=A9 IAI</strong></p>",
      "--alt--",
      "--mix",
      "Content-Type: application/pdf;",
      " name*0*=utf-8''bao%20cao%20;",
      " name*1*=Q1.pdf",
      "Content-Disposition: attachment;",
      " filename*0*=utf-8''bao%20cao%20;",
      " filename*1*=Q1.pdf",
      "Content-Transfer-Encoding: base64",
      "",
      pdfPayload,
      "--mix",
      "Content-Type: image/png",
      'Content-Disposition: inline; filename="logo.png"',
      "Content-ID: <logo@iai>",
      "Content-Transfer-Encoding: base64",
      "",
      inlinePayload,
      "--mix--",
      ""
    ].join("\r\n"),
    "utf8"
  );
}

test("stub backend authenticates and normalizes a valid message", async () => {
  const config = createConfig();
  const dependencies = createStubMailSmtpDependencies(config);

  const auth = await dependencies.authenticate({
    method: "LOGIN",
    password: "dev-secret",
    secure: true,
    username: "smtp-dev"
  });

  assert.equal(auth.workspaceId, "ws_dev");
  assert.deepEqual(auth.allowedStreams, ["transactional", "system"]);

  const mailFromDecision = await dependencies.authorizeMailFrom({
    address: "no-reply@tx.iai.one",
    auth,
    secure: true
  });

  assert.equal(mailFromDecision.ok, true);

  const recipientDecision = await dependencies.authorizeRecipient({
    auth,
    envelopeFrom: "no-reply@tx.iai.one",
    recipient: "user@example.com",
    recipientCount: 1,
    stream: "transactional"
  });

  assert.equal(recipientDecision.ok, true);

  const message = await dependencies.normalizeMessage({
    auth,
    envelopeFrom: "no-reply@tx.iai.one",
    rawMime: createMime({
      from: "IAI <no-reply@tx.iai.one>",
      streamHeader: "system",
      subject: "Smoke"
    }),
    recipients: ["user@example.com"],
    stream: "transactional"
  });

  assert.equal(message.headerFrom, "no-reply@tx.iai.one");
  assert.match(message.messageId, /^msg_/u);
  assert.match(message.traceId, /^trace_/u);
  assert.match(message.smtpSessionId, /^smtp_/u);
  assert.equal(message.stream, "system");
  assert.equal(message.subject, "Smoke");
  assert.equal(message.text, "hello");

  const queued = await dependencies.publishToQueue(message);
  assert.equal(queued.messageId, message.messageId);
  assert.equal(queued.providerRoute, "transactional_primary");
  assert.equal(queued.traceId, message.traceId);
});

test("stub backend rejects invalid credentials, sender, suppressed recipient, and invalid stream", async () => {
  const config = createConfig();
  const dependencies = createStubMailSmtpDependencies(config);

  await assert.rejects(
    () =>
      dependencies.authenticate({
        method: "LOGIN",
        password: "wrong-secret",
        secure: true,
        username: "smtp-dev"
      }),
    /Invalid SMTP credentials/u
  );

  const auth = await dependencies.authenticate({
    method: "LOGIN",
    password: "dev-secret",
    secure: true,
    username: "smtp-dev"
  });

  const senderDecision = await dependencies.authorizeMailFrom({
    address: "fake@unknown-domain.com",
    auth,
    secure: true
  });
  assert.deepEqual(senderDecision, {
    ok: false,
    reason: "Sender identity fake@unknown-domain.com is not allowed",
    smtpCode: 550
  });

  const recipientDecision = await dependencies.authorizeRecipient({
    auth,
    envelopeFrom: "no-reply@tx.iai.one",
    recipient: "blocked@example.com",
    recipientCount: 1,
    stream: "transactional"
  });
  assert.deepEqual(recipientDecision, {
    ok: false,
    reason: "Recipient blocked@example.com is suppressed",
    smtpCode: 550
  });

  await assert.rejects(
    () =>
      dependencies.normalizeMessage({
        auth,
        envelopeFrom: "no-reply@tx.iai.one",
        rawMime: createMime({
          from: "IAI <no-reply@tx.iai.one>",
          streamHeader: "marketing",
          subject: "Bad stream"
        }),
        recipients: ["user@example.com"],
        stream: "transactional"
      }),
    /not allowed for this credential/u
  );
});

test("stub backend parses multipart MIME into common normalized payload with trace fields", async () => {
  const config = createConfig();
  const dependencies = createStubMailSmtpDependencies(config);
  const auth = await dependencies.authenticate({
    method: "LOGIN",
    password: "dev-secret",
    secure: true,
    username: "smtp-dev"
  });

  const message = await dependencies.normalizeMessage({
    auth,
    envelopeFrom: "no-reply@tx.iai.one",
    rawMime: createMultipartMime(),
    recipients: ["user@example.com"],
    smtpSessionId: "smtp_test_123",
    stream: "transactional",
    submittedAt: "2026-04-14T10:00:00.000Z",
    traceId: "trace_test_123"
  });

  assert.equal(message.messageIdempotencyKey, "trace_test_123");
  assert.equal(message.traceId, "trace_test_123");
  assert.equal(message.smtpSessionId, "smtp_test_123");
  assert.equal(message.submittedAt, "2026-04-14T10:00:00.000Z");
  assert.equal(message.source, "smtp");
  assert.equal(message.subject, "Hello from SMTP");
  assert.equal(message.headerMessageId, "<header-msg-123@tx.iai.one>");
  assert.equal(message.from?.email, "no-reply@tx.iai.one");
  assert.equal(message.from?.name, "IAI Ops");
  assert.equal(message.replyTo?.email, "support@iai.one");
  assert.equal(message.to[0]?.email, "user@example.com");
  assert.equal(message.cc[0]?.email, "audit@example.com");
  assert.equal(message.bcc[0]?.email, "hidden@example.com");
  assert.equal(message.text, "Hello from SMTP");
  assert.equal(message.html, "<p>Hello from SMTP</p>");
  assert.equal(message.attachments.length, 1);
  assert.equal(message.attachments[0]?.filename, "guide.pdf");
  assert.equal(message.attachments[0]?.contentType, "application/pdf");
  assert.ok((message.attachments[0]?.sizeBytes ?? 0) > 0);

  const queued = await dependencies.publishToQueue(message);
  assert.equal(queued.messageId, message.messageId);
  assert.equal(queued.traceId, "trace_test_123");
  assert.equal(queued.smtpSessionId, "smtp_test_123");
  assert.match(queued.messageEventId ?? "", /^evt_/u);
});

test("stub backend parses multipart MIME into the normalized message model", async () => {
  const config = createConfig();
  const dependencies = createStubMailSmtpDependencies(config);

  const auth = await dependencies.authenticate({
    method: "LOGIN",
    password: "dev-secret",
    secure: true,
    username: "smtp-dev"
  });

  const message = await dependencies.normalizeMessage({
    auth,
    envelopeFrom: "no-reply@tx.iai.one",
    rawMime: createEncodedMultipartMime(),
    recipients: ["user@example.com"],
    stream: "transactional"
  });

  assert.equal(message.stream, "system");
  assert.equal(message.headerFrom, "no-reply@tx.iai.one");
  assert.equal(message.from?.name, "IAI Hệ thống");
  assert.equal(message.subject, "Báo cáo tháng 4");
  assert.equal(message.headerMessageId, "<message-123@tx.iai.one>");
  assert.equal(message.replyTo?.email, "support@iai.one");
  assert.equal(message.cc[0]?.name, "Người Cùng nhóm");
  assert.equal(message.bcc[0]?.email, "hidden@example.com");
  assert.match(message.text ?? "", /Xin chào đội ngũ IAI/u);
  assert.match(message.html ?? "", /<strong>đội ngũ IAI<\/strong>/u);
  assert.equal(message.attachments.length, 2);
  assert.equal(message.attachments[0]?.filename, "bao cao Q1.pdf");
  assert.equal(message.attachments[0]?.inline, false);
  assert.equal(message.attachments[0]?.contentType, "application/pdf");
  assert.equal(message.attachments[1]?.filename, "logo.png");
  assert.equal(message.attachments[1]?.inline, true);
  assert.equal(message.attachments[1]?.contentId, "logo@iai");
});

test("stub backend rejects an invalid Header From override during normalization", async () => {
  const config = createConfig();
  const dependencies = createStubMailSmtpDependencies(config);

  const auth = await dependencies.authenticate({
    method: "LOGIN",
    password: "dev-secret",
    secure: true,
    username: "smtp-dev"
  });

  await assert.rejects(
    () =>
      dependencies.normalizeMessage({
        auth,
        envelopeFrom: "no-reply@tx.iai.one",
        rawMime: createMime({
          from: "Marketing <news@news.iai.one>",
          streamHeader: "system",
          subject: "Header override"
        }),
        recipients: ["user@example.com"],
        stream: "transactional"
      }),
    /Header From news@news\.iai\.one is not allowed/u
  );
});

test("runtime stats snapshot tracks counters deterministically", () => {
  const stats = createRuntimeStats();

  stats.sessionOpened();
  stats.recordAuthSuccess();
  stats.recordMailFromAccepted();
  stats.recordRecipientAccepted();
  stats.recordMessageQueued("msg_123");
  stats.recordRejection("suppressed", 550);
  stats.sessionClosed();

  const snapshot = stats.snapshot();
  assert.equal(snapshot.activeSessions, 0);
  assert.equal(snapshot.authSuccessCount, 1);
  assert.equal(snapshot.mailFromAcceptedCount, 1);
  assert.equal(snapshot.recipientAcceptedCount, 1);
  assert.equal(snapshot.messageQueuedCount, 1);
  assert.equal(snapshot.lastQueuedMessageId, "msg_123");
  assert.equal(snapshot.rejectionCount, 1);
  assert.equal(snapshot.lastError?.code, 550);
});
