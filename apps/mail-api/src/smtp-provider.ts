// Provider-neutral SMTP delivery: hands a queued message to an outbound SMTP relay.
//
// Nothing here is specific to one provider. The relay is configured through MAIL_RELAY_* variables, the password is read
// from the environment and never written to a log, a result or a stored attempt. A message is reported as accepted only
// after the relay has answered the end of DATA with a 2xx reply; every other outcome is either a retryable failure
// (4xx replies, timeouts, refused or dropped connections, unavailable TLS, rejected credentials) or a final one
// (5xx replies to the message itself, addresses and headers that are not safe to send).
//
//   MAIL_RELAY_HOST                  relay host name (required)
//   MAIL_RELAY_PORT                  default 587 (465 with MAIL_RELAY_TLS=implicit)
//   MAIL_RELAY_TLS                   starttls (default), implicit, or none; none is refused with credentials and in production
//   MAIL_RELAY_USER, MAIL_RELAY_PASSWORD   optional; both or neither; sent with AUTH PLAIN, only over TLS
//   MAIL_RELAY_HELO_NAME             name used in EHLO (default localhost)
//   MAIL_RELAY_TIMEOUT_SECONDS       limit for one whole delivery, 1..120 (default 30)

import { randomUUID } from "node:crypto";
import net from "node:net";
import tls from "node:tls";

import type { MailQueueSubmitPayload } from "@iai/mail-core";

import type { QueueDeliveryResult } from "./smtp-internal.js";

export type SmtpRelayTlsMode = "implicit" | "none" | "starttls";

export interface SmtpRelayConfig {
  heloName: string;
  host: string;
  password?: string;
  port: number;
  /** Total time for one delivery, connection included. */
  timeoutMs: number;
  tls: SmtpRelayTlsMode;
  /** Extra options for the TLS connection (tests pass the CA of their fake relay). */
  tlsOptions?: tls.ConnectionOptions;
  user?: string;
}

/** The queued message as the relay needs it. `rawMimeBase64` is present for mail that came in over SMTP. */
export type SmtpDeliveryPayload = MailQueueSubmitPayload & { rawMimeBase64?: string };

export interface SmtpSendOutcome {
  accepted: boolean;
  errorClass?: string;
  providerMessageId?: string;
  responseCode: string;
  responseMessage: string;
  retryable: boolean;
}

