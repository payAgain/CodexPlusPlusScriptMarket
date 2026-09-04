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
      sourceBetween("function usageDetailsKey", "function extractUsages"),
      sourceBetween("function sameUsageDetails", "function mergeUsage"),
      "this.helpers = { dedupeUsages, shouldDedupeCall };",
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
