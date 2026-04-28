import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { createNftRequestHandler } from "../../apps/nft/dist/server.js";
import { dispatchToHandler } from "../support/http-handler.mjs";

function buildPartnerSignature(idempotencyKey, sourceTimestamp) {
  const digest = createHash("sha256")
    .update(`${idempotencyKey}:${sourceTimestamp}:vc.vetuonglai.com`)
    .digest("hex");
  return `sha256:${digest}`;
}

async function requestJson(handler, { method = "GET", url, body, headers = {} }) {
  const response = await dispatchToHandler(handler, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: body === undefined ? headers : { ...headers, "content-type": "application/json" },
    method,
    url
  });
  const payload = await response.json();
  return { payload, response };
}

test("nft secure lane issues and verifies step-up + wallet proof chain", async () => {
  const handler = createNftRequestHandler();

  const stepChallenge = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/security/step-up/challenge",
    body: {}
  });
  assert.equal(stepChallenge.response.status, 200);
  const challengeNonce = stepChallenge.payload.data.challenge_nonce;
  assert.ok(challengeNonce);

  const stepVerify = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/security/step-up/verify",
    body: {
      challenge_nonce: challengeNonce,
      authenticator_response: "passkey_ok"
    }
  });
  assert.equal(stepVerify.response.status, 200);
  const stepUpSessionId = stepVerify.payload.data.step_up_session_id;
  assert.ok(stepUpSessionId);

  const walletChallenge = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/wallet-proof/challenge",
    body: {
      wallet_id: "wallet_demo_001",
      asset_id_optional: "ASSET-20260324-DEMO02",
      action: "download"
    }
  });
  assert.equal(walletChallenge.response.status, 200);
  const walletNonce = walletChallenge.payload.data.challenge_nonce;
  assert.ok(walletNonce);

  const walletVerify = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/wallet-proof/verify",
    body: {
      wallet_id: "wallet_demo_001",
      challenge_nonce: walletNonce,
      signature: `sig:${walletNonce}`,
      asset_id_optional: "ASSET-20260324-DEMO02",
      action: "download"
    }
  });
  assert.equal(walletVerify.response.status, 200);
  assert.ok(walletVerify.payload.data.signature_proof_id);

  const audit = await requestJson(handler, {
    url: "/v1/nft/audit"
  });
  const eventNames = audit.payload.data.items.map((item) => item.eventName);
  assert.ok(eventNames.includes("step_up.verified"));
  assert.ok(eventNames.includes("wallet.proof.verified"));
});

test("nft gated asset pass case issues proxy token and completes download", async () => {
  const handler = createNftRequestHandler();

  const accessCheck = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/assets/ASSET-20260324-DEMO01/access-check",
    body: {
      action: "download"
    }
  });
  assert.equal(accessCheck.response.status, 200);
  assert.equal(accessCheck.payload.data.decision, "allow");
  assert.equal(accessCheck.payload.data.requires_step_up, false);
  assert.equal(accessCheck.payload.data.requires_wallet_proof, false);

  const proxyToken = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/assets/ASSET-20260324-DEMO01/proxy-token",
    body: {
      action: "download"
    }
  });
  assert.equal(proxyToken.response.status, 200);
  const tokenId = proxyToken.payload.data.proxy_token_id;
  assert.ok(tokenId);

  const download = await requestJson(handler, {
    url: `/v1/nft/assets/ASSET-20260324-DEMO01/download?proxy_token_id=${encodeURIComponent(tokenId)}`
  });
  assert.equal(download.response.status, 200);
  assert.equal(download.payload.data.download_status, "completed");
});

