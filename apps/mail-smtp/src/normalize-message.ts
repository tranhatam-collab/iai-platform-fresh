import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

import type {
  MailAddress,
  MessageHeaders,
  NormalizationContext,
  NormalizedAttachment,
  NormalizedMessage
} from "./contracts.js";

interface ParsedHeaderValue {
  parameters: Record<string, string>;
  value: string;
}

interface ParsedMimeEntity {
  body: Buffer;
  contentDisposition?: ParsedHeaderValue;
  contentTransferEncoding?: string;
  contentType: ParsedHeaderValue;
  headers: MessageHeaders;
  parts: ParsedMimeEntity[];
}

interface ParsedMimeContent {
  attachments: NormalizedAttachment[];
  bcc: MailAddress[];
  cc: MailAddress[];
  from?: MailAddress;
  headerFrom?: string;
  headerMessageId?: string;
  headers: MessageHeaders;
  html?: string;
  replyTo?: MailAddress;
  subject?: string;
  text?: string;
  to: MailAddress[];
}

type NormalizedMessageOverrides = Partial<
  Omit<NormalizedMessage, "source" | "rawMime">
> & {
  rawMime?: Buffer;
};

export function buildNormalizedMessage(
  input: NormalizationContext,
  overrides: NormalizedMessageOverrides = {}
): NormalizedMessage {
  const parsed = parseMimeContent(overrides.rawMime ?? input.rawMime);
  const rawMime = overrides.rawMime ?? input.rawMime;
  const messageId = overrides.messageId ?? `msg_${randomUUID()}`;
  const traceId = overrides.traceId ?? input.traceId ?? `trace_${randomUUID()}`;
  const smtpSessionId =
    overrides.smtpSessionId ?? input.smtpSessionId ?? `smtp_${randomUUID()}`;
  const submittedAt =
    overrides.submittedAt ?? input.submittedAt ?? new Date().toISOString();

  return {
    attachments: overrides.attachments ?? parsed.attachments,
    bcc: overrides.bcc ?? parsed.bcc,
    cc: overrides.cc ?? parsed.cc,
    credentialId: overrides.credentialId ?? input.auth.credentialId,
    envelopeFrom: overrides.envelopeFrom ?? input.envelopeFrom,
    from: overrides.from ?? parsed.from,
    headerFrom: overrides.headerFrom ?? parsed.headerFrom,
    headerMessageId: overrides.headerMessageId ?? parsed.headerMessageId,
    headers: overrides.headers ?? parsed.headers,
    html: overrides.html ?? parsed.html,
    messageId,
    messageIdempotencyKey:
      overrides.messageIdempotencyKey ?? traceId,
    rawMime,
    recipients: overrides.recipients ?? input.recipients,
    replyTo: overrides.replyTo ?? parsed.replyTo,
    senderIdentityId:
      overrides.senderIdentityId ?? input.auth.senderIdentityId,
    smtpSessionId,
    source: "smtp",
    stream: overrides.stream ?? input.stream,
    subject: overrides.subject ?? parsed.subject,
    submittedAt,
    text: overrides.text ?? parsed.text,
    to: overrides.to ?? parsed.to,
    traceId,
    workspaceId: overrides.workspaceId ?? input.auth.workspaceId
  };
}

function parseMimeContent(rawMime: Buffer): ParsedMimeContent {
  const entity = parseMimeEntity(rawMime);
  const headers = entity.headers;
  const from = parseSingleAddress(headers.from);

  const bodies = collectEntityBodies(entity);

  return {
    attachments: bodies.attachments,
    bcc: parseAddressList(headers.bcc),
    cc: parseAddressList(headers.cc),
    from,
    headerFrom: from?.email,
    headerMessageId: headers["message-id"],
    headers,
    html: joinBodyParts(bodies.html),
    replyTo: parseSingleAddress(headers["reply-to"]),
    subject: decodeMimeWords(headers.subject),
    text: joinBodyParts(bodies.text),
    to: parseAddressList(headers.to)
  };
}

