import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(
  "C:",
  "Users",
  "Tolojanahary",
  "Desktop",
  "vpower777",
  "apps",
  "client-web",
  "src",
  "messages",
);
const TARGETS = ["es.json", "zh.json", "ja.json", "ko.json", "nl.json", "mn.json"];
const REPORT = path.join(
  "C:",
  "Users",
  "Tolojanahary",
  "Desktop",
  "vpower777",
  ".tmp-i18n-fix.txt",
);

// Reverse map for Windows-1252 bytes 0x80-0x9F that differ from latin-1.
const CP1252_TO_BYTE = new Map([
  [0x20ac, 0x80], // €
  [0x201a, 0x82], // ‚
  [0x0192, 0x83], // ƒ
  [0x201e, 0x84], // „
  [0x2026, 0x85], // …
  [0x2020, 0x86], // †
  [0x2021, 0x87], // ‡
  [0x02c6, 0x88], // ˆ
  [0x2030, 0x89], // ‰
  [0x0160, 0x8a], // Š
  [0x2039, 0x8b], // ‹
  [0x0152, 0x8c], // Œ
  [0x017d, 0x8e], // Ž
  [0x2018, 0x91], // ‘
  [0x2019, 0x92], // ’
  [0x201c, 0x93], // “
  [0x201d, 0x94], // ”
  [0x2022, 0x95], // •
  [0x2013, 0x96], // –
  [0x2014, 0x97], // —
  [0x02dc, 0x98], // ˜
  [0x2122, 0x99], // ™
  [0x0161, 0x9a], // š
  [0x203a, 0x9b], // ›
  [0x0153, 0x9c], // œ
  [0x017e, 0x9e], // ž
  [0x0178, 0x9f], // Ÿ
]);

function encodeCp1252(str) {
  const out = Buffer.alloc(str.length);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0xff) {
      out[i] = code;
      continue;
    }
    const b = CP1252_TO_BYTE.get(code);
    if (b === undefined) {
      throw new Error(`Cannot encode U+${code.toString(16)} at index ${i}`);
    }
    out[i] = b;
  }
  return out;
}

const lines = [];
for (const name of TARGETS) {
  const file = path.join(ROOT, name);
  let raw = fs.readFileSync(file, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  try {
    const fixed = encodeCp1252(raw).toString("utf8");
    JSON.parse(fixed);
    const out = fixed.endsWith("\n") ? fixed : fixed + "\n";
    fs.writeFileSync(file, out, "utf8");
    const sample = JSON.parse(fixed).common.loading;
    lines.push(`OK ${name}: loading=${JSON.stringify(sample)}`);
  } catch (e) {
    lines.push(`FAIL ${name}: ${e.message}`);
  }
}

fs.writeFileSync(REPORT, lines.join("\n") + "\n", "utf8");
console.log(lines.join("\n"));
