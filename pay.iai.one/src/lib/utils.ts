export function nowIso(): string {
  return new Date().toISOString();
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function readJsonBody(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

export function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function scalarValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

export function integerValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number.parseInt(value.trim(), 10);
  return null;
}

export function normalizeUrl(value: unknown): string | null {
  const input = stringValue(value);
  if (!input) return null;
  try {
    return new URL(input).toString();
  } catch (_error) {
    return null;
  }
}

export function sortObjectByKey<T extends Record<string, unknown>>(value: T): T {
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = value[key];
      return acc;
    }, {} as Record<string, unknown>) as T;
}

export function serializeValue(value: unknown): string {
  if (value === null || value === undefined || value === "null" || value === "undefined") return "";
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((item) => (isObject(item) ? sortObjectByKey(item) : item))
    );
  }
  if (isObject(value)) return JSON.stringify(sortObjectByKey(value));
  return String(value);
}

export function queryStringFromObject(data: Record<string, unknown>): string {
  const sorted = sortObjectByKey(data);
  return Object.keys(sorted)
    .map((key) => `${key}=${serializeValue(sorted[key])}`)
    .join("&");
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}
