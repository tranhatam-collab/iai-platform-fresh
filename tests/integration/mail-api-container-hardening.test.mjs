import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

// The mail-api image and the internal-first compose file run unprivileged and pinned, and the
// README tells the operator which host permissions that needs. These are static checks of the
// files in the repository; they start no container.

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const dockerfile = read("apps/mail-api/deploy/Dockerfile");
const entrypoint = read("apps/mail-api/deploy/docker-entrypoint.sh");
const readme = read("apps/mail-api/deploy/README.md");
const compose = read("ops/mail-internal-first/docker-compose.prod.yml");

const PINNED_IMAGE = /node:22-alpine@sha256:[0-9a-f]{64}/u;

test("the Dockerfile pins its base image by digest", () => {
  const from = dockerfile.match(/^FROM\s+(\S+)/mu)?.[1] ?? "";
  assert.match(from, new RegExp(`^${PINNED_IMAGE.source}$`, "u"));
});

test("the Dockerfile runs as the node user without su-exec or a runtime chown", () => {
  assert.match(dockerfile, /^USER node$/mu);
  assert.doesNotMatch(dockerfile, /su-exec/u);
  assert.doesNotMatch(dockerfile, /apk add/u);
  const entrypointCode = entrypoint.split("\n").filter((line) => !line.trimStart().startsWith("#")).join("\n");
  assert.doesNotMatch(entrypointCode, /su-exec|\bchown\b|\bchmod\b/u);
  // the build-time chown of the image's own directories is the only one
  const chowns = dockerfile.split("\n").filter((line) => /\bchown\b/u.test(line) && !line.trimStart().startsWith("#"));
  assert.equal(chowns.length, 1);
  assert.match(chowns[0], /node:node/u);
});

test("the Dockerfile has a HEALTHCHECK on /health (liveness), not /ready", () => {
  // the instruction continues over lines that end with a backslash
  const healthcheck = dockerfile.match(/^HEALTHCHECK(?:[^\n]*\\\n)*[^\n]*/mu)?.[0] ?? "";
  assert.ok(healthcheck, "HEALTHCHECK is missing");
  assert.match(healthcheck, /\/health'\)/u);
  assert.doesNotMatch(healthcheck, /\/ready/u);
});

test("the entrypoint refuses to start when the evidence directory is not writable", () => {
  assert.match(entrypoint, /\[ ! -w "\$EVIDENCE_DIR" \]/u);
  assert.match(entrypoint, /exit 1/u);
  assert.match(entrypoint, /^exec "\$@"$/mu);
});

test("the entrypoint exits 1 for a missing evidence directory and runs the command for a writable one", () => {
  const script = new URL("../../apps/mail-api/deploy/docker-entrypoint.sh", import.meta.url).pathname;
  const dir = mkdtempSync(join(tmpdir(), "mail-api-evidence-"));
  try {
    const missing = spawnSync("sh", [script, "echo", "started"], {
      encoding: "utf8",
      env: { PATH: process.env.PATH, PATH_B_EVIDENCE_DIR: join(dir, "absent") }
    });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /evidence_dir_not_writable/u);
    assert.doesNotMatch(missing.stdout, /started/u);

    const writable = spawnSync("sh", [script, "echo", "started"], {
      encoding: "utf8",
      env: { PATH: process.env.PATH, PATH_B_EVIDENCE_DIR: dir }
    });
    assert.equal(writable.status, 0);
    assert.match(writable.stdout, /started/u);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
});

for (const service of ["mail-api", "mail-smtp"]) {
  const block = () => {
    const start = compose.indexOf(`  ${service}:\n`);
    assert.ok(start >= 0, `${service} service not found`);
    const rest = compose.slice(start + 1);
    const next = rest.search(/\n  [a-z][\w-]*:\n|\nnetworks:/u);
    return next < 0 ? rest : rest.slice(0, next);
  };

  test(`compose: ${service} is pinned, unprivileged, capability-free and read-only`, () => {
    const text = block();
    assert.match(text, new RegExp(`image: ${PINNED_IMAGE.source}`, "u"));
    assert.match(text, /^\s+user: "1000:1000"$/mu);
    assert.match(text, /cap_drop:\s*\n\s+- ALL/u);
    assert.match(text, /security_opt:\s*\n\s+- no-new-privileges:true/u);
    assert.match(text, /^\s+read_only: true$/mu);
    assert.match(text, /tmpfs:\s*\n\s+- \/tmp/u);
  });
}

test("compose: both services use the same pinned image as the Dockerfile", () => {
  const dockerfileImage = dockerfile.match(/^FROM\s+(\S+)/mu)?.[1];
  const images = [...compose.matchAll(/^\s+image:\s+(\S+)$/gmu)].map((match) => match[1]);
  assert.equal(images.length, 2);
  for (const image of images) {
    assert.equal(image, dockerfileImage);
  }
});

test("compose: the only writable mounts are the data directories", () => {
  const writableBinds = [...compose.matchAll(/- type: bind\n\s+source: (\S+)\n\s+target: (\S+)(\n\s+read_only: true)?/gu)]
    .filter((match) => !match[3])
    .map((match) => match[2]);
  assert.deepEqual(writableBinds, ["/data", "/data"]);
});

test("README lists the host preparation for uid 1000 as numbered steps before compose up", () => {
  assert.match(readme, /install -d -o 1000 -g 1000/u);
  assert.match(readme, /evidence_dir_not_writable/u);
  const section = readme.slice(readme.indexOf("## Compose deployment"));
  const steps = [...section.matchAll(/^(\d+)\. (.+(?:\n   .+)*)/gmu)].map((match) => ({ number: Number(match[1]), text: match[2] }));
  assert.deepEqual(steps.map((step) => step.number), [1, 2, 3]);
  assert.match(steps[0].text, /data directory/u);
  assert.match(steps[1].text, /secret or certificate mount readable by uid 1000/u);
  assert.match(steps[1].text, /permissions set on the host/u);
  assert.match(steps[2].text, /repository checkout/u);
  const stepsAt = section.search(/^1\. /mu);
  assert.match(section.slice(0, stepsAt), /before\*\* `docker compose up`|\*\*before\*\* `docker compose up`/u);
  assert.match(section, /do\s+not run `docker-entrypoint\.sh`/u);
  // the generic wording replaces file names and permission recipes for secret mounts
  assert.doesNotMatch(section, /key\.pem|cert\.pem|\/certs|\bchmod\b|chown 1000/u);
  assert.doesNotMatch(readme, /su-exec/u);
  assert.doesNotMatch(readme, /chowns it to `node:node`/u);
});
