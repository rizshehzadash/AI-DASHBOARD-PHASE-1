import { NextResponse } from "next/server";
import { addTask, getTasks, type Task, type TaskStatus } from "@/lib/tasks";

type CreateTaskPayload = {
  title?: string;
  status?: TaskStatus;
  dueDate?: string;
};

const validStatuses: TaskStatus[] = ["todo", "doing", "blocked", "done"];

function isValidStatus(status: unknown): status is TaskStatus {
  return typeof status === "string" && validStatuses.includes(status as TaskStatus);
}

export async function GET() {
  return NextResponse.json({ ok: true, tasks: getTasks() }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateTaskPayload;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const status = body.status ?? "todo";
    const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";

    if (!title || !dueDate || !isValidStatus(status)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid payload. Provide title, dueDate, and valid status."
        },
        { status: 400 }
      );
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      status,
      dueDate
    };

    return NextResponse.json({ ok: true, task: addTask(task) }, { status: 201 });
  } catch (err) {
    console.error("Tasks API error:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }
}
