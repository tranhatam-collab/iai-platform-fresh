#!/usr/bin/env node

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

function usage() {
  const text = [
    "Usage:",
    "  node scripts/publication-key-pack.mjs \\",
    "    --packet-id AGSEO-D01 \\",
    "    --input /abs/path/to/file-or-dir \\",
    "    --reviewer A1 \\",
    "    --owner THT \\",
    "    --approver THT \\",
    "    [--title \"Visible title\"] \\",
    "    [--claim \"Original claim text\"] \\",
    "    [--target https://example.com]... \\",
    "    [--out-dir /private/tmp/key-pack-AGSEO-D01] \\",
    "    [--nft-registry-id REG-001] \\",
    "    [--vc-code MIRROR-001]",
    "",
    "Outputs:",
    "  - manifest.json",
    "  - proof_capsule.json",
    "  - key-pack.json"
  ].join("\n");
  process.stdout.write(`${text}\n`);
}

function parseArgs(argv) {
  const args = {
    packetId: "",
    inputPath: "",
    reviewer: "",
    owner: "",
    approver: "",
    title: "",
    claim: "",
    outDir: "",
    targets: [],
    nftRegistryId: "",
    vcCode: ""
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    switch (arg) {
      case "--help":
      case "-h":
        usage();
        process.exit(0);
      case "--packet-id":
        args.packetId = next || "";
        i += 1;
        break;
      case "--input":
        args.inputPath = next || "";
        i += 1;
        break;
      case "--reviewer":
        args.reviewer = next || "";
        i += 1;
        break;
      case "--owner":
        args.owner = next || "";
        i += 1;
        break;
      case "--approver":
        args.approver = next || "";
        i += 1;
        break;
      case "--title":
        args.title = next || "";
        i += 1;
        break;
      case "--claim":
        args.claim = next || "";
        i += 1;
        break;
      case "--out-dir":
        args.outDir = next || "";
        i += 1;
        break;
      case "--target":
        if (next) args.targets.push(next);
        i += 1;
        break;
      case "--nft-registry-id":
        args.nftRegistryId = next || "";
        i += 1;
        break;
      case "--vc-code":
        args.vcCode = next || "";
        i += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.packetId || !args.inputPath || !args.reviewer || !args.owner || !args.approver) {
    usage();
    throw new Error("Missing required arguments.");
  }

  return args;
}

function nowUtcNoMs() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function yyyymmddFromIso(iso) {
  return iso.slice(0, 10).replaceAll("-", "");
}

function toAsciiToken(value, fallback = "UNKNOWN") {
  const upper = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return upper || fallback;
}

function shortHash(hex, length = 8) {
  return String(hex || "").slice(0, length).toUpperCase();
}

async function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function walkFiles(root) {
  const out = [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === ".git") continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

async function buildInputSnapshot(inputPath) {
  const stat = await fs.stat(inputPath);
  const absolutePath = path.resolve(inputPath);

  if (stat.isFile()) {
    const buffer = await fs.readFile(absolutePath);
    const hash = await sha256Buffer(buffer);
    return {
      mode: "file",
      absolutePath,
      displayName: path.basename(absolutePath),
      manifest: {
        kind: "single_file",
        absolute_path: absolutePath,
        file_name: path.basename(absolutePath),
        size_bytes: stat.size,
        sha256: hash
      },
      manifestBytes: buffer,
      manifestSha256: hash,
      contentSha256: hash,
      inputMeta: {
        name: path.basename(absolutePath),
        size: stat.size,
        type: "application/octet-stream"
      }
    };
  }

  if (!stat.isDirectory()) {
    throw new Error(`Input path is neither file nor directory: ${absolutePath}`);
  }

  const files = await walkFiles(absolutePath);
  const manifestFiles = [];
  for (const file of files) {
    const fileBuffer = await fs.readFile(file);
    const fileStat = await fs.stat(file);
    manifestFiles.push({
      path: path.relative(absolutePath, file).replaceAll(path.sep, "/"),
      size_bytes: fileStat.size,
      sha256: await sha256Buffer(fileBuffer)
    });
  }

  const manifestObject = {
    kind: "directory_manifest",
    absolute_path: absolutePath,
    total_files: manifestFiles.length,
    files: manifestFiles
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifestObject, null, 2));
  const manifestSha256 = await sha256Buffer(manifestBytes);

  return {
    mode: "directory",
    absolutePath,
    displayName: `${path.basename(absolutePath)}-manifest.json`,
    manifest: manifestObject,
    manifestBytes,
    manifestSha256,
    contentSha256: manifestSha256,
    inputMeta: {
      name: `${path.basename(absolutePath)}-manifest.json`,
      size: manifestBytes.byteLength,
      type: "application/json"
    }
  };
}

function makeFingerprint(hash) {
  const a = hash.slice(0, 12);
  const b = hash.slice(12, 24);
  const c = hash.slice(24, 36);
  return `${a}-${b}-${c}`.toUpperCase();
}

function buildProofCapsule(snapshot, title, claim, createdAtUTC) {
  return {
    version: "proof_capsule_v1",
    product: "CHUNG_THUC",
    createdAtUTC,
    title: title || snapshot.displayName || "Untitled",
    claim: claim || "",
    input: {
      type: "file",
      meta: snapshot.inputMeta
    },
    contentHash: snapshot.contentSha256,
    proofFingerprint: makeFingerprint(snapshot.contentSha256),
    principles: ["Truth over dopamine", "Privacy-first", "Actionable"],
    notes: [
      "This capsule enables independent verification via hash comparison.",
      "It does not replace legal, professional, or identity verification."
    ]
  };
}

function buildKeys(args, createdAtUTC, contentSha256) {
  const date = yyyymmddFromIso(createdAtUTC);
  const reviewer = toAsciiToken(args.reviewer, "REVIEWER");
  const owner = toAsciiToken(args.owner, "OWNER");
  const approver = toAsciiToken(args.approver, "APPROVER");

  return {
    originality_key: `ORI-${date}-${args.packetId}-${reviewer}-001`,
    ip_owner_key: `IP-${date}-${owner}-${args.packetId}-001`,
    proof_key: `PROOF-${date}-${args.packetId}-${shortHash(contentSha256)}`,
    nft_asset_key: args.nftRegistryId
      ? `NFT-${date}-${args.packetId}-${toAsciiToken(args.nftRegistryId, "REGISTRY")}`
      : null,
    vc_key: args.vcCode
      ? `VC-${date}-${args.packetId}-${toAsciiToken(args.vcCode, "MIRROR")}`
      : null,
    founder_publish_key: `FPA-${date}-${args.packetId}-${approver}-001`
  };
}

function buildCommands(args, keyPackPath, proofPath, manifestPath, proofKey, contentHash) {
  const targets = args.targets.length > 0 ? args.targets : ["https://nft.iai.one", "https://vc.vetuonglai.com"];

  return {
    local_pack: [
      `node scripts/publication-key-pack.mjs --packet-id '${args.packetId}' --input '${args.inputPath}' --reviewer '${args.reviewer}' --owner '${args.owner}' --approver '${args.approver}'${args.title ? ` --title '${args.title}'` : ""}${args.claim ? ` --claim '${args.claim}'` : ""}${args.targets.map((value) => ` --target '${value}'`).join("")}${args.nftRegistryId ? ` --nft-registry-id '${args.nftRegistryId}'` : ""}${args.vcCode ? ` --vc-code '${args.vcCode}'` : ""}${args.outDir ? ` --out-dir '${args.outDir}'` : ""}`
    ],
    exports: [
      `export PACKET_ID='${args.packetId}'`,
      `export CONTENT_HASH='sha256:${contentHash}'`,
      `export PROOF_KEY='${proofKey}'`,
      `export KEY_PACK_JSON='${keyPackPath}'`,
      `export PROOF_JSON='${proofPath}'`,
      `export MANIFEST_JSON='${manifestPath}'`,
      `export PUBLISH_TARGETS='${targets.join(",")}'`
    ],
    proof_capsule_reference: [
      "curl -sS https://proof.tranhatam.com/ | rg 'proof JSON|SHA-256|fingerprint|browser'",
      `jq '{contentHash, proofFingerprint, createdAtUTC, title}' '${proofPath}'`
    ],
    nft_probe: [
      "curl -sS https://nft.iai.one/assets/app.js | rg '/api/issuance-preview|/api/asset-registrations|/api/approve-issuance|/api/issue'",
      "curl -sS https://nft.iai.one/ | rg 'Mint Studio|asset registration|VC mirror'"
    ],
    nft_issuance_preview_post: [
      "curl -sS -X POST https://nft.iai.one/api/issuance-preview \\",
      "  -H 'content-type: application/json' \\",
      `  --data-binary '{"collection":"<COLLECTION_SLUG>","recipientName":"<RECIPIENT_NAME>","walletAddress":"<RECIPIENT_WALLET>","contentHash":"sha256:${contentHash}","proofUrl":"<PUBLIC_PROOF_URL>","externalUrl":"<EXTERNAL_URL>","externalId":"${args.packetId}","title":"${(args.title || args.packetId).replace(/"/g, '\\"')}"}'`
    ],
    nft_asset_registration_post: [
      "curl -sS -X POST https://nft.iai.one/api/asset-registrations \\",
      "  -H 'content-type: application/json' \\",
      `  --data-binary '{"registrantName":"<REGISTRANT_NAME>","ownerEntity":"<OWNER_ENTITY>","assetName":"${(args.title || args.packetId).replace(/"/g, '\\"')}","assetType":"<ASSET_TYPE>","network":"Base","chainId":"8453","walletAddress":"<WALLET_TO_CHECK>","contractAddress":"<OPTIONAL_CONTRACT_ADDRESS>","tokenId":"<OPTIONAL_TOKEN_ID>","tokenStandard":"WALLET","proofUrl":"<PUBLIC_PROOF_URL>","contentHash":"sha256:${contentHash}","externalUrl":"<EXTERNAL_URL>","externalId":"${args.packetId}","vcCode":"","summary":"<SHORT_SUMMARY>"}'`
    ],
    vc_probe: [
      "curl -I https://vc.vetuonglai.com/",
      "curl -sS https://vc.vetuonglai.com/ | sed -n '1,40p'"
    ]
  };
}

function buildGate(keys) {
  const missing = Object.entries(keys)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    status: missing.length === 0 ? "READY_FOR_PUBLISH" : "PUBLISH_BLOCKED_MISSING_KEYS",
    missing
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const createdAtUTC = nowUtcNoMs();
  const snapshot = await buildInputSnapshot(args.inputPath);
  const title = args.title || path.basename(snapshot.absolutePath);
  const outDir = args.outDir
    ? path.resolve(args.outDir)
    : path.resolve("/private/tmp", `publication-key-pack-${args.packetId}`);

  await fs.mkdir(outDir, { recursive: true });

  const manifestPath = path.join(outDir, "manifest.json");
  const proofPath = path.join(outDir, "proof_capsule.json");
  const keyPackPath = path.join(outDir, "key-pack.json");

  await fs.writeFile(manifestPath, JSON.stringify(snapshot.manifest, null, 2));

  const proofCapsule = buildProofCapsule(snapshot, title, args.claim, createdAtUTC);
  await fs.writeFile(proofPath, JSON.stringify(proofCapsule, null, 2));

  const keys = buildKeys(args, createdAtUTC, proofCapsule.contentHash);
  const commands = buildCommands(
    args,
    keyPackPath,
    proofPath,
    manifestPath,
    keys.proof_key,
    proofCapsule.contentHash
  );
  const gate = buildGate(keys);

  const keyPack = {
    generated_at_utc: createdAtUTC,
    packet_id: args.packetId,
    input_path: snapshot.absolutePath,
    input_mode: snapshot.mode,
    title,
    claim: args.claim || "",
    targets: args.targets,
    hashes: {
      content_hash_raw: proofCapsule.contentHash,
      content_hash_prefixed: `sha256:${proofCapsule.contentHash}`,
      manifest_sha256: snapshot.manifestSha256,
      proof_fingerprint: proofCapsule.proofFingerprint
    },
    keys,
    evidence_files: {
      manifest_json: manifestPath,
      proof_capsule_json: proofPath,
      key_pack_json: keyPackPath
    },
    notes: {
      proof_key: "Generated from a local reproduction of proof.tranhatam.com proof_capsule_v1. The public site is browser-side and does not upload files to a server.",
      nft_asset_key: keys.nft_asset_key
        ? "Present because --nft-registry-id was provided."
        : "Missing until nft.iai.one returns a real registry/approval/token identifier.",
      vc_key: keys.vc_key
        ? "Present because --vc-code was provided."
        : "Missing until vc.vetuonglai.com or the NFT VC bridge returns a real mirror code."
    },
    commands,
    publish_gate: gate
  };

  await fs.writeFile(keyPackPath, JSON.stringify(keyPack, null, 2));

  process.stdout.write(`${JSON.stringify(keyPack, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
