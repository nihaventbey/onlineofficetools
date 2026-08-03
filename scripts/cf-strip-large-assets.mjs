#!/usr/bin/env node
/**
 * Cloudflare Workers static assets max file size is 25 MiB.
 * onnxruntime-web ships a ~26 MiB WASM that Next copies into /_next/static.
 * ImageAiUpscale loads WASM from jsDelivr instead, so we can drop oversized
 * copies before wrangler upload.
 */
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), ".open-next", "assets");
const LIMIT = 25 * 1024 * 1024;

function walk(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      walk(path);
      continue;
    }
    const size = statSync(path).size;
    if (size > LIMIT) {
      unlinkSync(path);
      console.log(
        `cf-strip-large-assets: removed ${path} (${(size / 1024 / 1024).toFixed(1)} MiB)`,
      );
    }
  }
}

try {
  walk(ROOT);
} catch (e) {
  if (e && e.code === "ENOENT") {
    console.warn("cf-strip-large-assets: .open-next/assets missing — skip");
    process.exit(0);
  }
  throw e;
}
