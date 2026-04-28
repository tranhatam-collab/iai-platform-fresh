import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createFlowApiRequestHandler } from "../apps/mail-api/dist/server.js";
import { createWebRequestHandler } from "../apps/web/dist/server.js";
import { dispatchToHandler } from "../tests/support/http-handler.mjs";

function parseArg(prefix) {
  const entry = process.argv.find((argument) => argument.startsWith(`${prefix}=`));
  return entry ? entry.slice(prefix.length + 1) : null;
}

function normalizeString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizePilotRecord(raw, index) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`Bản ghi pilot không hợp lệ tại dòng ${index + 1}: cần object.`);
  }

  const eventName = normalizeString(raw.eventName);
  if (!eventName) {
    throw new Error(`Bản ghi pilot không hợp lệ tại dòng ${index + 1}: thiếu eventName.`);
  }

  return {
    assignmentReason:
      normalizeString(raw.assignmentReason) ??
      normalizeString(raw.assignment_reason) ??
      "pilot_batch",
    eventName,
    experimentId:
      normalizeString(raw.experimentId) ??
      normalizeString(raw.experiment_id) ??
      "WEB-PILOT-001",
    intent: normalizeString(raw.intent),
    role: normalizeString(raw.role),
    route: normalizeString(raw.route),
    sourceCampaign:
      normalizeString(raw.sourceCampaign) ??
      normalizeString(raw.source_campaign) ??
      "pilot-alpha",
    userOrAnonymousId:
      normalizeString(raw.userOrAnonymousId) ??
      normalizeString(raw.user_or_anonymous_id) ??
      `pilot_user_${String(index + 1).padStart(3, "0")}`,
    variantId:
      normalizeString(raw.variantId) ??
      normalizeString(raw.variant_id) ??
      "pilot-A"
  };
}

async function loadPilotBatch(filePath) {
  const source = await readFile(filePath, "utf8");
  const records = [];

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`JSON không hợp lệ ở dòng ${index + 1} của batch pilot.`);
    }
    records.push(normalizePilotRecord(parsed, index));
  }

  if (records.length === 0) {
    throw new Error("Batch pilot đang trống.");
  }

  return records;
}

