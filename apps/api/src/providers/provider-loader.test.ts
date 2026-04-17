import test from "node:test";
import assert from "node:assert/strict";
import { getProvider } from "./provider-loader";

test("getProvider returns python provider for xtts_hi", () => {
  const provider = getProvider("xtts_hi");
  assert.ok(provider);
  assert.equal(typeof provider.synthesize, "function");
});

test("getProvider throws for unknown model", () => {
  assert.throws(() => getProvider("unknown_model"), /Unknown model/);
});
