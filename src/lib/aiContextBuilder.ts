import type { Task } from "@/lib/tasks";
import { getTodayISO } from "@/lib/intentRouter";

type TaskStatusCounts = {
  todo: number;
  doing: number;
  blocked: number;
  done: number;
};

export type AIContextTask = {
  id: string;
  title: string;
  status: Task["status"];
  dueDate: string;
  isOverdue: boolean;
};

export type AIContext = {
  todayISO: string;
  timezone: "Asia/Dubai";
  totalTasks: number;
  counts: TaskStatusCounts;
  overdueCount: number;
  tasks: AIContextTask[];
};

export function buildAIContext(tasks: Task[]): AIContext {
  const todayISO = getTodayISO();
  const counts: TaskStatusCounts = {
    todo: 0,
    doing: 0,
    blocked: 0,
    done: 0
  };

  const normalized = tasks.map((task) => {
    counts[task.status] += 1;
    const isOverdue =
      !!task.dueDate &&
      task.dueDate < todayISO &&
      task.status !== "blocked" &&
      task.status !== "done";
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      isOverdue
    };
  });

  const overdueCount = normalized.filter((task) => task.isOverdue).length;

  return {
    todayISO,
    timezone: "Asia/Dubai",
    totalTasks: tasks.length,
    counts,
    overdueCount,
    tasks: normalized
  };
}