function collectEntityBodies(entity: ParsedMimeEntity, partId = "1"): {
  attachments: NormalizedAttachment[];
  html: string[];
  text: string[];
} {
  if (entity.parts.length > 0) {
    return entity.parts.reduce<{
      attachments: NormalizedAttachment[];
      html: string[];
      text: string[];
    }>(
      (accumulator, part, index) => {
        const child = collectEntityBodies(part, `${partId}.${index + 1}`);
        accumulator.attachments.push(...child.attachments);
        accumulator.html.push(...child.html);
        accumulator.text.push(...child.text);
        return accumulator;
      },
      {
        attachments: [],
        html: [],
        text: []
      }
    );
  }

  const decodedBody = decodeTransferEncoding(
    entity.body,
    entity.contentTransferEncoding
  );
  const contentType = entity.contentType.value.toLowerCase();
  const disposition = entity.contentDisposition?.value.toLowerCase();
  const filename =
    entity.contentDisposition?.parameters.filename ??
    entity.contentType.parameters.name;
  const isAttachment =
    disposition === "attachment" ||
    Boolean(filename) ||
    (
      disposition === "inline" &&
      contentType !== "text/plain" &&
      contentType !== "text/html"
    );

  if (!isAttachment && contentType === "text/plain") {
    return {
      attachments: [],
      html: [],
      text: [decodeBodyText(decodedBody, entity.contentType.parameters.charset)]
    };
  }

  if (!isAttachment && contentType === "text/html") {
    return {
      attachments: [],
      html: [decodeBodyText(decodedBody, entity.contentType.parameters.charset)],
      text: []
    };
  }

  if (!filename && disposition !== "attachment" && disposition !== "inline") {
    return {
      attachments: [],
      html: [],
      text: []
    };
  }

  return {
    attachments: [
      {
        contentDisposition: entity.contentDisposition?.value,
        contentId: entity.headers["content-id"]?.replace(/[<>]/gu, ""),
        contentTransferEncoding: entity.contentTransferEncoding,
        contentType,
        filename,
        inline: disposition === "inline",
        partId,
        sizeBytes: decodedBody.length
      }
    ],
    html: [],
    text: []
  };
}

function parseMimeEntity(raw: Buffer): ParsedMimeEntity {
  const [headerBuffer, body] = splitHeadersAndBody(raw);
  const headers = parseHeaderBlock(headerBuffer.toString("utf8"));
  const contentType = parseParameterizedHeader(headers["content-type"]);
  const boundary = contentType.parameters.boundary;
  const parts =
    contentType.value.toLowerCase().startsWith("multipart/") && boundary
      ? splitMultipartBody(body, boundary).map((part) => parseMimeEntity(part))
      : [];

  return {
    body,
    contentDisposition: parseMaybeParameterizedHeader(
      headers["content-disposition"]
    ),
    contentTransferEncoding: headers["content-transfer-encoding"]?.toLowerCase(),
    contentType,
    headers,
    parts
  };
}

function splitHeadersAndBody(raw: Buffer): [Buffer, Buffer] {
  const separator = raw.indexOf("\r\n\r\n");
  if (separator >= 0) {
    return [raw.subarray(0, separator), raw.subarray(separator + 4)];
  }

  const unixSeparator = raw.indexOf("\n\n");
  if (unixSeparator >= 0) {
    return [raw.subarray(0, unixSeparator), raw.subarray(unixSeparator + 2)];
  }

  return [raw, Buffer.alloc(0)];
}

function parseHeaderBlock(rawHeaders: string): MessageHeaders {
  const unfolded = rawHeaders.replace(/\r?\n[ \t]+/gu, " ");
  const headers: MessageHeaders = {};

  for (const line of unfolded.split(/\r?\n/u)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    if (!name || !value) {
      continue;
    }

    headers[name] = value;
  }

  return headers;
}

