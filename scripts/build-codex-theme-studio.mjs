#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const templatePath = path.join(root, "scripts", "src", "codex-theme-studio.template.js");
const outputPath = path.join(root, "scripts", "codex-theme-studio.js");
const fontRoot = path.join(root, "scripts", "assets", "fonts");

const fonts = {
  __CTS_FONT_PLEX_400__: path.join(fontRoot, "ibm-plex-serif", "IBMPlexSerif-400.woff2"),
  __CTS_FONT_PLEX_600__: path.join(fontRoot, "ibm-plex-serif", "IBMPlexSerif-600.woff2"),
  __CTS_FONT_NOTO_400__: path.join(fontRoot, "noto-sans-sc", "NotoSansSC-400.woff2"),
  __CTS_FONT_NOTO_600__: path.join(fontRoot, "noto-sans-sc", "NotoSansSC-600.woff2"),
  __CTS_FONT_RECURSIVE__: path.join(fontRoot, "recursive", "Recursive-VF.woff2"),
};

let output = readFileSync(templatePath, "utf8");
output = output.replaceAll("\r\n", "\n");
for (const [marker, file] of Object.entries(fonts)) {
  const dataUri = `data:font/woff2;base64,${readFileSync(file).toString("base64")}`;
  output = output.replaceAll(marker, dataUri);
}

if (/__CTS_FONT_[A-Z0-9_]+__/.test(output)) {
  throw new Error("Unresolved font placeholder in generated theme script");
}

writeFileSync(outputPath, output, "utf8");

const hash = createHash("sha256").update(output).digest("hex").toUpperCase();
console.log(`${path.relative(root, outputPath)} ${output.length} bytes`);
console.log(`SHA256 ${hash}`);
