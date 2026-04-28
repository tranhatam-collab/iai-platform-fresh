import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_AUTH_TTL_POLICY,
  buildEmailVerificationPayload,
  buildMagicLinkLoginPayload,
  buildResetPasswordPayload,
  buildSecurityNoticePayload
} from "../../packages/mail-core/dist/index.js";

const baseConfig = {
  credentialId: "cred_auth_internal",
  fromMailbox: { email: "noreply@iai.one", name: "IAI Auth" },
  recipients: [{ email: "tranhatam@gmail.com", name: "Trần Hà Tâm" }],
  replyTo: { email: "security@iai.one", name: "IAI Security" },
  workspaceId: "ws_iai_auth"
};

// ─── DEFAULT_AUTH_TTL_POLICY ─────────────────────────────────────────────────

test("DEFAULT_AUTH_TTL_POLICY locks the four flow TTLs", () => {
  assert.equal(DEFAULT_AUTH_TTL_POLICY.magicLinkMinutes, 10);
  assert.equal(DEFAULT_AUTH_TTL_POLICY.resetPasswordMinutes, 30);
  assert.equal(DEFAULT_AUTH_TTL_POLICY.emailVerificationMinutes, 1440);
  assert.equal(DEFAULT_AUTH_TTL_POLICY.securityNoticeMinutes, 0);
});

// ─── buildMagicLinkLoginPayload ──────────────────────────────────────────────

test("buildMagicLinkLoginPayload locks bilingual content with VI default", () => {
  const payload = buildMagicLinkLoginPayload(
    "vi",
    {
      recipientEmail: "tranhatam@gmail.com",
      recipientName: "Trần Hà Tâm",
      magicLinkUrl: "https://app.iai.one/auth/magic?token=abc123",
      expiresInMinutes: 10,
      brandName: "IAI ONE",
      supportEmail: "support@iai.one",
      ipAddress: "1.2.3.4",
      userAgent: "Mozilla/5.0",
      requestedAt: "2026-04-28T10:00:00.000Z"
    },
    baseConfig
  );

  assert.equal(payload.workspaceId, baseConfig.workspaceId);
  assert.equal(payload.envelopeFrom, baseConfig.fromMailbox.email);
  assert.equal(payload.from?.email, baseConfig.fromMailbox.email);
  assert.equal(payload.headerFrom, "IAI Auth <noreply@iai.one>");
  assert.equal(payload.stream, "transactional");
  assert.equal(payload.source, "api");
  assert.equal(payload.headers?.["x-iai-auth-flow"], "magic_link_login");
  assert.match(payload.subject, /IAI ONE \| Đăng nhập bằng liên kết an toàn/);
  assert.match(payload.subject, /IAI ONE \| Sign in with secure link/);
  assert.match(payload.text, /Bạn vừa yêu cầu đăng nhập vào IAI ONE/);
  assert.match(payload.text, /You requested to sign in to IAI ONE/);
  assert.match(payload.text, /https:\/\/app\.iai\.one\/auth\/magic\?token=abc123/);
  assert.match(payload.text, /Liên kết này có hiệu lực trong 10 phút/);
  assert.match(payload.text, /This link expires in 10 minutes/);
  assert.match(payload.html, /href="https:\/\/app\.iai\.one\/auth\/magic\?token=abc123"/);
  assert.match(payload.html, /<!doctype html>/);
  assert.equal(payload.recipients[0], "tranhatam@gmail.com");
  assert.equal(payload.to[0].email, "tranhatam@gmail.com");
  assert.match(payload.messageIdempotencyKey, /^magic_link_login:tranhatam@gmail\.com:/);
  assert.match(payload.messageId, /^msg_/);
  assert.match(payload.traceId, /^trace_/);
  assert.match(payload.headerMessageId, /@iai\.one>/);
});

test("buildMagicLinkLoginPayload puts EN first when locale=en", () => {
  const payload = buildMagicLinkLoginPayload(
    "en",
    {
      recipientEmail: "user@example.com",
      magicLinkUrl: "https://app.iai.one/auth/magic?token=xyz",
      expiresInMinutes: 5,
      brandName: "IAI ONE",
      supportEmail: "support@iai.one",
      requestedAt: "2026-04-28T10:00:00.000Z"
    },
    baseConfig
  );

  // EN locale puts EN subject before VI subject (mirror inverse of vi case)
  assert.match(payload.subject, /^IAI ONE \| Sign in with secure link/);
});

// ─── buildResetPasswordPayload ───────────────────────────────────────────────

test("buildResetPasswordPayload locks bilingual content with safety reassurance", () => {
  const payload = buildResetPasswordPayload(
    "vi",
    {
      recipientEmail: "tranhatam@gmail.com",
      recipientName: "Trần Hà Tâm",
      resetUrl: "https://app.iai.one/auth/reset?token=reset123",
      expiresInMinutes: 30,
      brandName: "IAI ONE",
      supportEmail: "security@iai.one",
      ipAddress: "1.2.3.4",
      requestedAt: "2026-04-28T10:00:00.000Z"
    },
    baseConfig
  );

  assert.equal(payload.headers?.["x-iai-auth-flow"], "reset_password");
  assert.match(payload.subject, /Đặt lại mật khẩu/);
  assert.match(payload.subject, /Reset your password/);
  assert.match(payload.text, /Mật khẩu hiện tại của bạn vẫn an toàn/);
  assert.match(payload.text, /Your current password remains safe/);
  assert.match(payload.text, /https:\/\/app\.iai\.one\/auth\/reset\?token=reset123/);
  assert.match(payload.text, /Liên kết này có hiệu lực trong 30 phút/);
  assert.match(payload.html, /Reset password/);
  assert.match(payload.messageIdempotencyKey, /^reset_password:tranhatam@gmail\.com:/);
});

