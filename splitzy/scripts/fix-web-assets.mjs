// Cloudflare Pages silently drops any directory named `node_modules` during
// upload. Expo's web export writes package-provided assets (the vector-icon
// font, expo-router's nav icons) under `dist/assets/node_modules/...`, so they
// 404 on Pages and every icon renders as a blank box.
//
// This rewrites that path segment to `assets/deps/` — on disk and in every
// text file that references it — after `expo export` and before `wrangler
// pages deploy`.

import { readdir, rename, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const DIST = "dist";
const FROM = "assets/node_modules/";
const TO = "assets/deps/";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const oldDir = join(DIST, "assets", "node_modules");
try {
  await stat(oldDir);
  await rename(oldDir, join(DIST, "assets", "deps"));
  console.log(`renamed ${oldDir} -> ${join(DIST, "assets", "deps")}`);
} catch {
  console.log(`no ${oldDir} to rename (already done or nothing exported there)`);
}

const textExt = /\.(js|css|html|json|map)$/;
let patched = 0;
for (const file of await walk(DIST)) {
  if (!textExt.test(file)) continue;
  const body = await readFile(file, "utf8");
  if (!body.includes(FROM)) continue;
  await writeFile(file, body.split(FROM).join(TO));
  patched++;
}
console.log(`patched ${patched} file(s): ${FROM} -> ${TO}`);