function parseParameterizedHeader(value?: string): ParsedHeaderValue {
  if (!value) {
    return {
      parameters: {},
      value: "text/plain"
    };
  }

  const segments = splitHeaderParameters(value);
  const [head, ...parameterSegments] = segments;
  const parameters: Record<string, string> = {};
  const continuationParameters = new Map<
    string,
    Array<{ encoded: boolean; index: number; value: string }>
  >();

  for (const parameterSegment of parameterSegments) {
    const separatorIndex = parameterSegment.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = parameterSegment.slice(0, separatorIndex).trim().toLowerCase();
    const rawParameterValue = stripQuotes(
      parameterSegment.slice(separatorIndex + 1).trim()
    );
    const continuationMatch = key.match(/^([^*]+)\*(\d+)(\*)?$/u);

    if (continuationMatch) {
      const baseKey = continuationMatch[1] ?? key;
      const indexValue = continuationMatch[2] ?? "0";
      const encodedSuffix = continuationMatch[3];
      const entries = continuationParameters.get(baseKey) ?? [];
      entries.push({
        encoded: Boolean(encodedSuffix),
        index: Number.parseInt(indexValue, 10),
        value: rawParameterValue
      });
      continuationParameters.set(baseKey, entries);
      continue;
    }

    if (key.endsWith("*")) {
      parameters[key.slice(0, -1)] = decodeExtendedParameterValue(
        rawParameterValue
      );
      continue;
    }

    parameters[key] = decodeParameterValue(rawParameterValue);
  }

  for (const [baseKey, entries] of continuationParameters) {
    const joinedValue = entries
      .sort((left, right) => left.index - right.index)
      .map((entry) => entry.value)
      .join("");
    const encoded = entries.some((entry) => entry.encoded);

    parameters[baseKey] = encoded
      ? decodeExtendedParameterValue(joinedValue)
      : decodeParameterValue(joinedValue);
  }

  return {
    parameters,
    value: (head ?? "text/plain").trim().toLowerCase()
  };
}

function parseMaybeParameterizedHeader(value?: string) {
  if (!value) {
    return undefined;
  }

  return parseParameterizedHeader(value);
}

function splitHeaderParameters(value: string) {
  return splitWithQuotes(value, ";");
}

function splitMultipartBody(body: Buffer, boundary: string): Buffer[] {
  const source = body.toString("latin1");
  const boundaryMarker = `--${boundary}`;
  const closingBoundaryMarker = `--${boundary}--`;
  const lines = source.split(/\r?\n/u);
  const parts: string[] = [];
  let current: string[] | undefined;

  for (const line of lines) {
    if (line === boundaryMarker) {
      if (current) {
        parts.push(current.join("\r\n"));
      }
      current = [];
      continue;
    }

    if (line === closingBoundaryMarker) {
      if (current) {
        parts.push(current.join("\r\n"));
      }
      current = undefined;
      break;
    }

    if (current) {
      current.push(line);
    }
  }

  return parts
    .map((part) => part.replace(/^\r?\n/u, "").replace(/\r?\n$/u, ""))
    .filter(Boolean)
    .map((part) => Buffer.from(part, "latin1"));
}

function decodeTransferEncoding(body: Buffer, transferEncoding?: string) {
  if (!transferEncoding) {
    return body;
  }

  switch (transferEncoding.toLowerCase()) {
    case "base64":
      return Buffer.from(body.toString("latin1").replace(/\s+/gu, ""), "base64");
    case "quoted-printable":
      return decodeQuotedPrintable(body.toString("latin1"));
    default:
      return body;
  }
}