const MAX_REPLY_LINES = 100;
const MAX_REPLY_BYTES = 64 * 1024;
const MAX_RESPONSE_MESSAGE_LENGTH = 200;
const ADDRESS_PATTERN = /^[^\s<>@"\\,;:()[\]\u0000-\u001f\u007f]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/u;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;
const HEADER_NAME = /^[A-Za-z0-9-]{1,64}$/u;
const GENERATED_HEADERS = new Set([
  "bcc",
  "cc",
  "content-transfer-encoding",
  "content-type",
  "date",
  "from",
  "message-id",
  "mime-version",
  "reply-to",
  "subject",
  "to"
]);

class SmtpFailure extends Error {
  constructor(
    readonly errorClass: string,
    readonly retryable: boolean,
    readonly responseCode: string,
    message: string
  ) {
    super(message);
    this.name = "SmtpFailure";
  }
}

interface SmtpReply {
  code: number;
  text: string;
}

function parseInteger(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number): number {
  const raw = env[name]?.trim();
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);
  if (!/^\d+$/u.test(raw) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}, got: ${JSON.stringify(raw)}`);
  }

  return value;
}

/** Reads the relay settings from the environment. Throws a message that names the variable, never its value for secrets. */
export function resolveSmtpRelayConfig(env: NodeJS.ProcessEnv = process.env): SmtpRelayConfig {
  const host = env.MAIL_RELAY_HOST?.trim();
  if (!host) {
    throw new Error("MAIL_RELAY_HOST is required when MAIL_PROVIDER_ADAPTER=smtp.");
  }
  if (!/^[A-Za-z0-9.-]{1,253}$/u.test(host) && !net.isIP(host)) {
    throw new Error("MAIL_RELAY_HOST must be a host name or an IP address.");
  }

  const tlsMode = (env.MAIL_RELAY_TLS?.trim().toLowerCase() || "starttls") as SmtpRelayTlsMode;
  if (tlsMode !== "starttls" && tlsMode !== "implicit" && tlsMode !== "none") {
    throw new Error('MAIL_RELAY_TLS must be "starttls", "implicit" or "none".');
  }

  const user = env.MAIL_RELAY_USER?.trim() || undefined;
  const password = env.MAIL_RELAY_PASSWORD === undefined || env.MAIL_RELAY_PASSWORD === "" ? undefined : env.MAIL_RELAY_PASSWORD;
  if ((user === undefined) !== (password === undefined)) {
    throw new Error("MAIL_RELAY_USER and MAIL_RELAY_PASSWORD must be set together.");
  }
  if (tlsMode === "none" && user !== undefined) {
    throw new Error('MAIL_RELAY_TLS=none is not allowed together with MAIL_RELAY_USER: credentials are never sent without TLS.');
  }
  if (tlsMode === "none" && env.NODE_ENV === "production") {
    throw new Error('MAIL_RELAY_TLS=none is not allowed when NODE_ENV is "production".');
  }

  const heloName = env.MAIL_RELAY_HELO_NAME?.trim() || "localhost";
  if (!/^[A-Za-z0-9.-]{1,253}$/u.test(heloName)) {
    throw new Error("MAIL_RELAY_HELO_NAME must be a host name.");
  }

  return {
    heloName,
    host,
    password,
    port: parseInteger(env, "MAIL_RELAY_PORT", tlsMode === "implicit" ? 465 : 587, 1, 65535),
    timeoutMs: parseInteger(env, "MAIL_RELAY_TIMEOUT_SECONDS", 30, 1, 120) * 1000,
    tls: tlsMode,
    user
  };
}

/** A relay reply or error text as it may be stored: one line, printable, short. */
function printable(text: string): string {
  const cleaned = text.replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
  return cleaned.length > MAX_RESPONSE_MESSAGE_LENGTH ? `${cleaned.slice(0, MAX_RESPONSE_MESSAGE_LENGTH)}...` : cleaned;
}

class SmtpConnection {
  private buffer = "";
  private closedReason: SmtpFailure | undefined;
  private notify: (() => void) | undefined;
  private socket: net.Socket;

  constructor(socket: net.Socket, private readonly deadline: number) {
    this.socket = socket;
    this.attach(socket);
  }

  private attach(socket: net.Socket) {
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      if (this.buffer.length > MAX_REPLY_BYTES) {
        this.fail(new SmtpFailure("reply_too_large", true, "", "relay reply too large"));
        return;
      }
      this.wake();
    });
    socket.on("error", (error: NodeJS.ErrnoException) => this.fail(transportFailure(error)));
    socket.on("close", () => this.fail(new SmtpFailure("connection_closed", true, "", "relay closed the connection")));
  }

  private fail(failure: SmtpFailure) {
    this.closedReason ??= failure;
    this.wake();
  }

  private wake() {
    const notify = this.notify;
    this.notify = undefined;
    notify?.();
  }

  private remaining(): number {
    return Math.min(this.deadline, this.limit) - Date.now();
  }

  /** Caps the wait of the next reads at `ms` from now (used to say goodbye without delaying a finished delivery). */
  private limit = Number.POSITIVE_INFINITY;

  limitWait(ms: number) {
    this.limit = Date.now() + ms;
  }

  /** Waits for the next change on the socket, until the delivery deadline. */
  private async waitForChange(): Promise<void> {
    const remaining = this.remaining();
    if (remaining <= 0) {
      throw new SmtpFailure("timeout", true, "", "relay did not answer in time");
    }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(done, remaining);
      const onChange = () => done();
      function done() {
        clearTimeout(timer);
        resolve();
      }
      this.notify = onChange;
    });
  }

  async readReply(): Promise<SmtpReply> {
    const lines: string[] = [];
    for (;;) {
      const newline = this.buffer.indexOf("\n");
      if (newline >= 0) {
        const line = this.buffer.slice(0, newline).replace(/\r$/u, "");
        this.buffer = this.buffer.slice(newline + 1);
        const match = /^(\d{3})([ -])(.*)$/su.exec(line) ?? /^(\d{3})()$/u.exec(line);
        if (!match) {
          throw new SmtpFailure("unexpected_reply", true, "", "relay sent a line that is not an SMTP reply");
        }

        lines.push(line);
        if (lines.length > MAX_REPLY_LINES) {
          throw new SmtpFailure("reply_too_large", true, "", "relay reply too long");
        }
        if (match[2] !== "-") {
          return { code: Number(match[1]), text: lines.map((entry) => entry.slice(4)).join("\n") };
        }
        continue;
      }

      if (this.closedReason) {
        throw this.closedReason;
      }
      await this.waitForChange();
      if (this.closedReason && this.buffer.indexOf("\n") < 0) {
        throw this.closedReason;
      }
    }
  }

  write(data: Buffer | string) {
    if (this.closedReason) {
      throw this.closedReason;
    }
    this.socket.write(data);
  }

  /** Switches the open connection to TLS. The relay must not have sent anything after its 220 reply. */
  async upgradeToTls(options: tls.ConnectionOptions): Promise<void> {
    if (this.buffer.length > 0) {
      throw new SmtpFailure("unexpected_reply", true, "", "relay sent data before the TLS handshake");
    }

    const plain = this.socket;
    plain.removeAllListeners("data");
    plain.removeAllListeners("error");
    plain.removeAllListeners("close");
    plain.on("error", () => undefined);
    const secure = await new Promise<tls.TLSSocket>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new SmtpFailure("timeout", true, "", "TLS handshake did not finish in time"));
        plain.destroy();
      }, Math.max(this.remaining(), 1));
      const socket = tls.connect({ ...options, socket: plain }, () => {
        clearTimeout(timer);
        resolve(socket);
      });
      socket.once("error", (error: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        reject(tlsFailure(error));
      });
    });
    this.socket = secure;
    this.attach(secure);
  }

  destroy() {
    this.socket.destroy();
  }
}

function transportFailure(error: NodeJS.ErrnoException): SmtpFailure {
  switch (error.code) {
    case "ECONNREFUSED":
      return new SmtpFailure("connection_refused", true, "", "relay refused the connection");
    case "ECONNRESET":
    case "EPIPE":
      return new SmtpFailure("connection_closed", true, "", "relay closed the connection");
    case "ETIMEDOUT":
      return new SmtpFailure("timeout", true, "", "connection to the relay timed out");
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return new SmtpFailure("dns_failure", true, "", "relay host name did not resolve");
    case "EHOSTUNREACH":
    case "ENETUNREACH":
      return new SmtpFailure("relay_unreachable", true, "", "relay is not reachable");
    default:
      return new SmtpFailure("connection_error", true, "", "connection to the relay failed");
  }
}

function tlsFailure(error: NodeJS.ErrnoException): SmtpFailure {
  const verification = typeof error.code === "string" && /CERT|SELF_SIGNED|UNABLE_TO_VERIFY|HOSTNAME/u.test(error.code);
  return verification
    ? new SmtpFailure("tls_verification_failed", true, "", "relay certificate was not accepted")
    : new SmtpFailure("tls_failed", true, "", "TLS handshake with the relay failed");
}

function connect(config: SmtpRelayConfig, deadline: number): Promise<SmtpConnection> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      reject(new SmtpFailure("timeout", true, "", "relay did not answer in time"));
      return;
    }

    let settled = false;
    const finish = (action: () => void) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        action();
      }
    };
    const onConnected = (socket: net.Socket) => finish(() => resolve(new SmtpConnection(socket, deadline)));
    const onError = (error: NodeJS.ErrnoException, isTls: boolean) =>
      finish(() => reject(isTls && error.code !== "ECONNREFUSED" && error.code !== "ENOTFOUND" ? tlsFailure(error) : transportFailure(error)));
    const socket: net.Socket =
      config.tls === "implicit"
        ? tls.connect({ host: config.host, port: config.port, servername: net.isIP(config.host) ? undefined : config.host, ...config.tlsOptions }, () => onConnected(socket))
        : net.connect({ host: config.host, port: config.port }, () => onConnected(socket));
    const timer = setTimeout(() => {
      finish(() => reject(new SmtpFailure("timeout", true, "", "connection to the relay timed out")));
      socket.destroy();
    }, remaining);
    socket.once("error", (error: NodeJS.ErrnoException) => onError(error, config.tls === "implicit"));
  });
}

/** A reply that was not the expected one as a failure: 5xx is final unless `alwaysRetry`, everything else is retryable. */
function replyFailure(reply: SmtpReply, errorClass: string, alwaysRetry: boolean): SmtpFailure {
  const isFinal = reply.code >= 500 && reply.code < 600 && !alwaysRetry;
  const known = reply.code >= 400 && reply.code < 600;
  return new SmtpFailure(known ? errorClass : "unexpected_reply", !isFinal, String(reply.code), printable(reply.text));
}

async function expect(connection: SmtpConnection, accepted: (code: number) => boolean, errorClass: string, alwaysRetry = false): Promise<SmtpReply> {
  const reply = await connection.readReply();
  if (!accepted(reply.code)) {
    throw replyFailure(reply, errorClass, alwaysRetry);
  }
  return reply;
}

async function command(
  connection: SmtpConnection,
  line: string,
  accepted: (code: number) => boolean,
  errorClass: string,
  alwaysRetry = false
): Promise<SmtpReply> {
  connection.write(`${line}\r\n`);
  return expect(connection, accepted, errorClass, alwaysRetry);
}

const isPositive = (code: number) => code >= 200 && code < 300;

/** Refuses anything that could add a line or a command to what is sent. Returns the address unchanged. */
function checkedAddress(value: string, what: string): string {
  if (CONTROL_CHARACTERS.test(value) || !ADDRESS_PATTERN.test(value) || value.length > 254) {
    throw new SmtpFailure("invalid_address", false, "", `${what} is not a valid address`);
  }
  return value;
}

function checkedHeaderValue(value: string, what: string): string {
  if (CONTROL_CHARACTERS.test(value)) {
    throw new SmtpFailure("invalid_header", false, "", `${what} contains a control character`);
  }
  return value;
}

function encodeHeaderText(value: string, what: string): string {
  const text = checkedHeaderValue(value, what);
  return /^[\x20-\x7e]*$/u.test(text) ? text : `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

function formatAddress(address: { email: string; name?: string }, what: string): string {
  const email = checkedAddress(address.email, what);
  if (!address.name) {
    return email;
  }

  const name = encodeHeaderText(address.name, `${what} name`);
  return name.startsWith("=?") ? `${name} <${email}>` : `"${name.replace(/(["\\])/gu, "\\$1")}" <${email}>`;
}

function foldBase64(content: string): string {
  return (Buffer.from(content, "utf8").toString("base64").match(/.{1,76}/gu) ?? [""]).join("\r\n");
}

/** Builds the message from its parts when the queue holds no raw MIME (mail submitted over the HTTP API). */
function buildMime(payload: SmtpDeliveryPayload): string {
  if (payload.attachments.length > 0) {
    // The queue keeps no attachment content for these messages, so they cannot be sent as submitted.
    throw new SmtpFailure("attachment_content_unavailable", false, "", "attachment content is not stored for this message");
  }
  if (payload.text === undefined && payload.html === undefined) {
    throw new SmtpFailure("empty_message", false, "", "message has neither text nor html");
  }

  const from = payload.from ?? { email: payload.envelopeFrom };
  const headers: string[] = [
    `From: ${formatAddress(from, "from")}`,
    `To: ${payload.to.map((entry) => formatAddress(entry, "to")).join(", ")}`
  ];
  if (payload.cc.length > 0) {
    headers.push(`Cc: ${payload.cc.map((entry) => formatAddress(entry, "cc")).join(", ")}`);
  }
  if (payload.replyTo) {
    headers.push(`Reply-To: ${formatAddress(payload.replyTo, "reply-to")}`);
  }
  headers.push(`Subject: ${encodeHeaderText(payload.subject ?? "", "subject")}`);
  headers.push(`Date: ${new Date(payload.submittedAt).toUTCString()}`);
  const messageId = payload.headerMessageId ? checkedHeaderValue(payload.headerMessageId, "message-id") : `<${randomUUID()}@${(payload.envelopeFrom.split("@")[1] ?? "localhost")}>`;
  headers.push(`Message-ID: ${messageId}`);
  for (const [name, value] of Object.entries(payload.headers)) {
    if (!HEADER_NAME.test(name)) {
      throw new SmtpFailure("invalid_header", false, "", "a header name is not valid");
    }
    if (!GENERATED_HEADERS.has(name.toLowerCase())) {
      headers.push(`${name}: ${encodeHeaderText(String(value), `header ${name}`)}`);
    }
  }
  headers.push("MIME-Version: 1.0");

  if (payload.text !== undefined && payload.html !== undefined) {
    const boundary = `=_${randomUUID()}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    return `${headers.join("\r\n")}\r\n\r\n--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${foldBase64(payload.text)}\r\n--${boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${foldBase64(payload.html)}\r\n--${boundary}--\r\n`;
  }

  const isHtml = payload.html !== undefined;
  headers.push(`Content-Type: ${isHtml ? "text/html" : "text/plain"}; charset=UTF-8`, "Content-Transfer-Encoding: base64");
  return `${headers.join("\r\n")}\r\n\r\n${foldBase64((isHtml ? payload.html : payload.text) ?? "")}\r\n`;
}

/** Message data as DATA sends it: CRLF line ends, dot-stuffed, ended by CRLF.CRLF. Bytes are kept as they are (latin1). */
function toDataBlock(message: string): Buffer {
  const normalised = message.replace(/\r\n|\r|\n/gu, "\r\n");
  const stuffed = normalised.replace(/^\./gmu, "..");
  return Buffer.from(`${stuffed}${stuffed.endsWith("\r\n") ? "" : "\r\n"}.\r\n`, "latin1");
}

function buildMessageData(payload: SmtpDeliveryPayload): Buffer {
  if (payload.rawMimeBase64) {
    return toDataBlock(Buffer.from(payload.rawMimeBase64, "base64").toString("latin1"));
  }
  return toDataBlock(buildMime(payload));
}

function ehloExtensions(reply: SmtpReply): Set<string> {
  return new Set(reply.text.split("\n").slice(1).map((line) => line.trim().toUpperCase()));
}

async function deliver(config: SmtpRelayConfig, payload: SmtpDeliveryPayload, connection: SmtpConnection): Promise<SmtpSendOutcome> {
  await expect(connection, (code) => code === 220, "relay_greeting_rejected", true);
  let capabilities = ehloExtensions(await command(connection, `EHLO ${config.heloName}`, isPositive, "relay_ehlo_rejected", true));

  if (config.tls === "starttls") {
    if (!capabilities.has("STARTTLS")) {
      throw new SmtpFailure("tls_unavailable", true, "", "relay does not offer STARTTLS");
    }
    await command(connection, "STARTTLS", (code) => code === 220, "tls_unavailable", true);
    await connection.upgradeToTls({ host: config.host, servername: net.isIP(config.host) ? undefined : config.host, ...config.tlsOptions } as tls.ConnectionOptions);
    capabilities = ehloExtensions(await command(connection, `EHLO ${config.heloName}`, isPositive, "relay_ehlo_rejected", true));
  }

  if (config.user !== undefined && config.password !== undefined) {
    if (![...capabilities].some((entry) => entry.startsWith("AUTH") && /\bPLAIN\b/u.test(entry))) {
      throw new SmtpFailure("relay_auth_unavailable", true, "", "relay does not offer AUTH PLAIN");
    }
    const token = Buffer.from(`\u0000${config.user}\u0000${config.password}`, "utf8").toString("base64");
    try {
      await command(connection, `AUTH PLAIN ${token}`, (code) => code === 235, "relay_auth_failed");
    } catch (error) {
      if (error instanceof SmtpFailure && !error.retryable) {
        // Rejected credentials are our configuration, not a verdict on this message: try again later.
        throw new SmtpFailure("relay_auth_failed", true, error.responseCode, error.message);
      }
      throw error;
    }
  }

  await command(connection, `MAIL FROM:<${payload.envelopeFrom}>`, isPositive, "sender_rejected");
  for (const recipient of payload.recipients) {
    await command(connection, `RCPT TO:<${recipient}>`, isPositive, "recipient_rejected");
  }
  await command(connection, "DATA", (code) => code === 354, "data_rejected");

  connection.write(buildMessageData(payload));
  const final = await expect(connection, isPositive, "message_rejected");
  try {
    // The message is already accepted; say goodbye, but never let that change the result or hold it up for long.
    connection.limitWait(500);
    connection.write("QUIT\r\n");
    await connection.readReply();
  } catch {
    // ignored
  }

  return {
    accepted: true,
    providerMessageId: `smtp_${payload.messageId}`,
    responseCode: String(final.code),
    responseMessage: printable(final.text) || "accepted",
    retryable: false
  };
}

/** Checks everything that is sent as a command, before any connection is opened. */
function validateEnvelope(payload: SmtpDeliveryPayload) {
  checkedAddress(payload.envelopeFrom, "envelope sender");
  if (payload.recipients.length === 0) {
    throw new SmtpFailure("no_recipients", false, "", "message has no recipients");
  }
  for (const recipient of payload.recipients) {
    checkedAddress(recipient, "recipient");
  }
  if (!payload.rawMimeBase64) {
    // Build once up front so header and address problems surface without a connection.
    buildMime(payload);
  }
}

/** Sends one queued message through the relay and reports what happened. It never throws. */
export async function sendViaSmtp(config: SmtpRelayConfig, payload: SmtpDeliveryPayload): Promise<SmtpSendOutcome> {
  const deadline = Date.now() + config.timeoutMs;
  let connection: SmtpConnection | undefined;
  try {
    validateEnvelope(payload);
    connection = await connect(config, deadline);
    return await deliver(config, payload, connection);
  } catch (error) {
    if (error instanceof SmtpFailure) {
      return { accepted: false, errorClass: error.errorClass, responseCode: error.responseCode || (error.retryable ? "451" : "550"), responseMessage: printable(error.message), retryable: error.retryable };
    }
    return { accepted: false, errorClass: "relay_internal_error", responseCode: "451", responseMessage: "relay delivery failed", retryable: true };
  } finally {
    connection?.destroy();
  }
}

/** The relay as a delivery hook for the queue. */
export function createSmtpQueueDelivery(config: SmtpRelayConfig): (input: { payload?: SmtpDeliveryPayload; routeMatched: boolean }) => Promise<QueueDeliveryResult> {
  return async (input) => {
    if (!input.routeMatched) {
      return { errorClass: "routing_failed", eventType: "failed", providerResponseCode: "500", providerResponseMessage: "No active provider route matched." };
    }
    if (!input.payload) {
      return { errorClass: "payload_unavailable", eventType: "failed", providerResponseCode: "500", providerResponseMessage: "queued payload is not available" };
    }

    const outcome = await sendViaSmtp(config, input.payload);
    return {
      errorClass: outcome.errorClass,
      eventType: outcome.accepted ? "provider_accepted" : outcome.retryable ? "deferred" : "failed",
      providerMessageId: outcome.providerMessageId,
      providerResponseCode: outcome.responseCode,
      providerResponseMessage: outcome.responseMessage
    };
  };
}

/** Connects, reads the greeting and says EHLO (with STARTTLS when configured); sends no mail. */
export async function probeSmtpRelay(config: SmtpRelayConfig): Promise<{ detail?: string; ok: boolean }> {
  const deadline = Date.now() + config.timeoutMs;
  let connection: SmtpConnection | undefined;
  try {
    connection = await connect(config, deadline);
    await expect(connection, (code) => code === 220, "relay_greeting_rejected", true);
    const capabilities = ehloExtensions(await command(connection, `EHLO ${config.heloName}`, isPositive, "relay_ehlo_rejected", true));
    if (config.tls === "starttls" && !capabilities.has("STARTTLS")) {
      return { detail: "tls_unavailable", ok: false };
    }
    connection.write("QUIT\r\n");
    return { ok: true };
  } catch (error) {
    return { detail: error instanceof SmtpFailure ? error.errorClass : "relay_internal_error", ok: false };
  } finally {
    connection?.destroy();
  }
}

/** Shape of a provider route, as far as this adapter reads it. */
interface RelayRoute {
  provider: string;
  routeId: string;
}

/**
 * The relay as a provider adapter, in the shape of the mail worker's ProviderAdapter (the packages share no
 * dependency, so the shape is repeated here; a test runs this adapter through the worker's own runtime).
 */
export function createSmtpProviderAdapter(config: SmtpRelayConfig) {
  return {
    provider: "smtp" as const,
    classifyError(result: { accepted: boolean; providerResponseCode?: string; retryable: boolean }) {
      return result.accepted
        ? { retryable: false }
        : { errorClass: result.retryable ? "provider_transient_failure" : "provider_permanent_failure", retryable: result.retryable };
    },
    healthcheck: () => probeSmtpRelay(config),
    async send(message: SmtpDeliveryPayload, context: { attemptId: string; route: RelayRoute }) {
      const outcome = await sendViaSmtp(config, message);
      return {
        accepted: outcome.accepted,
        providerMessageId: outcome.providerMessageId,
        providerResponseCode: outcome.responseCode,
        providerResponseMessage: outcome.responseMessage,
        rawResponse: { attemptId: context.attemptId, errorClass: outcome.errorClass, routeId: context.route.routeId },
        retryable: outcome.retryable
      };
    },
    // Attachment content is not kept in the queue, so attachments cannot be sent; no tracking either.
    supports: (_feature: "attachments" | "tracking") => false,
    validateConfig(route: RelayRoute) {
      if (route.provider !== "smtp") {
        throw new Error("The smtp adapter was given a route for another provider.");
      }
    }
  };
}
