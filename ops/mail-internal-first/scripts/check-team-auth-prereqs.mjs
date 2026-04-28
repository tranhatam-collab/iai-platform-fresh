#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);

const option = (name, fallback) => {
  const flag = `--${name}`;
  const index = args.indexOf(flag);
  if (index === -1) {
    return fallback;
  }
  return args[index + 1] ?? fallback;
};

const filePath = resolve(
  option(
    "file",
    "ops/mail-internal-first/runtime-state/team-auth-wave2-prereqs.json"
  )
);

const errors = [];

let payload;
try {
  payload = JSON.parse(readFileSync(filePath, "utf8"));
} catch (error) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: "prereq_file_unreadable",
        file: filePath,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
}

const ensureString = (value, path) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${path} must be a non-empty string`);
  }
};

const ensureEmail = (value, path) => {
  ensureString(value, path);
  if (typeof value === "string" && value.trim().length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(value)) {
    errors.push(`${path} must be a valid email`);
  }
};

const ensurePositiveInt = (value, path, allowZero = false) => {
  if (!Number.isInteger(value)) {
    errors.push(`${path} must be an integer`);
    return;
  }
  if (allowZero ? value < 0 : value <= 0) {
    errors.push(`${path} must be ${allowZero ? ">= 0" : "> 0"}`);
  }
};

const credentials = payload?.credentials ?? {};
ensureString(credentials.smtpCredentialId, "credentials.smtpCredentialId");
ensureEmail(credentials.smtpSender, "credentials.smtpSender");
ensureEmail(credentials.gmailInboxAddress, "credentials.gmailInboxAddress");
ensureEmail(credentials.outlookInboxAddress, "credentials.outlookInboxAddress");

const trigger = payload?.trigger ?? {};
ensureString(trigger.appSurface, "trigger.appSurface");
ensureString(trigger.vpsHost, "trigger.vpsHost");
ensureString(trigger.command, "trigger.command");
ensureString(trigger.owner, "trigger.owner");
if (trigger.nonLocalOnly !== true) {
  errors.push("trigger.nonLocalOnly must be true");
}

const ttl = payload?.ttlPolicy ?? {};
ensurePositiveInt(ttl.magicLinkMinutes, "ttlPolicy.magicLinkMinutes");
ensurePositiveInt(ttl.resetPasswordMinutes, "ttlPolicy.resetPasswordMinutes");
ensurePositiveInt(ttl.emailVerificationMinutes, "ttlPolicy.emailVerificationMinutes");
ensurePositiveInt(ttl.securityNoticeMinutes, "ttlPolicy.securityNoticeMinutes", true);
ensureString(ttl.sourceOfTruth, "ttlPolicy.sourceOfTruth");
ensureString(ttl.approvedBy, "ttlPolicy.approvedBy");

if (errors.length > 0) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: "team_auth_wave2_prereqs_missing_or_invalid",
        file: filePath,
        errors
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      reason: "team_auth_wave2_prereqs_ready",
      file: filePath,
      summary: {
        smtpCredentialId: credentials.smtpCredentialId,
        smtpSender: credentials.smtpSender,
        gmailInboxAddress: credentials.gmailInboxAddress,
        outlookInboxAddress: credentials.outlookInboxAddress,
        triggerSurface: trigger.appSurface,
        triggerHost: trigger.vpsHost,
        ttlPolicy: {
          magicLinkMinutes: ttl.magicLinkMinutes,
          resetPasswordMinutes: ttl.resetPasswordMinutes,
          emailVerificationMinutes: ttl.emailVerificationMinutes,
          securityNoticeMinutes: ttl.securityNoticeMinutes,
          sourceOfTruth: ttl.sourceOfTruth,
          approvedBy: ttl.approvedBy
        }
      }
    },
    null,
    2
  )
);
