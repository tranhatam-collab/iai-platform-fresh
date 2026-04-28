import { randomUUID } from "node:crypto";

import type { MailQueueAddress, MailQueueSubmitPayload } from "./mail-queue.js";

/**
 * Wave 2 Auth Content Templates
 * Covers the four auth transactional email flows:
 * - magic_link_login
 * - reset_password
 * - email_verification
 * - security_notice
 */

export type Wave2AuthFlowCode =
  | "magic_link_login"
  | "reset_password"
  | "email_verification"
  | "security_notice";

export type Wave2AuthLocale = "vi" | "en";

export interface Wave2AuthConfig {
  credentialId: string;
  fromMailbox: MailQueueAddress;
  recipients: MailQueueAddress[];
  replyTo?: MailQueueAddress;
  senderIdentityId?: string;
  workspaceId: string;
}

export interface Wave2AuthTtlPolicy {
  magicLinkMinutes: number;
  resetPasswordMinutes: number;
  emailVerificationMinutes: number;
  securityNoticeMinutes: number;
}

export const DEFAULT_AUTH_TTL_POLICY: Wave2AuthTtlPolicy = {
  magicLinkMinutes: 10,
  resetPasswordMinutes: 30,
  emailVerificationMinutes: 1440,
  securityNoticeMinutes: 0
};

// ─── Magic Link Login ────────────────────────────────────────────────────────

export interface MagicLinkLoginInput {
  recipientEmail: string;
  recipientName?: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
  brandName: string;
  supportEmail: string;
  ipAddress?: string;
  userAgent?: string;
  requestedAt: string;
}

export function buildMagicLinkLoginPayload(
  locale: Wave2AuthLocale,
  input: MagicLinkLoginInput,
  config: Wave2AuthConfig
): MailQueueSubmitPayload {
  const traceId = `trace_${randomUUID()}`;
  const messageId = `msg_${randomUUID()}`;
  const submittedAt = new Date().toISOString();

  const subjectVi = `${input.brandName} | Đăng nhập bằng liên kết an toàn`;
  const subjectEn = `${input.brandName} | Sign in with secure link`;
  const subject = locale === "vi" ? `${subjectVi} / ${subjectEn}` : `${subjectEn} / ${subjectVi}`;

  const text = buildMagicLinkText(input);
  const html = buildMagicLinkHtml(input, subject);

  return buildAuthPayload({
    flowCode: "magic_link_login",
    traceId,
    messageId,
    submittedAt,
    subject,
    text,
    html,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    config
  });
}

function buildMagicLinkText(input: MagicLinkLoginInput): string {
  return `Xin chào${input.recipientName ? ` ${input.recipientName}` : ""},

Bạn vừa yêu cầu đăng nhập vào ${input.brandName}. Nhấp vào liên kết bên dưới để tiếp tục:

${input.magicLinkUrl}

Liên kết này có hiệu lực trong ${input.expiresInMinutes} phút.

Nếu bạn không yêu cầu đăng nhập này, hãy bỏ qua email này hoặc liên hệ:
${input.supportEmail}

Trân trọng,
${input.brandName}

---

Hello${input.recipientName ? ` ${input.recipientName}` : ""},

You requested to sign in to ${input.brandName}. Click the link below to continue:

${input.magicLinkUrl}

This link expires in ${input.expiresInMinutes} minutes.

If you did not request this sign-in, ignore this email or contact:
${input.supportEmail}

Best regards,
${input.brandName}`;
}

