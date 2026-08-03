"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "scripts", "prompt-optimize.js");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} was not found`);

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function createWriter(execCommandResults) {
  const source = fs.readFileSync(scriptPath, "utf8");
  const functionSource = extractFunction(source, "writeComposerText");
  const calls = [];

  class HTMLElement {
    constructor() {
      this.isConnected = true;
      this.dispatchCount = 0;
    }

    focus() {}
  }

  class HTMLTextAreaElement extends HTMLElement {}
  class HTMLInputElement extends HTMLElement {}
  const input = new HTMLElement();
  const context = {
    HTMLElement,
    HTMLInputElement,
    HTMLTextAreaElement,
    document: {
      createRange() {
        return { selectNodeContents() {} };
      },
      execCommand(command, _showUi, value) {
        calls.push({ command, value });
        return execCommandResults[command];
      },
    },
    dispatchInputEvents(element) {
      element.dispatchCount += 1;
    },
    findComposerInput() {
      return input;
    },
    normalizeText(value) {
      return String(value);
    },
    runtime: { writeToken: 0 },
    window: {
      getSelection() {
        return { addRange() {}, removeAllRanges() {} };
      },
    },
  };
  const writer = vm.runInNewContext(`(${functionSource})`, context);
  return { calls, input, writer };
}

test("ProseMirror writer tries insertText when selectAll reports false", () => {
  const { calls, input, writer } = createWriter({ insertText: true, selectAll: false });

  const result = writer("optimized prompt", input);

  assert.equal(result.ok, true);
  assert.deepEqual(calls.map(({ command }) => command), ["selectAll", "insertText"]);
  assert.equal(input.dispatchCount, 1);
});

test("ProseMirror writer does not claim success when insertText fails", () => {
  const { calls, input, writer } = createWriter({ insertText: false, selectAll: false });

  const result = writer("optimized prompt", input);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "editor-write-unsupported");
  assert.deepEqual(calls.map(({ command }) => command), ["selectAll", "insertText"]);
  assert.equal(input.dispatchCount, 0);
});
