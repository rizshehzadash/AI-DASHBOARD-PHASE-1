/**
 * @typedef {"todo"|"doing"|"blocked"|"done"} TaskStatus
 * @typedef {{ id: string, title: string, status: TaskStatus, dueDate: string }} Task
 */

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {Task[]} tasks
 * @param {string} [today]
 */
export function summarizeTasks(tasks, today = getTodayISO()) {
  const dueToday = tasks.filter((task) => task.dueDate === today);
  const overdue = tasks.filter(
    (task) => task.dueDate < today && task.status !== "done"
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

  return { today, counts, dueToday, overdue, blocked };
}

/**
 * @param {string} message
 */
export function detectIntent(message) {
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
  if (lower.includes("summarize") || lower.includes("summary")) return "SUMMARY";
  if (lower.includes("all tasks") || lower.includes("list")) return "LIST_ALL";
  return "UNKNOWN";
}

/**
 * @param {Task[]} tasks
 * @param {string} [today]
 */
export function buildUrgentList(tasks, today = getTodayISO()) {
  const ranked = tasks
    .filter((task) => task.status !== "done" && task.status !== "blocked")
    .sort((a, b) => {
      const rank = (task) => {
        if (task.dueDate < today && task.status !== "done") return 0; // overdue
        if (task.dueDate === today && task.status !== "done") return 1; // due today
        if (task.status === "doing") return 2;
        return 3; // todo
      };
      return rank(a) - rank(b);
    })
    .slice(0, 5);

  if (ranked.length === 0) return "No urgent tasks right now.";
  const lines = ranked.map((task, index) => `${index + 1}. ${task.title}`);
  return `Top urgent tasks:\n${lines.join("\n")}`;
}

/**
 * @param {string} intent
 * @param {string} message
 * @param {Task[]} tasks
 */
export function buildReplyForIntent(intent, message, tasks) {
  const summary = summarizeTasks(tasks);

  if (intent === "DUE_TODAY") {
    if (summary.dueToday.length === 0) return "No tasks are due today.";
    const titles = summary.dueToday.map((task) => task.title).join("; ");
    return `Tasks due today: ${titles}.`;
  }

  if (intent === "OVERDUE") {
    if (summary.overdue.length === 0) return "You have no overdue tasks.";
    const titles = summary.overdue.map((task) => task.title).join("; ");
    return `Overdue tasks (${summary.overdue.length}): ${titles}.`;
  }

  if (intent === "BLOCKED") {
    if (summary.blocked.length === 0) return "No tasks are currently blocked.";
    const titles = summary.blocked.map((task) => task.title).join("; ");
    return `Blocked tasks (${summary.blocked.length}): ${titles}.`;
  }

  if (intent === "LIST_ALL") {
    if (tasks.length === 0) return "You have no tasks yet.";
    const titles = tasks.map((task) => task.title).join("; ");
    return `All tasks (${tasks.length}): ${titles}.`;
  }

  if (intent === "SUMMARY") {
    return `Summary: ${summary.counts.total} total — ${summary.counts.todo} todo, ${summary.counts.doing} doing, ${summary.counts.blocked} blocked, ${summary.counts.done} done.`;
  }

  if (intent === "URGENT" || intent === "PRIORITY") {
    return buildUrgentList(tasks, summary.today);
  }

  return buildDeterministicReply(message, tasks);
}

/**
 * @param {string} prompt
 * @param {Task[]} tasks
 */
export function buildDeterministicReply(prompt, tasks) {
  const lower = prompt.toLowerCase();
  const summary = summarizeTasks(tasks);

  if (lower.includes("due today")) {
    if (summary.dueToday.length === 0) return "No tasks are due today.";
    const titles = summary.dueToday.map((task) => task.title).join("; ");
    return `Tasks due today: ${titles}.`;
  }

  if (lower.includes("overdue")) {
    if (summary.overdue.length === 0) return "You have no overdue tasks.";
    const titles = summary.overdue.map((task) => task.title).join("; ");
    return `Overdue tasks (${summary.overdue.length}): ${titles}.`;
  }

  if (lower.includes("blocked")) {
    if (summary.blocked.length === 0) return "No tasks are currently blocked.";
    const titles = summary.blocked.map((task) => task.title).join("; ");
    return `Blocked tasks (${summary.blocked.length}): ${titles}.`;
  }

  if (lower.includes("summarize") || lower.includes("summary")) {
    return `Summary: ${summary.counts.total} total — ${summary.counts.todo} todo, ${summary.counts.doing} doing, ${summary.counts.blocked} blocked, ${summary.counts.done} done.`;
  }

  return `You have ${summary.counts.total} tasks. ${summary.counts.blocked} blocked, ${summary.overdue.length} overdue, ${summary.counts.done} done.`;
}