function decodeQuotedPrintable(input: string) {
  const normalized = input.replace(/=\r?\n/gu, "");
  const bytes: number[] = [];

  for (let index = 0; index < normalized.length; index += 1) {
    if (
      normalized[index] === "=" &&
      /[0-9A-Fa-f]{2}/u.test(normalized.slice(index + 1, index + 3))
    ) {
      bytes.push(Number.parseInt(normalized.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }

    bytes.push(normalized.charCodeAt(index));
  }

  return Buffer.from(bytes);
}

function decodeParameterValue(value: string) {
  return decodeMimeWords(value) ?? value;
}

function decodeExtendedParameterValue(value: string) {
  const extendedMatch = value.match(/^([^']*)'[^']*'(.*)$/u);
  if (!extendedMatch) {
    return decodePercentEncoded(value);
  }

  const charset = extendedMatch[1] ?? "utf-8";
  const encodedValue = extendedMatch[2] ?? "";
  return decodePercentEncoded(encodedValue, charset || "utf-8");
}

function decodePercentEncoded(value: string, charset = "utf-8") {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    if (
      value[index] === "%" &&
      /[0-9A-Fa-f]{2}/u.test(value.slice(index + 1, index + 3))
    ) {
      bytes.push(Number.parseInt(value.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }

    bytes.push(value.charCodeAt(index));
  }

  try {
    return new TextDecoder(normalizeCharset(charset)).decode(Buffer.from(bytes));
  } catch {
    return Buffer.from(bytes).toString("utf8");
  }
}

function decodeBodyText(body: Buffer, charset?: string) {
  const normalizedCharset = normalizeCharset(charset);

  try {
    return new TextDecoder(normalizedCharset).decode(body).trim();
  } catch {
    return body.toString("utf8").trim();
  }
}

function normalizeCharset(charset?: string) {
  if (!charset) {
    return "utf-8";
  }

  const normalized = charset.trim().toLowerCase();
  if (normalized === "utf8") {
    return "utf-8";
  }

  if (normalized === "us-ascii") {
    return "utf-8";
  }

  return normalized;
}

function parseAddressList(value?: string): MailAddress[] {
  if (!value) {
    return [];
  }

  return splitWithQuotes(value, ",")
    .map((entry) => parseAddress(entry))
    .filter((entry): entry is MailAddress => entry !== undefined);
}

function parseSingleAddress(value?: string) {
  return parseAddressList(value)[0];
}

function parseAddress(value: string) {
  const trimmed = (decodeMimeWords(value) ?? value).trim();
  if (!trimmed) {
    return undefined;
  }

  const angleMatch = trimmed.match(/^(.*)<([^>]+)>$/u);
  if (angleMatch) {
    const email = normalizeEmail(angleMatch[2] ?? "");
    if (!email) {
      return undefined;
    }

    const rawName = stripQuotes((angleMatch[1] ?? "").trim());
    return {
      email,
      ...(rawName ? { name: rawName } : {})
    };
  }

  const email = normalizeEmail(trimmed);
  if (!email) {
    return undefined;
  }

  return { email };
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(email) ? email : undefined;
}

function stripQuotes(value: string) {
  return value.replace(/^"(.*)"$/u, "$1");
}

function splitWithQuotes(value: string, separator: string) {
  const segments: string[] = [];
  let current = "";
  let inQuotes = false;
  let angleDepth = 0;

  for (const character of value) {
    if (character === '"') {
      inQuotes = !inQuotes;
      current += character;
      continue;
    }

    if (!inQuotes) {
      if (character === "<") {
        angleDepth += 1;
      } else if (character === ">") {
        angleDepth = Math.max(0, angleDepth - 1);
      }
    }

    if (character === separator && !inQuotes && angleDepth === 0) {
      if (current.trim()) {
        segments.push(current.trim());
      }
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) {
    segments.push(current.trim());
  }

  return segments;
}

function decodeMimeWords(value?: string) {
  if (!value) {
    return undefined;
  }

  return value.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/gu,
    (_match, charset: string, encoding: string, payload: string) => {
      const buffer =
        encoding.toUpperCase() === "B"
          ? Buffer.from(payload, "base64")
          : decodeQuotedPrintable(payload.replace(/_/gu, " "));

      try {
        return new TextDecoder(normalizeCharset(charset)).decode(buffer);
      } catch {
        return buffer.toString("utf8");
      }
    }
  );
}

function joinBodyParts(parts: string[]) {
  const joined = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n\n");

  return joined || undefined;
}