// ─── buildEmailVerificationPayload ───────────────────────────────────────────

test("buildEmailVerificationPayload locks bilingual content with verification url", () => {
  const payload = buildEmailVerificationPayload(
    "vi",
    {
      recipientEmail: "newuser@example.com",
      recipientName: "New User",
      verificationUrl: "https://app.iai.one/auth/verify?token=ver123",
      expiresInMinutes: 1440,
      brandName: "IAI ONE",
      supportEmail: "support@iai.one",
      requestedAt: "2026-04-28T10:00:00.000Z"
    },
    baseConfig
  );

  assert.equal(payload.headers?.["x-iai-auth-flow"], "email_verification");
  assert.match(payload.text, /https:\/\/app\.iai\.one\/auth\/verify\?token=ver123/);
  assert.match(payload.html, /https:\/\/app\.iai\.one\/auth\/verify\?token=ver123/);
  assert.match(payload.messageIdempotencyKey, /^email_verification:newuser@example\.com:/);
});

// ─── buildSecurityNoticePayload ──────────────────────────────────────────────

test("buildSecurityNoticePayload locks bilingual labels for new_device_login", () => {
  const payload = buildSecurityNoticePayload(
    "vi",
    {
      recipientEmail: "tranhatam@gmail.com",
      recipientName: "Trần Hà Tâm",
      eventType: "new_device_login",
      eventDescription: "Tài khoản của bạn vừa được đăng nhập từ một thiết bị mới.",
      brandName: "IAI ONE",
      supportEmail: "security@iai.one",
      securityUrl: "https://app.iai.one/security",
      ipAddress: "1.2.3.4",
      userAgent: "Mozilla/5.0",
      location: "Ho Chi Minh City, VN",
      occurredAt: "2026-04-28T10:00:00.000Z"
    },
    baseConfig
  );

  assert.equal(payload.headers?.["x-iai-auth-flow"], "security_notice");
  assert.match(payload.subject, /Thông báo bảo mật.*Đăng nhập từ thiết bị mới/);
  assert.match(payload.subject, /Security notice.*New device login/);
  assert.match(payload.text, /Đăng nhập từ thiết bị mới \/ New device login/);
  assert.match(payload.text, /1\.2\.3\.4/);
  assert.match(payload.text, /Ho Chi Minh City, VN/);
});

test("buildSecurityNoticePayload covers all 7 event types", () => {
  const eventTypes = [
    ["new_device_login", "Đăng nhập từ thiết bị mới", "New device login"],
    ["password_changed", "Mật khẩu đã thay đổi", "Password changed"],
    ["email_changed", "Email đã thay đổi", "Email changed"],
    ["mfa_enabled", "Xác thực hai yếu tố đã bật", "Two-factor authentication enabled"],
    ["mfa_disabled", "Xác thực hai yếu tố đã tắt", "Two-factor authentication disabled"],
    ["account_locked", "Tài khoản đã bị khóa", "Account locked"],
    ["suspicious_activity", "Hoạt động đáng ngờ", "Suspicious activity detected"]
  ];

  for (const [eventType, viLabel, enLabel] of eventTypes) {
    const payload = buildSecurityNoticePayload(
      "vi",
      {
        recipientEmail: "user@example.com",
        eventType,
        eventDescription: "Event description for testing.",
        brandName: "IAI ONE",
        supportEmail: "security@iai.one",
        occurredAt: "2026-04-28T10:00:00.000Z"
      },
      baseConfig
    );
    assert.match(payload.subject, new RegExp(viLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), eventType);
    assert.match(payload.subject, new RegExp(enLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), eventType);
  }
});

// ─── HTML escape ─────────────────────────────────────────────────────────────

test("auth template payloads HTML-escape user-controlled inputs", () => {
  const payload = buildMagicLinkLoginPayload(
    "vi",
    {
      recipientEmail: "user@example.com",
      recipientName: "<script>alert('xss')</script>",
      magicLinkUrl: "https://app.iai.one/auth/magic?token=safe",
      expiresInMinutes: 10,
      brandName: "<b>EvilBrand</b>",
      supportEmail: "support@iai.one",
      requestedAt: "2026-04-28T10:00:00.000Z"
    },
    baseConfig
  );

  // HTML must escape; text body uses raw values (text body is plaintext, not rendered)
  assert.doesNotMatch(payload.html, /<script>alert/);
  assert.match(payload.html, /&lt;script&gt;/);
  assert.doesNotMatch(payload.html, /<b>EvilBrand<\/b>/);
  assert.match(payload.html, /&lt;b&gt;EvilBrand&lt;\/b&gt;/);
});

// ─── Empty recipients guard ──────────────────────────────────────────────────

test("auth payload builders reject empty recipients config", () => {
  const badConfig = { ...baseConfig, recipients: [] };
  assert.throws(
    () =>
      buildMagicLinkLoginPayload(
        "vi",
        {
          recipientEmail: "user@example.com",
          magicLinkUrl: "https://app.iai.one/auth/magic",
          expiresInMinutes: 10,
          brandName: "IAI ONE",
          supportEmail: "support@iai.one",
          requestedAt: "2026-04-28T10:00:00.000Z"
        },
        badConfig
      ),
    /requires at least one recipient/
  );
});
