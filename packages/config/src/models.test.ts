import test from "node:test";
import assert from "node:assert/strict";
import { getModel, listModels } from "./models";

test("listModels includes xtts_hi", () => {
  const models = listModels();
  assert.ok(models.some((model) => model.id === "xtts_hi"));
});

test("getModel returns config for xtts_hi", () => {
  const model = getModel("xtts_hi");
  assert.equal(model.provider, "xtts");
  assert.equal(model.type, "python");
});

test("getModel throws for unsupported model", () => {
  assert.throws(() => getModel("does_not_exist"), /Unknown model/);
});
