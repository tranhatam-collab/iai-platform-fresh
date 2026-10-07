/**
 * PayOS test doubles: webhook signing (independent re-implementation of the documented
 * algorithm) and a local fake of the PayOS merchant API. Everything here uses fake keys.
 */
import { createHash, createHmac } from "node:crypto";
import { createServer } from "node:http";

import { getFreePort } from "../../support/harness.mjs";

const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));

function sortKeys(object) {
  return Object.keys(object)
    .sort()
    .reduce((acc, key) => {
      acc[key] = object[key];
      return acc;
    }, {});
}

function serialize(value) {
  if (value === null || value === undefined || value === "null" || value === "undefined") return "";
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => (isObject(item) ? sortKeys(item) : item)));
  if (isObject(value)) return JSON.stringify(sortKeys(value));
  return String(value);
}

/** PayOS webhook signature: HMAC-SHA256(checksumKey, "k1=v1&k2=v2..." over key-sorted data fields). */
export function payosDataSignature(data, checksumKey) {
  const query = Object.keys(data)
    .sort()
    .map((key) => `${key}=${serialize(data[key])}`)
    .join("&");
  return createHmac("sha256", checksumKey).update(query).digest("hex");
}

/** Signature PayOS expects on create-payment-request bodies. */
export function payosPaymentRequestSignature(body, checksumKey) {
  const input = `amount=${body.amount}&cancelUrl=${body.cancelUrl}&description=${body.description}&orderCode=${body.orderCode}&returnUrl=${body.returnUrl}`;
  return createHmac("sha256", checksumKey).update(input).digest("hex");
}

export function sha256Hex(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Build a signed PayOS webhook body for a payment link event. */
export function buildPayOSWebhook({ orderCode, amount, checksumKey, code = "00", reference = `FT${orderCode}`, overrides = {} }) {
  const data = {
    orderCode,
    amount,
    description: "e2e payment",
    accountNumber: "12345678",
    reference,
    transactionDateTime: "2026-01-02 03:04:05",
    currency: "VND",
    paymentLinkId: `plink_${orderCode}`,
    code,
    desc: code === "00" ? "success" : "failed",
    counterAccountBankId: "",
    counterAccountBankName: "",
    counterAccountName: "",
    counterAccountNumber: "",
    virtualAccountName: "",
    virtualAccountNumber: "",
    ...overrides
  };
  return {
    code,
    desc: code === "00" ? "success" : "failed",
    success: code === "00",
    data,
    signature: payosDataSignature(data, checksumKey)
  };
}

/**
 * Local stand-in for https://api-merchant.payos.vn.
 *
 * `accounts` maps x-client-id -> { apiKey, checksumKey }. A request is accepted only when the
 * client id, api key and request signature all match one account, so tests can prove which
 * tenant's credentials the Worker used for an outbound call.
 */
export async function startFakePayOS({ accounts }) {
  const calls = [];
  let nextFailure = null;
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        // leave null
      }
      const clientId = String(req.headers["x-client-id"] ?? "");
      const apiKey = String(req.headers["x-api-key"] ?? "");
      const account = accounts[clientId];
      const call = { method: req.method, url: req.url, clientId, apiKey, body, signatureValid: false, authorized: false };
      calls.push(call);

      const reply = (status, payload) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(payload));
      };

      if (!account || account.apiKey !== apiKey) {
        reply(401, { code: "401", desc: "Unauthorized", data: null });
        return;
      }
      call.authorized = true;

      if (req.method === "POST" && req.url === "/v2/payment-requests" && body) {
        call.signatureValid = payosPaymentRequestSignature(body, account.checksumKey) === body.signature;
        if (nextFailure) {
          const failure = nextFailure;
          nextFailure = null;
          reply(failure.status ?? 200, failure.body);
          return;
        }
        if (!call.signatureValid) {
          reply(200, { code: "201", desc: "Invalid signature", data: null });
          return;
        }
        reply(200, {
          code: "00",
          desc: "success",
          data: {
            bin: "970422",
            accountNumber: "0123456789",
            accountName: "FAKE MERCHANT",
            amount: body.amount,
            description: body.description,
            orderCode: body.orderCode,
            currency: "VND",
            paymentLinkId: `plink_${body.orderCode}`,
            status: "PENDING",
            checkoutUrl: `https://pay.payos.vn/web/plink_${body.orderCode}`,
            qrCode: `00020101021238fake${body.orderCode}`
          },
          signature: "fake"
        });
        return;
      }
      reply(404, { code: "404", desc: "not found in fake", data: null });
    });
  });

  const port = await getFreePort();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    calls,
    /** Make the next create-payment-request answer with the given status/body. */
    failNext(status, body) {
      nextFailure = { status, body };
    },
    reset() {
      calls.length = 0;
      nextFailure = null;
    },
    async close() {
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
    }
  };
}
