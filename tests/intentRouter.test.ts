import { strict as assert } from "node:assert";
import test from "node:test";
import {
  buildSummaryResponse,
  buildUrgentRankedResponse,
  buildPriorityResponse,
  detectIntent
} from "../src/lib/intentRouter";

const tasks = [
  {
    id: "t1",
    title: "Finish report",
    status: "doing",
    dueDate: "2026-01-23"
  },
  {
    id: "t2",
    title: "Pay invoices",
    status: "todo",
    dueDate: "2026-01-22"
  },
  {
    id: "t3",
    title: "Prep client demo",
    status: "todo",
    dueDate: "2026-01-24"
  }
];

const today = "2026-01-23";

test("show urgent tasks returns ranked list", () => {
  const intent = detectIntent("show urgent tasks");
  assert.equal(intent, "URGENT");
  const reply = buildUrgentRankedResponse(tasks, today);
  assert.ok(reply.startsWith("1."));
  assert.ok(reply.includes("Finish report — doing"));
});

test("what should I work on first returns ranked list", () => {
  const intent = detectIntent("what should I work on first");
  assert.equal(intent, "PRIORITY");
  const reply = buildPriorityResponse(tasks, today);
  assert.ok(reply.startsWith("You should work on:"));
  assert.ok(!reply.trim().startsWith("1."));
  assert.ok(reply.includes("Reason:"));
});

test("summarize my tasks returns counts", () => {
  const intent = detectIntent("summarize my tasks");
  assert.equal(intent, "SUMMARY");
  const reply = buildSummaryResponse(tasks, today);
  assert.ok(reply.startsWith("Summary:"));
});