test("nft vault flow enforces deny cases, supports partner sync, and blocks raw URL exposure", async () => {
  const handler = createNftRequestHandler();

  const denyStepUp = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/assets/ASSET-20260324-DEMO02/access-check",
    body: {
      action: "download"
    }
  });
  assert.equal(denyStepUp.response.status, 200);
  assert.equal(denyStepUp.payload.data.decision, "need_step_up");

  const stepChallenge = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/security/step-up/challenge",
    body: {}
  });
  const stepNonce = stepChallenge.payload.data.challenge_nonce;
  const stepVerify = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/security/step-up/verify",
    body: {
      challenge_nonce: stepNonce,
      authenticator_response: "passkey_ok"
    }
  });
  const stepUpSessionId = stepVerify.payload.data.step_up_session_id;

  const denyWallet = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/assets/ASSET-20260324-DEMO02/access-check",
    body: {
      action: "download",
      step_up_session_id_optional: stepUpSessionId
    }
  });
  assert.equal(denyWallet.response.status, 200);
  assert.equal(denyWallet.payload.data.decision, "need_wallet_proof");

  const walletChallenge = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/wallet-proof/challenge",
    body: {
      wallet_id: "wallet_demo_001",
      asset_id_optional: "ASSET-20260324-DEMO02",
      action: "download"
    }
  });
  const walletNonce = walletChallenge.payload.data.challenge_nonce;
  const walletVerify = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/wallet-proof/verify",
    body: {
      wallet_id: "wallet_demo_001",
      challenge_nonce: walletNonce,
      signature: `sig:${walletNonce}`,
      asset_id_optional: "ASSET-20260324-DEMO02",
      action: "download"
    }
  });
  const signatureProofId = walletVerify.payload.data.signature_proof_id;

  const accessAllow = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/assets/ASSET-20260324-DEMO02/access-check",
    body: {
      action: "download",
      step_up_session_id_optional: stepUpSessionId,
      signature_proof_id_optional: signatureProofId
    }
  });
  assert.equal(accessAllow.response.status, 200);
  assert.equal(accessAllow.payload.data.decision, "allow");

  const proxyToken = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/assets/ASSET-20260324-DEMO02/proxy-token",
    body: {
      action: "download",
      step_up_session_id_optional: stepUpSessionId,
      signature_proof_id_optional: signatureProofId
    }
  });
  assert.equal(proxyToken.response.status, 200);
  const tokenId = proxyToken.payload.data.proxy_token_id;
  assert.ok(tokenId);

  const download = await requestJson(handler, {
    url: `/v1/nft/assets/ASSET-20260324-DEMO02/download?proxy_token_id=${encodeURIComponent(tokenId)}`
  });
  assert.equal(download.response.status, 200);
  assert.equal(download.payload.data.download_status, "completed");

  const partnerTimestamp = new Date().toISOString();
  const partnerIdempotency = "partner_evt_accepted_001";
  const partnerAccept = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/partner-sync/events",
    headers: {
      "x-idempotency-key": partnerIdempotency,
      "x-partner-signature": buildPartnerSignature(partnerIdempotency, partnerTimestamp),
      "x-source-timestamp": partnerTimestamp
    },
    body: {
      event_name: "asset.policy.updated",
      asset_id: "ASSET-20260324-DEMO02"
    }
  });
  assert.equal(partnerAccept.response.status, 202);
  assert.equal(partnerAccept.payload.data.status, "accepted");

  const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const staleIdempotency = "partner_evt_stale_002";
  const partnerStale = await requestJson(handler, {
    method: "POST",
    url: "/v1/nft/partner-sync/events",
    headers: {
      "x-idempotency-key": staleIdempotency,
      "x-partner-signature": buildPartnerSignature(staleIdempotency, staleTimestamp),
      "x-source-timestamp": staleTimestamp
    },
    body: {
      event_name: "asset.policy.updated",
      asset_id: "ASSET-20260324-DEMO02"
    }
  });
  assert.equal(partnerStale.response.status, 400);
  assert.equal(partnerStale.payload.error.code, "PARTNER_SYNC_STALE");

  const rawBlocked = await requestJson(handler, {
    url: "/api/metadata/iai-genesis-pass/DEMO-0001"
  });
  assert.equal(rawBlocked.response.status, 403);
  assert.equal(rawBlocked.payload.error.code, "RAW_URL_BLOCKED");

  const audit = await requestJson(handler, {
    url: "/v1/nft/audit?limit=200"
  });
  const eventNames = audit.payload.data.items.map((item) => item.eventName);
  assert.ok(eventNames.includes("access.denied"));
  assert.ok(eventNames.includes("access.allowed"));
  assert.ok(eventNames.includes("download.started"));
  assert.ok(eventNames.includes("download.completed"));
  assert.ok(eventNames.includes("partner.sync.accepted"));
  assert.ok(eventNames.includes("partner.sync.rejected"));
});
