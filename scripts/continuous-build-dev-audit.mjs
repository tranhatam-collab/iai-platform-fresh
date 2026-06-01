#!/usr/bin/env node
// continuous-build-dev-audit.mjs
// Build → Dev → Audit liên tục theo thứ tự ưu tiên surface cho đến khi toàn bộ dự án xong.
// Usage: node scripts/continuous-build-dev-audit.mjs [--once]

import { spawn } from "node:child_process";
import process from "node:process";

const ONCE = process.argv.includes("--once");

const STAGES = [
  {
    name: "packages-base",
    cmd: "pnpm --filter @iai/config build && pnpm --filter @iai/mail-core build"
  },
  {
    name: "web",
    cmd: "pnpm --filter @iai/mail-core build && pnpm --filter @iai/mail-api build && pnpm --filter @iai/web build && node --test tests/integration/web-*.test.mjs"
  },
  {
    name: "pay",
    cmd: "pnpm --filter @iai/pay build && node --test tests/integration/pay-surface.test.mjs"
  },
  {
    name: "flow",
    cmd: "pnpm --filter @iai/mail-core build && pnpm --filter @iai/mail-api build && pnpm --filter @iai/mail-web build && pnpm --filter @iai/flow build && node --test tests/integration/flow-*.test.mjs"
  },
  {
    name: "mail-smtp",
    cmd: "pnpm build && node --test tests/integration/mail-smtp-*.test.mjs"
  },
  {
    name: "mail-worker",
    cmd: "pnpm --filter @iai/mail-core build && pnpm --filter @iai/mail-worker build && node --test tests/integration/mail-worker-*.test.mjs"
  },
  {
    name: "mail-api",
    cmd: "pnpm --filter @iai/mail-api build && node --test tests/integration/mail-api-*.test.mjs"
  },
  {
    name: "nft",
    cmd: "pnpm --filter @iai/nft build && node --test tests/integration/nft-*.test.mjs"
  },
  {
    name: "app",
    cmd: "pnpm --filter @iai/app build && node --test tests/integration/app-*.test.mjs"
  },
  {
    name: "dash",
    cmd: "pnpm --filter @iai/mail-core build && pnpm --filter @iai/mail-api build && pnpm --filter @iai/dash build && node --test tests/integration/dash-*.test.mjs"
  },
  {
    name: "home",
    cmd: "pnpm --filter @iai/home build && node --test tests/integration/home-*.test.mjs"
  },
  {
    name: "docs",
    cmd: "pnpm --filter @iai/docs build && node --test tests/integration/docs-*.test.mjs"
  },
  {
    name: "root",
    cmd: "pnpm --filter @iai/root build && node --test tests/integration/root-*.test.mjs"
  },
  {
    name: "verify-runtime",
    cmd: "cd apps/verify-runtime && pnpm build && pnpm test"
  },
  {
    name: "noos-web",
    cmd: "pnpm --filter @iai/noos-web build && node --test tests/integration/noos-commerce-surface.test.mjs"
  },
  {
    name: "noos-stack",
    cmd: "pnpm --filter @iai/noos-web build && node --test tests/integration/noos-commerce-stack.test.mjs"
  },
  {
    name: "universal-quality-gate",
    cmd: "pnpm quality:gate"
  }
];

function run(stage) {
  return new Promise((resolve) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`STAGE: ${stage.name}`);
    console.log(`${"=".repeat(60)}`);
    const start = Date.now();
    const child = spawn("sh", ["-c", stage.cmd], {
      stdio: "inherit",
      cwd: process.cwd()
    });
    child.on("close", (code) => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      const status = code === 0 ? "PASS" : `FAIL (exit ${code})`;
      console.log(`\n[${stage.name}] ${status} in ${elapsed}s\n`);
      resolve({ name: stage.name, ok: code === 0, elapsed });
    });
  });
}

async function loop() {
  let round = 1;
  while (true) {
    console.log(`\n${"#".repeat(60)}`);
    console.log(`ROUND ${round} — ${new Date().toISOString()}`);
    console.log(`${"#".repeat(60)}`);
    const results = [];
    for (const stage of STAGES) {
      const result = await run(stage);
      results.push(result);
    }

    const allOk = results.every((r) => r.ok);
    const passed = results.filter((r) => r.ok).length;
    const total = results.length;

    console.log(`\n${"#".repeat(60)}`);
    console.log(`ROUND ${round} SUMMARY: ${passed}/${total} stages passed`);
    for (const r of results) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.name} (${r.elapsed}s)`);
    }
    console.log(`${"#".repeat(60)}`);

    if (allOk) {
      console.log("\n🎉 ALL STAGES PASSED. Project complete.\n");
      process.exit(0);
    }

    if (ONCE) {
      console.log("\n⚠️  --once mode: stopping after first round.\n");
      process.exit(1);
    }

    console.log("\n⏳ Waiting 30s before next round...\n");
    await new Promise((res) => setTimeout(res, 30000));
    round++;
  }
}

loop().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
