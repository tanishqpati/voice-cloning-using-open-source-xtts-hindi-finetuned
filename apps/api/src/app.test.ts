import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "./app";

test("GET /health returns ok", async () => {
  const app = createApp();
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("GET /models returns model list", async () => {
  const app = createApp();
  const response = await request(app).get("/models");
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.models));
  assert.equal(response.body.models[0].id, "xtts_hi");
});

test("POST /generate validates required fields", async () => {
  const app = createApp();

  const missingText = await request(app)
    .post("/generate")
    .field("model", "xtts_hi");
  assert.equal(missingText.status, 400);
  assert.equal(missingText.body.error, "text is required");

  const missingModel = await request(app)
    .post("/generate")
    .field("text", "test sentence");
  assert.equal(missingModel.status, 400);
  assert.equal(missingModel.body.error, "model is required");

  const missingFile = await request(app)
    .post("/generate")
    .field("text", "test sentence")
    .field("model", "xtts_hi");
  assert.equal(missingFile.status, 400);
  assert.equal(missingFile.body.error, "file is required");
});
