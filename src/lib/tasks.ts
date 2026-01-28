export type TaskStatus = "todo" | "doing" | "blocked" | "done";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
};

const tasks: Task[] = [
  {
    id: "task-001",
    title: "Draft Q1 roadmap summary",
    status: "doing",
    dueDate: "2026-01-28"
  },
  {
    id: "task-002",
    title: "Follow up on vendor security review",
    status: "blocked",
    dueDate: "2026-01-30"
  },
  {
    id: "task-003",
    title: "Prepare demo deck for stakeholders",
    status: "todo",
    dueDate: "2026-02-02"
  },
  {
    id: "task-004",
    title: "Ship dashboard v1 layout polish",
    status: "doing",
    dueDate: "2026-01-27"
  },
  {
    id: "task-005",
    title: "Close out January metrics report",
    status: "done",
    dueDate: "2026-01-24"
  }
];

export function getTasks() {
  return tasks;
}

export function addTask(task: Task) {
  tasks.push(task);
  return task;
}
