const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "codex-token-usage.js");
const source = fs.readFileSync(scriptPath, "utf8");
const dailyScriptPath = path.join(__dirname, "..", "scripts", "codex-daily-token-usage.js");
const dailySource = fs.readFileSync(dailyScriptPath, "utf8");

function sourceBetween(start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(startIndex, -1, `missing source marker: ${start}`);
  assert.notEqual(endIndex, -1, `missing source marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

function loadHelpers() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    [
      "const CROSS_SOURCE_DEDUPE_WINDOW_MS = 3000;",
      sourceBetween("function extractJsonFragmentsFromSse", "function usageDetailsKey"),
      sourceBetween("function usageDetailsKey", "function extractUsages"),
      sourceBetween("function isTurnRequestUrl", "function requestUrl"),
      sourceBetween("function payloadSignalsCompletion", "function normalizeConversationId"),
      sourceBetween("function usageHasBreakdown", "function formatCacheDetails"),
      sourceBetween("function sameUsageDetails", "function mergeUsage"),
      "this.helpers = { dedupeUsages, shouldDedupeCall, summarizeConversationUsage, isTurnRequestUrl, payloadSignalsCompletion };",
    ].join("\n"),
    context,
  );
  return context.helpers;
}

test("dedupeUsages removes identical usage objects found in one payload", () => {
  const { dedupeUsages } = loadHelpers();
  const usage = {
    totalTokens: 1200,
    inputTokens: 1000,
    inputTotalTokens: 1000,
    outputTokens: 200,
    outputTotalTokens: 200,
    cachedReadTokens: 600,
  };

  assert.equal(dedupeUsages([usage, { ...usage }]).length, 1);
});

test("conversation cache summary includes every captured turn", () => {
  const { summarizeConversationUsage } = loadHelpers();
  const summary = summarizeConversationUsage([
    { usage: { hasBreakdown: true, inputTotalTokens: 1000, cachedReadTokens: 400 } },
    { usage: { hasBreakdown: true, inputTotalTokens: 500, cachedReadTokens: 100 } },
  ]);

  assert.equal(summary.inputTokens, 1500);
  assert.equal(summary.cachedTokens, 500);
  assert.equal(summary.turns, 2);
});

test("background Codex API requests do not start a turn timer", () => {
  const { isTurnRequestUrl } = loadHelpers();

  assert.equal(isTurnRequestUrl("app://codex/api/thread/list"), false);
  assert.equal(isTurnRequestUrl("https://example.test/v1/responses"), true);
  assert.equal(isTurnRequestUrl("vscode://codex/start-turn-for-host"), true);
});

test("completion events stop timing without treating generic completed records as turns", () => {
  const { payloadSignalsCompletion } = loadHelpers();

  assert.equal(payloadSignalsCompletion({ type: "response.completed" }), true);
  assert.equal(payloadSignalsCompletion("data: [DONE]"), true);
  assert.equal(payloadSignalsCompletion({ status: "completed", name: "background sync" }), false);
  assert.equal(payloadSignalsCompletion({ status: "completed", turn_id: "turn-1" }), true);
});

test("completing a turn freezes elapsed time and clears the running clock", () => {
  const start = source.indexOf("function completeCurrentTurn");
  const end = source.indexOf("function sameUsage", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const state = {
    currentTurn: { status: "running", calls: [], elapsedMs: 0, lastUpdatedAt: 0 },
    turnStartedAt: 1000,
    pendingTurnStartAt: 1000,
  };
  const context = {
    state,
    nowMs: () => 5000,
    elapsedSinceTurnStarted: () => 4000,
    scheduleRender: () => {},
    publishMetric: () => assert.fail("empty turn should not publish a metric"),
    aggregateTurnMetric: () => assert.fail("empty turn should not aggregate"),
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end)}; this.completeCurrentTurn = completeCurrentTurn;`, context);

  assert.equal(context.completeCurrentTurn(2500), true);
  assert.equal(state.currentTurn.status, "complete");
  assert.equal(state.currentTurn.elapsedMs, 2500);
  assert.equal(state.turnStartedAt, 0);
  assert.equal(state.pendingTurnStartAt, 0);
});

test("final DOM elapsed time authoritatively calibrates a completed turn once", () => {
  const start = source.indexOf("function reconcileTurnCompletionFromDom");
  const end = source.indexOf("function removeBadges", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  class MockElement {}
  const assistant = new MockElement();
  assistant.innerText = "Final response";
  const state = {
    currentTurn: {
      status: "complete",
      calls: [{}],
      elapsedMs: 8000,
      startedAt: 1000,
      assistantNodeAtStart: null,
      assistantTextAtStart: "",
    },
  };
  let publishCount = 0;
  const context = {
    Element: MockElement,
    state,
    nowMs: () => 6000,
    hasActiveStopControl: () => false,
    latestAssistantNode: () => assistant,
    elapsedFromAssistantNode: () => 3000,
    assistantResponseComplete: () => false,
    completeCurrentTurn: () => assert.fail("completed turn must not be completed twice"),
    aggregateTurnMetric: () => ({}),
    publishMetric: () => { publishCount += 1; },
    scheduleRender: () => {},
  };
  vm.createContext(context);
  vm.runInContext(`${source.slice(start, end)}; this.reconcile = reconcileTurnCompletionFromDom;`, context);

  assert.equal(context.reconcile(), true);
  assert.equal(state.currentTurn.elapsedMs, 3000);
  assert.equal(state.currentTurn.domFinalized, true);
  assert.equal(context.reconcile(), false);
  assert.equal(publishCount, 1);
});

test("badge is rendered as a body-level fixed overlay", () => {
  assert.match(source, /position:\s*fixed/);
  assert.match(source, /document\.querySelector\?\.\(`body > \.\$\{BADGE_CLASS\}`\)/);
  assert.doesNotMatch(source, /target\.insertBefore\(badge/);
});

test("same-source identical snapshots are deduplicated inside the window", () => {
  const { shouldDedupeCall } = loadHelpers();
  const base = {
    source: "network",
    scopeKey: "project:conversation",
    elapsedMs: 5000,
    usage: { totalTokens: 1200, inputTokens: 1000, outputTokens: 200 },
  };

  assert.equal(shouldDedupeCall({ ...base, elapsedMs: 6500 }, base), true);
  assert.equal(shouldDedupeCall({ ...base, elapsedMs: 9001 }, base), false);
});

test("daily average uses every calendar day in the selected period", () => {
  const start = dailySource.indexOf("function buildPeriodStats");
  const end = dailySource.indexOf("function heatLevel", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const context = {
    selectedDateKey: "2026-09-04",
    buildTrendData: (_dateKey, days) => ({
      days,
      items: [
        { dateKey: "2026-09-03", total: 100, calls: 1 },
        { dateKey: "2026-09-04", total: 200, calls: 1 },
      ],
    }),
    aggregateDay: () => ({ turns: 1 }),
  };
  vm.createContext(context);
  vm.runInContext(`${dailySource.slice(start, end)}; this.result = buildPeriodStats("2026-09-04", 30);`, context);

  assert.equal(context.result.total, 300);
  assert.equal(context.result.activeDays, 2);
  assert.equal(context.result.dailyAverage, 10);
});
