import { strict as assert } from "node:assert";
import test from "node:test";
import { buildAIContext } from "../src/lib/aiContextBuilder";

const tasks = [
  {
    id: "t1",
    title: "Finish report",
    status: "doing",
    dueDate: "2026-01-22"
  },
  {
    id: "t2",
    title: "Prep demo",
    status: "todo",
    dueDate: "2026-01-23"
  },
  {
    id: "t3",
    title: "Vendor contract",
    status: "blocked",
    dueDate: "2026-01-21"
  },
  {
    id: "t4",
    title: "Close metrics",
    status: "done",
    dueDate: "2026-01-20"
  }
];

test("buildAIContext returns normalized context with counts", () => {
  const context = buildAIContext(tasks);
  assert.equal(context.timezone, "Asia/Dubai");
  assert.equal(context.totalTasks, 4);
  assert.equal(context.counts.todo, 1);
  assert.equal(context.counts.doing, 1);
  assert.equal(context.counts.blocked, 1);
  assert.equal(context.counts.done, 1);
  assert.equal(context.tasks.length, 4);
});

test("buildAIContext calculates overdue excluding blocked/done", () => {
  const context = buildAIContext(tasks);
  const overdueTasks = context.tasks.filter((task) => task.isOverdue);
  assert.equal(context.overdueCount, overdueTasks.length);
  assert.ok(overdueTasks.every((task) => task.status !== "blocked"));
  assert.ok(overdueTasks.every((task) => task.status !== "done"));
});
