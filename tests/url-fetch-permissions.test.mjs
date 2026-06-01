import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadUrlFetchPermissionsModule(permissionsApi) {
  const context = vm.createContext({
    console,
    chrome: { permissions: permissionsApi }
  });
  vm.runInContext(
    readFileSync(join(root, "js/services/url-fetch-permissions.js"), "utf8"),
    context,
    { filename: "url-fetch-permissions.js" }
  );
  return context;
}

test("ensureUrlFetchHostPermissions skips when permissions API is missing", async () => {
  const ctx = loadUrlFetchPermissionsModule(undefined);
  const result = await ctx.ensureUrlFetchHostPermissions();
  assert.equal(result.ok, true);
});

test("ensureUrlFetchHostPermissions returns ok when permission already granted", async () => {
  const ctx = loadUrlFetchPermissionsModule({
    contains: async () => true,
    request: async () => {
      throw new Error("request should not be called");
    }
  });
  const result = await ctx.ensureUrlFetchHostPermissions();
  assert.equal(result.ok, true);
});

test("ensureUrlFetchHostPermissions requests optional origins when missing", async () => {
  let requestedOrigins = null;
  const ctx = loadUrlFetchPermissionsModule({
    contains: async () => false,
    request: async ({ origins }) => {
      requestedOrigins = origins;
      return true;
    }
  });
  const result = await ctx.ensureUrlFetchHostPermissions();
  assert.equal(result.ok, true);
  assert.equal(requestedOrigins?.length, 2);
  assert.equal(requestedOrigins?.[0], "http://*/*");
  assert.equal(requestedOrigins?.[1], "https://*/*");
});

test("ensureUrlFetchHostPermissions returns ok false when user denies", async () => {
  const ctx = loadUrlFetchPermissionsModule({
    contains: async () => false,
    request: async () => false
  });
  const result = await ctx.ensureUrlFetchHostPermissions();
  assert.equal(result.ok, false);
});
