// Wraps src/app.html (artifact-format page) in a full document -> index.html
import { readFileSync, writeFileSync } from "node:fs";
const body = readFileSync(new URL("../src/app.html", import.meta.url), "utf8");
const doc = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${body}</body></html>`;
writeFileSync(new URL("../index.html", import.meta.url), doc);
console.log("built index.html", doc.length, "bytes");
