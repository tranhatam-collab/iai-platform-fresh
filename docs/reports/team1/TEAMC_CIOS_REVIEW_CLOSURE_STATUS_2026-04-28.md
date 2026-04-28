# TEAMC_CIOS_REVIEW_CLOSURE_STATUS_2026-04-28
- Generated at: 2026-04-28T16:10:35.712Z
- Timezone: Asia/Ho_Chi_Minh
- Review closure ready: FAIL
- Timeout per command: 20000ms

## Gate checks
- ciosWorkspacePresent: FAIL
- packetPresent: PASS
- runtimeProofPresent: PASS
- screenshotPackPresent: PASS
- workspaceEvidenceGuardPass: FAIL
- upstreamVitestPass: FAIL
- strictSmokeReady: PASS
- strictSmokePass: FAIL

## Screenshot pack
- Root landing (https://cios.iai.one/): PASS -> docs/release-evidence/cios.iai.one/artifacts/screenshots/root.png
- CIOS hub (https://cios.iai.one/cios/): PASS -> docs/release-evidence/cios.iai.one/artifacts/screenshots/hub.png
- CIOS app (https://cios.iai.one/cios/app/): PASS -> docs/release-evidence/cios.iai.one/artifacts/screenshots/app.png
- CIOS pricing (https://cios.iai.one/cios/pricing/): PASS -> docs/release-evidence/cios.iai.one/artifacts/screenshots/pricing.png
- CIOS demo (https://cios.iai.one/cios/demo/): PASS -> docs/release-evidence/cios.iai.one/artifacts/screenshots/demo.png

## Smoke readiness
- Direct bearer token ready: FAIL (source=missing)
- Auth session ready: PASS (source=default(demo123456))
- Workers JWT secret ready: FAIL (source=missing)
- Workers JWT secret looks placeholder: FAIL
- Workers API URL ready: PASS (source=default, value=https://cios-workers-api.tranhatam66.workers.dev)

## Command results
- workspace evidence guard: FAIL_EXIT_1
- upstream vitest: FAIL
- strict smoke: SKIPPED_ENV_NOT_READY

## Command output excerpts
- workspace evidence guard stdout: ✖ cios sibling workspace exposes release-critical route shells (1.031834ms)
✖ cios sibling workspace exposes runtime contract and rollback proof (0.139667ms)
ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 49.171667

✖ failing tests:

test at tests/integration/cios-release-evidence.test.mjs:15:1
✖ cios sibling workspace exposes release-critical route shells (1.031834ms)
  AssertionError [ERR_ASSERTION]: expected sibling cios.iai.one workspace
  
  false !== true
  
      at TestContext.<anonymous> (file:///Users/tranhatam/Documents/Devnewproject/iai-platform-fresh/tests/integration/cios-release-evidence.test.mjs:16:10)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1106:25)
      at Test.start (node:internal/test_runner/test:1003:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:358:17) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: 'strictEqual',
    diff: 'simple'
  }

test at tests/integration/cios-release-evidence.test.mjs:36:1
✖ cios sibling workspace exposes runtime contract and rollback proof (0.139667ms)
  Error: ENOENT: no such file or directory, open '/Users/tranhatam/Documents/Devnewproject/cios.iai.one/package.json'
      at readFileSync (node:fs:439:20)
      at readCiosFile (file:///Users/tranhatam/Documents/Devnewproject/iai-platform-fresh/tests/integration/cios-release-evidence.test.mjs:12:10)
      at TestContext.<anonymous> (file:///Users/tranhatam/Documents/Devnewproject/iai-platform-fresh/tests/integration/cios-release-evidence.test.mjs:37:34)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1106:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:788:18)
      at Test.postRun (node:internal/test_runner/test:1235:19)
      at Test.run (node:internal/test_runner/test:1163:12)
      at a...
- workspace evidence guard stderr: none
- upstream vitest stdout: none
- upstream vitest stderr: none
- strict smoke stdout: none
- strict smoke stderr: none

## Unmet checks
- ciosWorkspacePresent
- workspaceEvidenceGuardPass
- upstreamVitestPass
- strictSmokePass

## Next actions
- Khôi phục sibling workspace ../cios.iai.one trước khi claim Team C closure.
- Điều tra `npm test` của ../cios.iai.one trong môi trường có DB/toolchain đúng hoặc thêm harness test phù hợp trước khi Team 1 dùng upstream suite làm proof.
- Rerun `node scripts/teamc-cios-strict-smoke-capture.mjs` và xử lý lỗi runtime theo artifact strict smoke mới.

## Source paths
- docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_RELEASE_EVIDENCE_PACKET_2026-04-20.md
- docs/release-evidence/cios.iai.one/CIOS_IAI_ONE_RUNTIME_CONTRACT_PROOF_2026-04-21.md
- ../cios.iai.one/.env

