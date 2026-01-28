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

test("runAI returns mock output when provider is mock", async () => {
  const reply = await runAI({
    intent: "SUMMARY",
    normalizedTasks,
    userMessage: "summarize my tasks",
    provider: "mock"
  });
  assert.equal(reply.intent, "SUMMARY");
  assert.ok(reply.answer.startsWith("Summary:"));
});

test("runAI returns placeholder when OpenAI key is missing", async () => {
  const reply = await runAI({
    intent: "SUMMARY",
    normalizedTasks,
    userMessage: "summarize my tasks",
    provider: "openai"
  });
  assert.ok(reply.answer.startsWith("[OpenAI placeholder]"));
});
