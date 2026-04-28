import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

import {
  EXPECTED_DOMAINS,
  extractActiveBoardTable,
  readPayGateVerdict,
  validateIntakeBoard
} from "../../scripts/pay-team-d-intake-board-check.mjs";

const root = process.cwd();

test("Team D intake board covers the locked 17-row scope and passes validation", async () => {
  const boardPath = path.join(root, "docs", "PAY_IAI_ONE_SITE_PAYMENT_ACTIVATION_INTAKE_BOARD_2026.md");
  const gatePath = path.join(root, "docs", "reports", "team1", "PAY_IAI_ONE_GATE_VERDICT_2026-04-22.md");

  const [boardBody, gateBody] = await Promise.all([
    readFile(boardPath, "utf8"),
    readFile(gatePath, "utf8")
  ]);

  const board = extractActiveBoardTable(boardBody);
  const validation = validateIntakeBoard({
    headers: board.headers,
    rows: board.rows,
    payGateVerdict: readPayGateVerdict(gateBody)
  });

  assert.equal(board.rows.length, EXPECTED_DOMAINS.length);
  assert.equal(validation.pass, true);
});

test("Team D onboarding forms include activation routing and sender package intake fields", async () => {
  const vnFormPath = path.join(
    root,
    "docs",
    "PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md"
  );
  const internationalFormPath = path.join(
    root,
    "docs",
    "PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md"
  );

  const [vnForm, internationalForm] = await Promise.all([
    readFile(vnFormPath, "utf8"),
    readFile(internationalFormPath, "utf8")
  ]);

  const requiredTokens = [
    "activation-routing and sender-package form",
    "checkout_return_url:",
    "checkout_cancel_url:",
    "x_site_key_reference:",
    "x_idempotency_key_strategy:",
    "EMAIL_FROM_PAY:",
    "EMAIL_FROM_BILLING:",
    "EMAIL_REPLY_TO_SUPPORT:",
    "pay_inbox_address:",
    "support_inbox_address:"
  ];

  requiredTokens.forEach((token) => {
    assert.match(vnForm, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(internationalForm, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});

test("tranhatam.com payment email live checklist locks sender policy and external evidence gate", async () => {
  const checklistPath = path.join(
    root,
    "docs",
    "reports",
    "teamd",
    "TRANHATAM_COM_PAYMENT_EMAIL_LIVE_CHECKLIST_2026-04-22.md"
  );
  const checklist = await readFile(checklistPath, "utf8");

  const requiredTokens = [
    "pay@tranhatam.com",
    "billing@tranhatam.com",
    "support@tranhatam.com",
    "noreply@tranhatam.com",
    "payment receipt uses `pay@tranhatam.com`",
    "billing, failed-payment, and refund mail uses `billing@tranhatam.com`",
    "reply-to always uses `support@tranhatam.com`",
    "`noreply@tranhatam.com` must not be used for payment mail",
    "set runtime SMTP or `MAIL_API` for the payment sender path",
    "connect the live `tranhatam.com` payment surface to `/api/payment-routing`",
    "SMTP `messageId`",
    "D1 row",
    "inbox proof",
    "`tranhatam.com payment email live` must not be claimed until all five external steps above are complete."
  ];

  requiredTokens.forEach((token) => {
    assert.match(checklist, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