function buildMagicLinkHtml(input: MagicLinkLoginInput, subject: string): string {
  return buildAuthHtmlWrapper(subject, `
    <p>Xin chào${input.recipientName ? ` ${escapeHtml(input.recipientName)}` : ""},</p>
    <p>Bạn vừa yêu cầu đăng nhập vào ${escapeHtml(input.brandName)}.</p>
    <p style="margin:24px 0;">
      <a href="${escapeHtml(input.magicLinkUrl)}" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
        Đăng nhập / Sign in
      </a>
    </p>
    <p style="color:#666;font-size:14px;">Liên kết có hiệu lực trong ${input.expiresInMinutes} phút. / Link expires in ${input.expiresInMinutes} minutes.</p>
    ${input.ipAddress ? `<p style="color:#999;font-size:12px;">IP: ${escapeHtml(input.ipAddress)}${input.userAgent ? ` | ${escapeHtml(input.userAgent)}` : ""}</p>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#666;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này. / If you did not request this, ignore this email.</p>
    <p style="color:#666;font-size:13px;">Hỗ trợ / Support: ${escapeHtml(input.supportEmail)}</p>
  `);
}

// ─── Reset Password ──────────────────────────────────────────────────────────

export interface ResetPasswordInput {
  recipientEmail: string;
  recipientName?: string;
  resetUrl: string;
  expiresInMinutes: number;
  brandName: string;
  supportEmail: string;
  ipAddress?: string;
  requestedAt: string;
}

export function buildResetPasswordPayload(
  locale: Wave2AuthLocale,
  input: ResetPasswordInput,
  config: Wave2AuthConfig
): MailQueueSubmitPayload {
  const traceId = `trace_${randomUUID()}`;
  const messageId = `msg_${randomUUID()}`;
  const submittedAt = new Date().toISOString();

  const subjectVi = `${input.brandName} | Đặt lại mật khẩu`;
  const subjectEn = `${input.brandName} | Reset your password`;
  const subject = locale === "vi" ? `${subjectVi} / ${subjectEn}` : `${subjectEn} / ${subjectVi}`;

  const text = buildResetPasswordText(input);
  const html = buildResetPasswordHtml(input, subject);

  return buildAuthPayload({
    flowCode: "reset_password",
    traceId,
    messageId,
    submittedAt,
    subject,
    text,
    html,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    config
  });
}

function buildResetPasswordText(input: ResetPasswordInput): string {
  return `Xin chào${input.recipientName ? ` ${input.recipientName}` : ""},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${input.brandName} của bạn.

Nhấp vào liên kết bên dưới để đặt mật khẩu mới:

${input.resetUrl}

Liên kết này có hiệu lực trong ${input.expiresInMinutes} phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu hiện tại của bạn vẫn an toàn.

Hỗ trợ: ${input.supportEmail}

Trân trọng,
${input.brandName}

---

Hello${input.recipientName ? ` ${input.recipientName}` : ""},

We received a request to reset the password for your ${input.brandName} account.

Click the link below to set a new password:

${input.resetUrl}

This link expires in ${input.expiresInMinutes} minutes.

If you did not request a password reset, ignore this email. Your current password remains safe.

Support: ${input.supportEmail}

Best regards,
${input.brandName}`;
}

function buildResetPasswordHtml(input: ResetPasswordInput, subject: string): string {
  return buildAuthHtmlWrapper(subject, `
    <p>Xin chào${input.recipientName ? ` ${escapeHtml(input.recipientName)}` : ""},</p>
    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${escapeHtml(input.brandName)} của bạn.</p>
    <p style="margin:24px 0;">
      <a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;padding:12px 24px;background:#d93025;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
        Đặt lại mật khẩu / Reset password
      </a>
    </p>
    <p style="color:#666;font-size:14px;">Liên kết có hiệu lực trong ${input.expiresInMinutes} phút. / Link expires in ${input.expiresInMinutes} minutes.</p>
    ${input.ipAddress ? `<p style="color:#999;font-size:12px;">IP: ${escapeHtml(input.ipAddress)}</p>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#666;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại vẫn an toàn.</p>
    <p style="color:#666;font-size:13px;">If you did not request this, ignore this email. Your current password remains safe.</p>
    <p style="color:#666;font-size:13px;">Hỗ trợ / Support: ${escapeHtml(input.supportEmail)}</p>
  `);
}

// ─── Email Verification ──────────────────────────────────────────────────────

export interface EmailVerificationInput {
  recipientEmail: string;
  recipientName?: string;
  verificationUrl: string;
  expiresInMinutes: number;
  brandName: string;
  supportEmail: string;
  requestedAt: string;
}

export function buildEmailVerificationPayload(
  locale: Wave2AuthLocale,
  input: EmailVerificationInput,
  config: Wave2AuthConfig
): MailQueueSubmitPayload {
  const traceId = `trace_${randomUUID()}`;
  const messageId = `msg_${randomUUID()}`;
  const submittedAt = new Date().toISOString();

  const subjectVi = `${input.brandName} | Xác minh địa chỉ email của bạn`;
  const subjectEn = `${input.brandName} | Verify your email address`;
  const subject = locale === "vi" ? `${subjectVi} / ${subjectEn}` : `${subjectEn} / ${subjectVi}`;

  const text = buildEmailVerificationText(input);
  const html = buildEmailVerificationHtml(input, subject);

  return buildAuthPayload({
    flowCode: "email_verification",
    traceId,
    messageId,
    submittedAt,
    subject,
    text,
    html,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    config
  });
}

function buildEmailVerificationText(input: EmailVerificationInput): string {
  return `Xin chào${input.recipientName ? ` ${input.recipientName}` : ""},

Cảm ơn bạn đã đăng ký ${input.brandName}. Vui lòng xác minh địa chỉ email bằng cách nhấp vào liên kết bên dưới:

${input.verificationUrl}

Liên kết này có hiệu lực trong ${input.expiresInMinutes} phút.

Nếu bạn không đăng ký tài khoản ${input.brandName}, hãy bỏ qua email này.

Hỗ trợ: ${input.supportEmail}

Trân trọng,
${input.brandName}

---

Hello${input.recipientName ? ` ${input.recipientName}` : ""},

Thank you for signing up for ${input.brandName}. Please verify your email address by clicking the link below:

${input.verificationUrl}

This link expires in ${input.expiresInMinutes} minutes.

If you did not create a ${input.brandName} account, ignore this email.

Support: ${input.supportEmail}

Best regards,
${input.brandName}`;
}

function buildEmailVerificationHtml(input: EmailVerificationInput, subject: string): string {
  return buildAuthHtmlWrapper(subject, `
    <p>Xin chào${input.recipientName ? ` ${escapeHtml(input.recipientName)}` : ""},</p>
    <p>Cảm ơn bạn đã đăng ký ${escapeHtml(input.brandName)}. Vui lòng xác minh địa chỉ email của bạn.</p>
    <p>Thank you for signing up for ${escapeHtml(input.brandName)}. Please verify your email address.</p>
    <p style="margin:24px 0;">
      <a href="${escapeHtml(input.verificationUrl)}" style="display:inline-block;padding:12px 24px;background:#0d904f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
        Xác minh email / Verify email
      </a>
    </p>
    <p style="color:#666;font-size:14px;">Liên kết có hiệu lực trong ${input.expiresInMinutes} phút. / Link expires in ${input.expiresInMinutes} minutes.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#666;font-size:13px;">Nếu bạn không đăng ký, hãy bỏ qua email này. / If you did not sign up, ignore this email.</p>
    <p style="color:#666;font-size:13px;">Hỗ trợ / Support: ${escapeHtml(input.supportEmail)}</p>
  `);
}

// ─── Security Notice ─────────────────────────────────────────────────────────

export type SecurityNoticeEventType =
  | "new_device_login"
  | "password_changed"
  | "email_changed"
  | "mfa_enabled"
  | "mfa_disabled"
  | "account_locked"
  | "suspicious_activity";

export interface SecurityNoticeInput {
  recipientEmail: string;
  recipientName?: string;
  eventType: SecurityNoticeEventType;
  eventDescription: string;
  brandName: string;
  supportEmail: string;
  securityUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  occurredAt: string;
}

export function buildSecurityNoticePayload(
  locale: Wave2AuthLocale,
  input: SecurityNoticeInput,
  config: Wave2AuthConfig
): MailQueueSubmitPayload {
  const traceId = `trace_${randomUUID()}`;
  const messageId = `msg_${randomUUID()}`;
  const submittedAt = new Date().toISOString();

  const eventLabel = getSecurityEventLabel(input.eventType, locale);
  const subjectVi = `${input.brandName} | Thông báo bảo mật: ${eventLabel.vi}`;
  const subjectEn = `${input.brandName} | Security notice: ${eventLabel.en}`;
  const subject = locale === "vi" ? `${subjectVi} / ${subjectEn}` : `${subjectEn} / ${subjectVi}`;

  const text = buildSecurityNoticeText(input, eventLabel);
  const html = buildSecurityNoticeHtml(input, eventLabel, subject);

  return buildAuthPayload({
    flowCode: "security_notice",
    traceId,
    messageId,
    submittedAt,
    subject,
    text,
    html,
    recipientEmail: input.recipientEmail,
    recipientName: input.recipientName,
    config
  });
}

function getSecurityEventLabel(
  eventType: SecurityNoticeEventType,
  _locale: Wave2AuthLocale
): { vi: string; en: string } {
  const labels: Record<SecurityNoticeEventType, { vi: string; en: string }> = {
    new_device_login: { vi: "Đăng nhập từ thiết bị mới", en: "New device login" },
    password_changed: { vi: "Mật khẩu đã thay đổi", en: "Password changed" },
    email_changed: { vi: "Email đã thay đổi", en: "Email changed" },
    mfa_enabled: { vi: "Xác thực hai yếu tố đã bật", en: "Two-factor authentication enabled" },
    mfa_disabled: { vi: "Xác thực hai yếu tố đã tắt", en: "Two-factor authentication disabled" },
    account_locked: { vi: "Tài khoản đã bị khóa", en: "Account locked" },
    suspicious_activity: { vi: "Hoạt động đáng ngờ", en: "Suspicious activity detected" }
  };
  return labels[eventType];
}

function buildSecurityNoticeText(
  input: SecurityNoticeInput,
  eventLabel: { vi: string; en: string }
): string {
  const details = [
    `Sự kiện / Event: ${eventLabel.vi} / ${eventLabel.en}`,
    `Thời gian / Time: ${input.occurredAt}`
  ];
  if (input.ipAddress) details.push(`IP: ${input.ipAddress}`);
  if (input.location) details.push(`Vị trí / Location: ${input.location}`);
  if (input.userAgent) details.push(`Thiết bị / Device: ${input.userAgent}`);

  return `Xin chào${input.recipientName ? ` ${input.recipientName}` : ""},

${input.brandName} ghi nhận một thay đổi bảo mật trên tài khoản của bạn.

${details.join("\n")}

${input.eventDescription}

${input.securityUrl ? `Kiểm tra cài đặt bảo mật / Review security settings:\n${input.securityUrl}\n` : ""}
Nếu bạn không thực hiện thay đổi này, hãy liên hệ ngay:
${input.supportEmail}

Trân trọng,
${input.brandName}

---

Hello${input.recipientName ? ` ${input.recipientName}` : ""},

${input.brandName} recorded a security change on your account.

${details.join("\n")}

${input.eventDescription}

${input.securityUrl ? `Review security settings:\n${input.securityUrl}\n` : ""}
If you did not make this change, contact us immediately:
${input.supportEmail}

Best regards,
${input.brandName}`;
}

function buildSecurityNoticeHtml(
  input: SecurityNoticeInput,
  eventLabel: { vi: string; en: string },
  subject: string
): string {
  const detailRows = [
    `<tr><td style="padding:8px 12px;color:#666;">Sự kiện / Event</td><td style="padding:8px 12px;">${escapeHtml(eventLabel.vi)} / ${escapeHtml(eventLabel.en)}</td></tr>`,
    `<tr><td style="padding:8px 12px;color:#666;">Thời gian / Time</td><td style="padding:8px 12px;">${escapeHtml(input.occurredAt)}</td></tr>`
  ];
  if (input.ipAddress) {
    detailRows.push(`<tr><td style="padding:8px 12px;color:#666;">IP</td><td style="padding:8px 12px;">${escapeHtml(input.ipAddress)}</td></tr>`);
  }
  if (input.location) {
    detailRows.push(`<tr><td style="padding:8px 12px;color:#666;">Vị trí / Location</td><td style="padding:8px 12px;">${escapeHtml(input.location)}</td></tr>`);
  }
  if (input.userAgent) {
    detailRows.push(`<tr><td style="padding:8px 12px;color:#666;">Thiết bị / Device</td><td style="padding:8px 12px;font-size:13px;">${escapeHtml(input.userAgent)}</td></tr>`);
  }

  return buildAuthHtmlWrapper(subject, `
    <p>Xin chào${input.recipientName ? ` ${escapeHtml(input.recipientName)}` : ""},</p>
    <p>${escapeHtml(input.brandName)} ghi nhận một thay đổi bảo mật trên tài khoản của bạn.</p>
    <p>${escapeHtml(input.brandName)} recorded a security change on your account.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee;border-radius:8px;">
      ${detailRows.join("")}
    </table>
    <p>${escapeHtml(input.eventDescription)}</p>
    ${input.securityUrl ? `
    <p style="margin:24px 0;">
      <a href="${escapeHtml(input.securityUrl)}" style="display:inline-block;padding:12px 24px;background:#f29900;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
        Kiểm tra bảo mật / Review security
      </a>
    </p>` : ""}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="color:#d93025;font-size:14px;font-weight:bold;">Nếu bạn không thực hiện thay đổi này, hãy liên hệ ngay. / If you did not make this change, contact us immediately.</p>
    <p style="color:#666;font-size:13px;">Hỗ trợ / Support: ${escapeHtml(input.supportEmail)}</p>
  `);
}

// ─── Shared Helpers ──────────────────────────────────────────────────────────

interface AuthPayloadParams {
  flowCode: Wave2AuthFlowCode;
  traceId: string;
  messageId: string;
  submittedAt: string;
  subject: string;
  text: string;
  html: string;
  recipientEmail: string;
  recipientName?: string;
  config: Wave2AuthConfig;
}

function buildAuthPayload(params: AuthPayloadParams): MailQueueSubmitPayload {
  if (params.config.recipients.length === 0) {
    throw new Error(`Wave2 auth ${params.flowCode} requires at least one recipient.`);
  }

  const recipient: MailQueueAddress = params.recipientName
    ? { email: params.recipientEmail, name: params.recipientName }
    : { email: params.recipientEmail };

  return {
    attachments: [],
    bcc: [],
    cc: [],
    credentialId: params.config.credentialId,
    envelopeFrom: params.config.fromMailbox.email,
    from: params.config.fromMailbox,
    headerFrom: formatMailbox(params.config.fromMailbox),
    headerMessageId: `<${params.messageId}@${extractDomain(params.config.fromMailbox.email)}>`,
    headers: {
      "x-iai-auth-flow": params.flowCode
    },
    html: params.html,
    messageId: params.messageId,
    messageIdempotencyKey: `${params.flowCode}:${params.recipientEmail}:${params.submittedAt}`,
    recipients: [params.recipientEmail],
    replyTo: params.config.replyTo,
    senderIdentityId: params.config.senderIdentityId,
    source: "api",
    stream: "transactional",
    submittedAt: params.submittedAt,
    subject: params.subject,
    text: params.text,
    to: [recipient],
    traceId: params.traceId,
    workspaceId: params.config.workspaceId
  };
}

function buildAuthHtmlWrapper(subject: string, body: string): string {
  return [
    "<!doctype html>",
    '<html lang="vi">',
    '<body style="font-family:Arial,sans-serif;color:#18211f;line-height:1.6;background:#f7f7f5;padding:24px;">',
    '<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dde4de;border-radius:16px;padding:32px;">',
    `<h1 style="margin-top:0;font-size:20px;color:#18211f;">${escapeHtml(subject)}</h1>`,
    body,
    "</div>",
    "</body>",
    "</html>"
  ].join("");
}

function formatMailbox(address: MailQueueAddress): string {
  return address.name ? `${address.name} <${address.email}>` : address.email;
}

function extractDomain(email: string): string {
  return email.includes("@") ? email.split("@").pop() || "iai.one" : "iai.one";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
