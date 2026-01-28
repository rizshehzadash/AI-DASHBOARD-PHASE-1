"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "todo" | "doing" | "blocked" | "done";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
};

const statusOptions: TaskStatus[] = ["todo", "doing", "blocked", "done"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && dueDate.trim().length > 0,
    [title, dueDate]
  );

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/tasks", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(
            data?.error || `Failed to load tasks (${res.status}).`
          );
        }
        if (active) {
          setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Failed to load tasks.";
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTasks();
    return () => {
      active = false;
    };
  }, []);

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const optimisticId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: optimisticId,
      title: title.trim(),
      status,
      dueDate: dueDate.trim()
    };

    setTasks((prev) => [newTask, ...prev]);
    setTitle("");
    setStatus("todo");
    setDueDate("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newTask.title,
          status: newTask.status,
          dueDate: newTask.dueDate
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to create task (${res.status}).`
        );
      }
      if (data?.task) {
        setTasks((prev) =>
          prev.map((task) => (task.id === optimisticId ? data.task : task))
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create task.";
      setError(message);
      setTasks((prev) => prev.filter((task) => task.id !== optimisticId));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-slate-400">
          Simple task management backed by the local API.
        </p>
      </header>

      <form
        onSubmit={handleCreateTask}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <label className="text-xs text-slate-400">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            placeholder="e.g. Review Q1 roadmap"
            type="text"
          />
        </div>
        <div className="flex min-w-[140px] flex-col gap-1">
          <label className="text-xs text-slate-400">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[160px] flex-col gap-1">
          <label className="text-xs text-slate-400">Due date</label>
          <input
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            type="date"
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isSubmitting ? "Creating..." : "Add Task"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-sm text-slate-400">No tasks yet.</div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-slate-100">
                      {task.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      Due {task.dueDate}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                    {task.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
