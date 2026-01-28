import type { Task } from "@/lib/tasks";

export type Intent =
  | "SUMMARY"
  | "BLOCKED"
  | "DUE_TODAY"
  | "LIST_ALL"
  | "OVERDUE"
  | "URGENT"
  | "PRIORITY"
  | "UNKNOWN";

export function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  if (lower.includes("due today")) return "DUE_TODAY";
  if (lower.includes("overdue")) return "OVERDUE";
  if (lower.includes("blocked")) return "BLOCKED";
  if (
    lower.includes("prioritize") ||
    lower.includes("priority") ||
    lower.includes("work on first")
  ) {
    return "PRIORITY";
  }
  if (lower.includes("urgent")) return "URGENT";
  if (lower.includes("summarize") || lower.includes("summary")) {
    return "SUMMARY";
  }
  if (lower.includes("all tasks") || lower.includes("list")) {
    return "LIST_ALL";
  }
  return "UNKNOWN";
}

export function getTodayISO() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getTomorrowISO(todayISO: string) {
  const date = new Date(`${todayISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getEdgeCaseMessage(tasks: Task[]) {
  if (tasks.length === 0) return "You have no tasks yet.";
  const activeTasks = tasks.filter((task) => task.status !== "done");
  if (activeTasks.length === 0) return "All tasks are completed 🎉";
  const unblocked = activeTasks.filter((task) => task.status !== "blocked");
  if (unblocked.length === 0) return "All remaining tasks are blocked.";
  return null;
}

function formatDueText(task: Task, todayISO: string) {
  if (!task.dueDate) return "no due date";
  if (task.dueDate === todayISO) return "due today";
  const tomorrow = getTomorrowISO(todayISO);
  if (task.dueDate === tomorrow) return "due tomorrow";
  return `due ${task.dueDate}`;
}

export function summarizeTasks(tasks: Task[], todayISO = getTodayISO()) {
  const dueToday = tasks.filter((task) => task.dueDate === todayISO);
  const overdue = tasks.filter(
    (task) => task.dueDate < todayISO && task.status !== "done"
  );
  const blocked = tasks.filter((task) => task.status === "blocked");
  const counts = tasks.reduce(
    (acc, task) => {
      acc.total += 1;
      acc[task.status] += 1;
      return acc;
    },
    { total: 0, todo: 0, doing: 0, blocked: 0, done: 0 }
  );

  return {
    today: todayISO,
    counts,
    dueToday,
    overdue,
    blocked
  };
}

export function rankUrgentTasks(tasks: Task[], todayISO = getTodayISO()) {
  return tasks
    .filter((task) => task.status !== "done" && task.status !== "blocked")
    .sort((a, b) => {
      const rank = (task: Task) => {
        if (task.dueDate && task.dueDate < todayISO && task.status !== "done")
          return 0; // overdue
        if (task.dueDate && task.dueDate === todayISO && task.status !== "done")
          return 1; // due today
        if (task.status === "doing") return 2;
        if (task.status === "todo") return 3;
        return 4;
      };
      return rank(a) - rank(b);
    });
}

export function buildSummaryResponse(tasks: Task[], todayISO = getTodayISO()) {
  const summary = summarizeTasks(tasks, todayISO);
  return `Summary: ${summary.counts.total} total — ${summary.counts.todo} todo, ${summary.counts.doing} doing, ${summary.counts.blocked} blocked, ${summary.counts.done} done. Overdue: ${summary.overdue.length}.`;
}

export function buildUrgentRankedResponse(tasks: Task[], todayISO = getTodayISO()) {
  const edgeCase = getEdgeCaseMessage(tasks);
  if (edgeCase) return edgeCase;
  const ranked = rankUrgentTasks(tasks, todayISO).slice(0, 5);
  if (ranked.length === 0) return "No urgent tasks right now.";
  const lines = ranked.map((task, index) => {
    const dueText = formatDueText(task, todayISO);
    return `${index + 1}. ${task.title} — ${task.status} — ${dueText}`;
  });
  return lines.join("\n");
}

export function buildPriorityResponse(tasks: Task[], todayISO = getTodayISO()) {
  const edgeCase = getEdgeCaseMessage(tasks);
  if (edgeCase) return edgeCase;
  const ranked = rankUrgentTasks(tasks, todayISO);
  if (ranked.length === 0) return "No urgent tasks right now.";
  const top = ranked[0];
  const dueText = formatDueText(top, todayISO);
  let reason = "";
  if (top.dueDate && top.dueDate < todayISO) {
    reason = "It is overdue.";
  } else if (top.dueDate === todayISO) {
    reason = "It is due today.";
  } else if (top.status === "doing") {
    reason = "It is currently in progress.";
  } else if (top.status === "todo") {
    reason = "It is next in your queue.";
  } else {
    reason = `It is ${dueText}.`;
  }
  return `You should work on: ${top.title}.\nReason: ${reason}`;
}

export function buildReplyForIntent(
  intent: Intent,
  message: string,
  tasks: Task[],
  todayISO = getTodayISO()
) {
  const summary = summarizeTasks(tasks, todayISO);
  if (intent === "DUE_TODAY") {
    if (summary.dueToday.length === 0) {
      return "No tasks are due today.";
    }
    const titles = summary.dueToday.map((task) => task.title).join("; ");
    return `Tasks due today: ${titles}.`;
  }

  if (intent === "OVERDUE") {
    if (summary.overdue.length === 0) {
      return "You have no overdue tasks.";
    }
    const titles = summary.overdue.map((task) => task.title).join("; ");
    return `Overdue tasks (${summary.overdue.length}): ${titles}.`;
  }

  if (intent === "BLOCKED") {
    if (summary.blocked.length === 0) {
      return "No tasks are currently blocked.";
    }
    const titles = summary.blocked.map((task) => task.title).join("; ");
    return `Blocked tasks (${summary.blocked.length}): ${titles}.`;
  }

  if (intent === "LIST_ALL") {
    if (tasks.length === 0) return "You have no tasks yet.";
    const titles = tasks.map((task) => task.title).join("; ");
    return `All tasks (${tasks.length}): ${titles}.`;
  }

  if (intent === "SUMMARY") {
    return buildSummaryResponse(tasks, todayISO);
  }

  if (intent === "URGENT") {
    return buildUrgentRankedResponse(tasks, todayISO);
  }
  if (intent === "PRIORITY") {
    return buildPriorityResponse(tasks, todayISO);
  }

  return buildDeterministicReply(message, tasks, todayISO);
}

export function buildDeterministicReply(
  prompt: string,
  tasks: Task[],
  todayISO = getTodayISO()
) {
  const lower = prompt.toLowerCase();
  const summary = summarizeTasks(tasks, todayISO);

  if (lower.includes("due today")) {
    if (summary.dueToday.length === 0) {
      return "No tasks are due today.";
    }
    const titles = summary.dueToday.map((task) => task.title).join("; ");
    return `Tasks due today: ${titles}.`;
  }

  if (lower.includes("overdue")) {
    if (summary.overdue.length === 0) {
      return "You have no overdue tasks.";
    }
    const titles = summary.overdue.map((task) => task.title).join("; ");
    return `Overdue tasks (${summary.overdue.length}): ${titles}.`;
  }

  if (lower.includes("blocked")) {
    if (summary.blocked.length === 0) {
      return "No tasks are currently blocked.";
    }
    const titles = summary.blocked.map((task) => task.title).join("; ");
    return `Blocked tasks (${summary.blocked.length}): ${titles}.`;
  }

  if (lower.includes("summarize") || lower.includes("summary")) {
    return `Summary: ${summary.counts.total} total — ${summary.counts.todo} todo, ${summary.counts.doing} doing, ${summary.counts.blocked} blocked, ${summary.counts.done} done.`;
  }

  return `You have ${summary.counts.total} tasks. ${summary.counts.blocked} blocked, ${summary.overdue.length} overdue, ${summary.counts.done} done.`;
}
