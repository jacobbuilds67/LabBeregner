import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("manifestet kan installeres som selvstændig app", async () => {
  const manifest = JSON.parse(await readFile(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
});

test("service worker cacher den komplette appskal", async () => {
  const worker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");
  for (const asset of ["index.html", "styles.css", "app.js", "calculations.js", "manifest.webmanifest"]) {
    assert.match(worker, new RegExp(asset.replace(".", "\\.")));
  }
  assert.match(worker, /caches\.match/);
});
