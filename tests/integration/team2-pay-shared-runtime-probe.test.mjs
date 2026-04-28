import test from "node:test";
import assert from "node:assert/strict";
import { extractSharedRuntimeSignals } from "../../scripts/team2-pay-shared-runtime-probe.mjs";

test("shared runtime probe recognizes shared-contract health payloads", () => {
  const healthBody = {
    ok: true,
    data: {
      shared_read_model: {
        rolloutReadyForSharedOnly: true,
        source: "upstream_runtime"
      },
      shared_upstream_runtime: {
        activeReadMode: "shared_contract",
        releaseGate: {
          ready: true,
          reasons: []
        }
      }
    }
  };

  const extracted = extractSharedRuntimeSignals(healthBody);

  assert.equal(extracted.healthContractShape, "shared_runtime_contract");
  assert.equal(extracted.healthContractExposesSharedReadModel, true);
  assert.equal(extracted.healthContractExposesSharedUpstreamRuntime, true);
  assert.equal(extracted.sharedReadModelReadyForSharedOnly, true);
  assert.equal(extracted.sharedUpstreamActiveReadModeSharedContract, true);
  assert.equal(extracted.sharedUpstreamReleaseGateReady, true);
  assert.deepEqual(extracted.sharedUpstreamReleaseGateReasons, []);
});

test("shared runtime probe marks legacy health payloads as non-shared contract", () => {
  const legacyHealthBody = {
    ok: true,
    service: "pay.iai.one",
    environment: "production",
    api_base_url: "https://pay.iai.one",
    db_bound: true,
    providers_total: 6,
    status: "ok",
    mission: "Private payment orchestration for all IAI sites"
  };

  const extracted = extractSharedRuntimeSignals(legacyHealthBody);

  assert.equal(extracted.healthContractShape, "legacy_or_unknown");
  assert.equal(extracted.healthContractExposesSharedReadModel, false);
  assert.equal(extracted.healthContractExposesSharedUpstreamRuntime, false);
  assert.equal(extracted.sharedReadModelReadyForSharedOnly, false);
  assert.equal(extracted.sharedUpstreamActiveReadModeSharedContract, false);
  assert.equal(extracted.sharedUpstreamReleaseGateReady, false);
  assert.equal(extracted.sharedUpstreamReleaseGateReasons, null);
});
