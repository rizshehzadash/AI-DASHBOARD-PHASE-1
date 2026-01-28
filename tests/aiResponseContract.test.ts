import { strict as assert } from "node:assert";
import test from "node:test";
import { runAI } from "../src/lib/aiOrchestrator";

const normalizedTasks = [
  {
    id: "t1",
    title: "Finish report",
    status: "doing",
    dueDate: "2026-01-23",
    isOverdue: false
  }
];

test("mock provider returns valid AIResponse shape", async () => {
  const reply = await runAI({
    intent: "SUMMARY",
    normalizedTasks,
    userMessage: "summarize my tasks",
    provider: "mock"
  });
  assert.ok(typeof reply.answer === "string");
  assert.ok(Array.isArray(reply.actions));
  assert.ok(Array.isArray(reply.warnings));
  assert.ok(reply.confidence >= 0 && reply.confidence <= 1);
});

test("invalid JSON triggers deterministic fallback", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key";
  globalThis.fetch = async () =>
    ({
      ok: true,
      json: async () => ({ output_text: "not-json" })
    }) as Response;

  const reply = await runAI({
    intent: "SUMMARY",
    normalizedTasks,
    userMessage: "summarize my tasks",
    provider: "openai"
  });

  assert.ok(reply.answer.startsWith("Summary:"));
  assert.ok(reply.warnings.length > 0);

  globalThis.fetch = originalFetch;
  process.env.OPENAI_API_KEY = originalKey;
});

test("confidence is always within bounds", async () => {
  const reply = await runAI({
    intent: "UNKNOWN",
    normalizedTasks,
    userMessage: "hello",
    provider: "mock"
  });
  assert.ok(reply.confidence >= 0 && reply.confidence <= 1);
});
