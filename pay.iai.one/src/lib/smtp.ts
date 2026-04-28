import { connect } from "cloudflare:sockets";
import { nowIso, stringValue } from "./utils";
import { PAYMENT_EMAIL_FLOW_POLICIES, type PaymentEmailFlowCode } from "./email-policy";

const CRLF = "\r\n";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface InternalSmtpEnv {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE_TRANSPORT?: string;
  SMTP_AUTH_MODE?: string;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  SMTP_HELO_DOMAIN?: string;
  EMAIL_FROM_PAY?: string;
  EMAIL_FROM_BILLING?: string;
}

export interface InternalSmtpMessage {
  flowCode: PaymentEmailFlowCode;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string | null;
  messageId?: string | null;
}

export interface InternalSmtpResult {
  ok: boolean;
  transport: "internal_smtp";
  messageId: string;
  sender: string;
  acceptedAt: string | null;
  smtpResponseLines: string[];
  missingEnvKeys: string[];
}

type SecureTransportMode = "ssl" | "starttls" | "plain";
type AuthMode = "login" | "plain";

class SmtpSession {
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  private writer: WritableStreamDefaultWriter<Uint8Array>;

  private buffer = "";

  constructor(private socket: Socket) {
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async writeLine(line: string): Promise<void> {
    await this.writer.write(textEncoder.encode(`${line}${CRLF}`));
  }

  async writeRaw(value: string): Promise<void> {
    await this.writer.write(textEncoder.encode(value));
  }

  async expect(code: number): Promise<string[]> {
    const lines = await this.readResponse();
    const actual = Number.parseInt(lines[0]?.slice(0, 3) || "", 10);
    if (actual !== code) {
      throw new Error(`SMTP expected ${code} but received ${lines.join(" | ")}`);
    }
    return lines;
  }

  async close(): Promise<void> {
    await this.writer.close();
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.socket.close();
  }

  private async readResponse(): Promise<string[]> {
    const lines: string[] = [];

    while (true) {
      const parsed = this.consumeBufferedLines();
      if (parsed.lines.length) {
        lines.push(...parsed.lines);
        if (parsed.complete) return lines;
      }

      const { done, value } = await this.reader.read();
      if (done) {
        if (lines.length) return lines;
        throw new Error("SMTP connection closed before a complete response was received.");
      }
      this.buffer += textDecoder.decode(value, { stream: true });
    }
  }

  private consumeBufferedLines(): { lines: string[]; complete: boolean } {
    const lines: string[] = [];
    let complete = false;

    while (true) {
      const separatorIndex = this.buffer.indexOf(CRLF);
      if (separatorIndex === -1) break;

      const line = this.buffer.slice(0, separatorIndex);
      this.buffer = this.buffer.slice(separatorIndex + CRLF.length);
      lines.push(line);

      if (/^\d{3} /.test(line)) {
        complete = true;
        break;
      }
    }

    return { lines, complete };
  }
}

function parseSecureTransport(value: unknown): SecureTransportMode {
  const normalized = stringValue(value).toLowerCase();
  if (normalized === "ssl" || normalized === "tls" || normalized === "secure") return "ssl";
  if (normalized === "plain" || normalized === "off") return "plain";
  return "starttls";
}

function parseAuthMode(value: unknown): AuthMode {
  return stringValue(value).toLowerCase() === "plain" ? "plain" : "login";
}

function integerPort(value: unknown, fallback: number): number {
  const normalized = Number.parseInt(stringValue(value), 10);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
}

function base64Encode(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function inferMessageId(domain: string): string {
  return `<${crypto.randomUUID().replace(/-/g, "")}@${domain}>`;
}

function dotStuff(value: string): string {
  return value
    .replace(/\r?\n/g, CRLF)
    .split(CRLF)
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join(CRLF);
}

function escapeHeader(value: string): string {
  return value.replace(/\r|\n/g, " ").trim();
}

function buildMimeMessage(sender: string, input: InternalSmtpMessage, messageId: string): string {
  const headers = [
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    `From: <${sender}>`,
    `To: <${input.to}>`,
    `Subject: ${escapeHeader(input.subject)}`,
    "MIME-Version: 1.0"
  ];

  if (input.replyTo) headers.push(`Reply-To: <${escapeHeader(input.replyTo)}>`); 

  if (!input.html) {
    return [
      ...headers,
      'Content-Type: text/plain; charset="utf-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      dotStuff(input.text)
    ].join(CRLF);
  }

  const boundary = `mail_${crypto.randomUUID().replace(/-/g, "")}`;
  return [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    dotStuff(input.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    dotStuff(input.html),
    `--${boundary}--`
  ].join(CRLF);
}

export function missingInternalSmtpEnvKeys(env: InternalSmtpEnv, flowCode: PaymentEmailFlowCode): string[] {
  const policy = PAYMENT_EMAIL_FLOW_POLICIES[flowCode];
  const required = ["SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", policy.senderEnvKey] as const;

  return required.filter((key) => !stringValue(env[key]));
}

export function resolveInternalSmtpSender(env: InternalSmtpEnv, flowCode: PaymentEmailFlowCode): string {
  const policy = PAYMENT_EMAIL_FLOW_POLICIES[flowCode];
  return stringValue(env[policy.senderEnvKey]) || policy.defaultSender;
}

async function authenticate(session: SmtpSession, authMode: AuthMode, username: string, password: string): Promise<string[]> {
  if (authMode === "plain") {
    await session.writeLine(`AUTH PLAIN ${base64Encode(`\u0000${username}\u0000${password}`)}`);
    return session.expect(235);
  }

  await session.writeLine("AUTH LOGIN");
  await session.expect(334);
  await session.writeLine(base64Encode(username));
  await session.expect(334);
  await session.writeLine(base64Encode(password));
  return session.expect(235);
}

// This transport prepares real SMTP delivery, but the migration is only valid after
// payment-provider action logs, SMTP messageId capture, D1 evidence, and inbox proof.
export async function sendViaInternalSmtp(env: InternalSmtpEnv, input: InternalSmtpMessage): Promise<InternalSmtpResult> {
  const missingEnvKeys = missingInternalSmtpEnvKeys(env, input.flowCode);
  const sender = resolveInternalSmtpSender(env, input.flowCode);
  const senderDomain = sender.includes("@") ? sender.split("@").pop() || "iai.one" : "iai.one";
  const messageId = stringValue(input.messageId) || inferMessageId(senderDomain);

  if (missingEnvKeys.length) {
    return {
      ok: false,
      transport: "internal_smtp",
      messageId,
      sender,
      acceptedAt: null,
      smtpResponseLines: [`SMTP env missing: ${missingEnvKeys.join(", ")}`],
      missingEnvKeys
    };
  }

  const host = stringValue(env.SMTP_HOST);
  const port = integerPort(env.SMTP_PORT, 587);
  const secureTransport = parseSecureTransport(env.SMTP_SECURE_TRANSPORT);
  const authMode = parseAuthMode(env.SMTP_AUTH_MODE);
  const username = stringValue(env.SMTP_USERNAME);
  const password = stringValue(env.SMTP_PASSWORD);
  const heloDomain = stringValue(env.SMTP_HELO_DOMAIN) || senderDomain || "iai.one";
  const rawMessage = buildMimeMessage(sender, input, messageId);

  let socket = connect({
    hostname: host,
    port
  }, {
    secureTransport: secureTransport === "ssl" ? "on" : "off",
    allowHalfOpen: false
  });
  let session = new SmtpSession(socket);

  try {
    const responseLines: string[] = [];

    responseLines.push(...(await session.expect(220)));
    await session.writeLine(`EHLO ${heloDomain}`);
    responseLines.push(...(await session.expect(250)));

    if (secureTransport === "starttls") {
      await session.writeLine("STARTTLS");
      responseLines.push(...(await session.expect(220)));
      socket = socket.startTls();
      session = new SmtpSession(socket);
      await session.writeLine(`EHLO ${heloDomain}`);
      responseLines.push(...(await session.expect(250)));
    }

    responseLines.push(...(await authenticate(session, authMode, username, password)));
    await session.writeLine(`MAIL FROM:<${sender}>`);
    responseLines.push(...(await session.expect(250)));
    await session.writeLine(`RCPT TO:<${input.to}>`);
    responseLines.push(...(await session.expect(250)));
    await session.writeLine("DATA");
    responseLines.push(...(await session.expect(354)));
    await session.writeRaw(`${rawMessage}${CRLF}.${CRLF}`);
    responseLines.push(...(await session.expect(250)));
    await session.writeLine("QUIT");
    await session.expect(221);

    return {
      ok: true,
      transport: "internal_smtp",
      messageId,
      sender,
      acceptedAt: nowIso(),
      smtpResponseLines: responseLines,
      missingEnvKeys
    };
  } finally {
    await session.close().catch(() => undefined);
  }
}
