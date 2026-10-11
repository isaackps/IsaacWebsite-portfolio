// Post-build: make dist/index.html open from file:// (double-click) in Chrome, Safari and Firefox.
// The bundle has no imports/exports left (single chunk), so it can run as a classic script.
import { readFileSync, writeFileSync } from "node:fs";
const f = new URL("../dist/index.html", import.meta.url);
let html = readFileSync(f, "utf8");
const re = /<script type="module"[^>]*>([\s\S]*?)<\/script>/;
const m = html.match(re);
if (!m || m[1].trim().length < 1000) throw new Error("inline module script not found or empty");
if (/\bimport\s*\(|^\s*import\s|\bexport\s*\{/m.test(m[1].slice(0, 400))) console.warn("warning: script starts with import/export");
html = html.replace(m[0], () => "");
const js = m[1].replace(/<\/script/gi, "<\\/script");
html = html.replace("</body>", () => `<script>(function(){${js}\n})();</script>\n</body>`); // function form: no $-pattern expansion of the bundle
writeFileSync(f, html);
console.log(`file-protocol: classic inline script ${(js.length / 1024).toFixed(0)} KB, index.html ${(html.length / 1024).toFixed(0)} KB`);
