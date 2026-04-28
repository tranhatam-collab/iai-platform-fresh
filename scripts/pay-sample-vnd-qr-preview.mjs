import { mkdirSync, writeFileSync } from "node:fs";
import { buildVietQrQuickLink, getPaymentReceiverRegistrySnapshot } from "../apps/pay/dist/payment-routing.js";

const timezone = "Asia/Ho_Chi_Minh";

function todayInTimezone(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date());
}

function getDateArg() {
  const explicit = process.argv.find((argument) => argument.startsWith("--date="));
  return explicit ? explicit.slice("--date=".length) : todayInTimezone(timezone);
}

const dateTag = getDateArg();
const outputDir = "docs/reports/team1";
const outputPath = `${outputDir}/PAY_IAI_ONE_SAMPLE_DYNAMIC_VND_QR_PREVIEW_${dateTag}.md`;

const sampleConfigs = [
  {
    amount: 150000,
    receiverId: "recv_vnd_personal_tranhatam_acb",
    sampleLabel: "Sample A",
    transferNote: "TRIAL A1"
  },
  {
    amount: 275000,
    receiverId: "recv_vnd_personal_tranhatam_vcb",
    sampleLabel: "Sample B",
    transferNote: "TRIAL B2"
  },
  {
    amount: 990000,
    receiverId: "recv_vnd_vietuc_toancau_acb",
    sampleLabel: "Sample C",
    transferNote: "TRIAL C3"
  }
];

const snapshot = getPaymentReceiverRegistrySnapshot();
const receiversById = new Map(snapshot.receivers.map((receiver) => [receiver.receiverId, receiver]));

const samples = sampleConfigs.map((sample) => {
  const receiver = receiversById.get(sample.receiverId);

  if (!receiver) {
    throw new Error(`Receiver not found in registry snapshot: ${sample.receiverId}`);
  }

  if (receiver.channelType !== "bank_qr" || receiver.currency !== "VND") {
    throw new Error(`Receiver must be a VND bank_qr sample target: ${sample.receiverId}`);
  }

  const qrUrl = buildVietQrQuickLink({
    accountName: receiver.legalName ?? receiver.displayName,
    accountNumber: receiver.accountNumber ?? "",
    addInfo: sample.transferNote,
    amount: sample.amount,
    bankId: receiver.vietQrBankId ?? receiver.bankName ?? "ACB"
  });

  return {
    ...sample,
    qrUrl,
    receiver
  };
});

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, renderMarkdown(samples), "utf8");
process.stdout.write(`${outputPath}\n`);

function renderMarkdown(entries) {
  const lines = [];
  lines.push(`# PAY_IAI_ONE_SAMPLE_DYNAMIC_VND_QR_PREVIEW_${dateTag}`);
  lines.push(`- Generated at: \`${new Date().toISOString()}\``);
  lines.push(`- Timezone: \`${timezone}\``);
  lines.push(`- Purpose: founder review of 3 sample dynamic VND QR outputs before wider rollout`);
  lines.push(`- Status: \`REVIEW_ONLY_SAMPLE\``);
  lines.push("");
  lines.push("These are sample review QR outputs only.");
  lines.push("They are not founder approval for live assignment beyond the current locked domain map.");
  lines.push("");

  entries.forEach((entry) => {
    lines.push(`## ${entry.sampleLabel}`);
    lines.push(`- receiver_id: \`${entry.receiver.receiverId}\``);
    lines.push(`- display_name: \`${entry.receiver.displayName}\``);
    lines.push(`- bank_name: \`${entry.receiver.bankName ?? "N/A"}\``);
    lines.push(`- account_number: \`${entry.receiver.accountNumber ?? "N/A"}\``);
    lines.push(`- amount_vnd: \`${entry.amount}\``);
    lines.push(`- addInfo: \`${entry.transferNote}\``);
    lines.push(`- quick_link: [Open QR](${entry.qrUrl})`);
    lines.push("");
    lines.push(`![${entry.sampleLabel} QR](${entry.qrUrl})`);
    lines.push("");
  });

  return `${lines.join("\n")}\n`;
}
