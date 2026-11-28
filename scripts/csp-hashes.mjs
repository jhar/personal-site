// Runs after `next build`. Pins every exported page's inline scripts (Next's
// hydration data) with a <meta> Content-Security-Policy listing their SHA-256
// hashes, so the page can't run any other inline script.
//
// The rest of the policy is a header in public/_headers. That header still
// allows 'unsafe-inline' scripts, so a page without this <meta> keeps working;
// browsers enforce both policies, so with it only the listed scripts run.
//
// JSON-LD (<script type="application/ld+json">) is data, not code, so CSP
// doesn't apply to it and it isn't hashed.

import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = process.argv[2] ?? "out";
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const EXECUTABLE_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);
const MARKER = 'http-equiv="Content-Security-Policy"';

function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(SCRIPT)) {
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1] ?? "";
    if (!EXECUTABLE_TYPES.has(type.toLowerCase())) continue;
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return [...hashes];
}

function withPolicy(html) {
  const policy = ["'self'", ...inlineScriptHashes(html)].join(" ");
  const meta = `<meta ${MARKER} content="script-src ${policy}"/>`;
  // Right after the charset, which has to stay first, and before any script.
  const charset = /<meta\s+charset[^>]*>/i.exec(html);
  if (charset) {
    const at = charset.index + charset[0].length;
    return html.slice(0, at) + meta + html.slice(at);
  }
  const head = /<head[^>]*>/i.exec(html);
  if (!head) return null;
  const at = head.index + head[0].length;
  return html.slice(0, at) + meta + html.slice(at);
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

let pinned = 0;
for await (const file of htmlFiles(OUT)) {
  const html = await readFile(file, "utf8");
  if (html.includes(MARKER)) continue;
  const updated = withPolicy(html);
  if (updated === null) {
    console.warn(`csp-hashes: no <head> in ${file}, left as is`);
    continue;
  }
  await writeFile(file, updated);
  pinned++;
}
console.log(`csp-hashes: pinned inline scripts in ${pinned} pages`);