function normalizeHeaders(headers) {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function createHandlerFetch(baseUrl, handler) {
  return async (input, init = {}) => {
    const requestUrl =
      typeof input === "string" || input instanceof URL
        ? new URL(input.toString())
        : new URL(input.url);

    if (!requestUrl.toString().startsWith(baseUrl)) {
      return fetch(input, init);
    }

    return dispatchToHandler(handler, {
      body: init.body,
      headers: normalizeHeaders(init.headers),
      method: init.method ?? "GET",
      url: `${requestUrl.pathname}${requestUrl.search}`
    });
  };
}

async function dispatchAndAssert(handler, { expectedStatus = 200, ...request }) {
  const response = await dispatchToHandler(handler, request);
  assert.equal(
    response.status,
    expectedStatus,
    `Mã trạng thái không đúng cho ${request.method ?? "GET"} ${request.url}`
  );
  return response;
}

async function runSyntheticSmokeFlow(webHandler) {
  await dispatchAndAssert(webHandler, {
    url: "/?campaign=pilot-alpha&variant=pilot-A&experiment_id=WEB-EXP-001&assignment_reason=smoke"
  });

  await dispatchAndAssert(webHandler, {
    url: "/?campaign=pilot-alpha&variant=pilot-A&returned_within_7d=1"
  });

  await dispatchAndAssert(webHandler, {
    url: "/onboarding?role=builder&intent=leads&campaign=pilot-alpha&variant=pilot-A&experiment_id=WEB-EXP-001&assignment_reason=smoke"
  });

  await dispatchAndAssert(webHandler, {
    body: new URLSearchParams({
      assignment_reason: "smoke",
      campaign: "pilot-alpha",
      experiment_id: "WEB-EXP-001",
      intent: "commerce",
      lang: "en",
      role: "operator",
      user_or_anonymous_id: "buyer_pilot_001",
      variant: "pilot-A"
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    method: "POST",
    url: "/onboarding"
  });

  await dispatchAndAssert(webHandler, {
    expectedStatus: 303,
    url: "/shared-auth?role=builder&intent=leads&campaign=pilot-alpha&variant=pilot-A&experiment_id=WEB-EXP-001&assignment_reason=smoke&user_or_anonymous_id=buyer_pilot_001"
  });

  await dispatchAndAssert(webHandler, {
    expectedStatus: 303,
    url: "/shared-auth?role=builder&intent=commerce&campaign=pilot-alpha&variant=pilot-A&experiment_id=WEB-EXP-001&assignment_reason=smoke&user_or_anonymous_id=buyer_pilot_001"
  });

  await dispatchAndAssert(webHandler, {
    expectedStatus: 400,
    url: "/shared-auth?campaign=pilot-alpha&variant=pilot-A"
  });

  await dispatchAndAssert(webHandler, {
    body: JSON.stringify({
      assignmentReason: "smoke",
      eventName: "web_first_action_completed",
      experimentId: "WEB-EXP-001",
      sourceCampaign: "pilot-alpha",
      userOrAnonymousId: "buyer_pilot_001",
      variantId: "pilot-A"
    }),
    expectedStatus: 202,
    headers: {
      "content-type": "application/json"
    },
    method: "POST",
    url: "/events/track"
  });
}

async function runPilotBatchFlow(webHandler, batchFile) {
  const records = await loadPilotBatch(batchFile);
  for (const record of records) {
    await dispatchAndAssert(webHandler, {
      body: JSON.stringify(record),
      expectedStatus: 202,
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      url: "/events/track"
    });
  }
  return records.length;
}

async function main() {
  const root = process.cwd();
  const modeArg = normalizeString(parseArg("--mode")) ?? "synthetic";
  const mode = modeArg === "smoke" ? "synthetic" : modeArg;
  if (!["synthetic", "pilot-batch"].includes(mode)) {
    throw new Error(`Chế độ không hỗ trợ: ${mode}. Dùng synthetic|pilot-batch.`);
  }
  const batchArg = parseArg("--batch-file");
  const batchFile = batchArg ? path.resolve(root, batchArg) : null;
  const sinkArg = parseArg("--sink");
  const sinkPath = sinkArg
    ? path.resolve(root, sinkArg)
    : path.join(root, "runtime", "web", "events.jsonl");
  const resetDefault = mode === "pilot-batch" ? "false" : "true";
  const resetMode = (parseArg("--reset") ?? resetDefault).toLowerCase() !== "false";

  await mkdir(path.dirname(sinkPath), { recursive: true });
  if (resetMode) {
    await rm(sinkPath, { force: true });
  }

  process.env.WEB_EVENT_SINK_PATH = sinkPath;

  const flowApiBase = "http://internal.flow.team5";
  const apiHandler = createFlowApiRequestHandler({
    webContractConfig: {
      sharedAuthUrl: "https://app-preview.iai.one/auth/entry",
      sharedBillingUrl: "https://dash-preview.iai.one/billing-center",
      sharedAppUrl: "https://app-preview.iai.one",
      sharedFlowUrl: "https://flow-preview.iai.one",
      sharedDashUrl: "https://dash-preview.iai.one"
    }
  });

  const webHandler = createWebRequestHandler({
    fetchImpl: createHandlerFetch(flowApiBase, apiHandler),
    flowApiBase
  });

  let ingestedEvents = 0;
  if (mode === "pilot-batch") {
    if (!batchFile) {
      throw new Error("Bắt buộc truyền `--batch-file` khi mode=pilot-batch.");
    }
    ingestedEvents = await runPilotBatchFlow(webHandler, batchFile);
  } else {
    await runSyntheticSmokeFlow(webHandler);
  }

  const baselineResponse = await dispatchAndAssert(webHandler, {
    url: "/events/baseline"
  });
  const baselinePayload = await baselineResponse.json();
  assert.equal(baselinePayload.ok, true);
  assert.equal(baselinePayload.data.coveragePercent, 100);
  assert.deepEqual(baselinePayload.data.missing, []);

  const eventsResponse = await dispatchAndAssert(webHandler, {
    url: "/events"
  });
  const eventsPayload = await eventsResponse.json();
  assert.equal(eventsPayload.ok, true);
  assert.ok(eventsPayload.data.total >= 12);

  const persistedEvents = Array.isArray(eventsPayload.data.items) ? eventsPayload.data.items : [];
  const jsonl = persistedEvents.map((record) => JSON.stringify(record)).join("\n");
  await writeFile(sinkPath, `${jsonl}${jsonl.length > 0 ? "\n" : ""}`, "utf8");

  process.stdout.write(
    [
      "Đã hoàn tất KPI smoke cho Team 5.",
      `Chế độ: ${mode}`,
      `Tệp sink: ${path.relative(root, sinkPath)}`,
      ...(mode === "pilot-batch"
        ? [`Batch pilot: ${path.relative(root, batchFile)}`, `Số bản ghi đã ingest: ${ingestedEvents}`]
        : []),
      `Tổng số event: ${eventsPayload.data.total}`,
      `Độ phủ baseline: ${baselinePayload.data.coveragePercent}%`
    ].join("\n"),
    () => {
      process.exit(0);
    }
  );
}

main().catch((error) => {
  process.stderr.write(
    `Lỗi KPI smoke Team 5: ${error instanceof Error ? error.message : String(error)}\n`,
    () => {
      process.exit(1);
    }
  );
});
