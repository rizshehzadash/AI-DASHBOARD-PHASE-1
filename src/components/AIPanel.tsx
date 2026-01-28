"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/tasks";
import {
  detectIntent
} from "@/lib/intentRouter";
import { buildAIContext, type AIContextTask } from "@/lib/aiContextBuilder";
import { runAI } from "@/lib/aiOrchestrator";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AIPanel() {
  const [model, setModel] = useState("openai");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      role: "assistant",
      content: "Hi! I can help summarize, draft, or analyze your data."
    },
    {
      id: "m2",
      role: "user",
      content: "Show me a quick summary of today's tasks."
    },
    {
      id: "m3",
      role: "assistant",
      content: "Mock summary: 3 tasks due today, 2 overdue, 1 blocked."
    }
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  // intent routing handled by shared helper for consistent behavior

  function normalizeErrorMessage(value: unknown): string {
    if (typeof value === "string" && value.trim().length > 0) return value;
    if (
      value &&
      typeof value === "object" &&
      "message" in value &&
      typeof (value as { message?: unknown }).message === "string"
    ) {
      return (value as { message: string }).message;
    }
    if (value && typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "Unexpected error.";
      }
    }
    if (value === null || value === undefined) return "Failed to reach AI service.";
    return String(value);
  }

  function appendMessage(role: Message["role"], content: string) {
    setMessages((prev) => {
      const nextId = prev.length + 1;
      return [...prev, { id: `m${nextId}`, role, content }];
    });
  }

  function getMockReply(prompt: string) {
    return `Mock response: I received "${prompt}".`;
  }

  async function fallbackToMock(prompt: string, normalizedTasks: AIContextTask[]) {
    appendMessage(
      "assistant",
      normalizeErrorMessage("AI temporarily unavailable — using mock response.")
    );
    const response = await runAI({
      intent: detectIntent(prompt),
      normalizedTasks,
      userMessage: prompt,
      provider: "mock"
    });
    console.info("AI response:", response);
    appendMessage("assistant", response.answer || getMockReply(prompt));
  }

  async function handleSend() {
    if (!canSend || isSending) return;
    const trimmed = input.trim();
    appendMessage("user", trimmed);
    setInput("");

    let tasks: Task[] = [];
    try {
      const taskRes = await fetch("/api/tasks");
      const taskData = await taskRes.json().catch(() => null);
      if (taskRes.ok && Array.isArray(taskData?.tasks)) {
        tasks = taskData.tasks as Task[];
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    }
    const context = buildAIContext(tasks);
    const normalizedTasks = context.tasks;

    const intent = detectIntent(trimmed);
    console.info("AI intent detected:", intent);
    const provider =
      intent === "UNKNOWN"
        ? model === "gemini"
          ? "gemini"
          : "openai"
        : "mock";
    console.info("AI provider selected:", provider);

    if (Date.now() < cooldownUntil && provider !== "mock") {
      await fallbackToMock(trimmed, normalizedTasks);
      return;
    }

    try {
      setIsSending(true);
      const reply = await runAI({
        intent,
        normalizedTasks,
        userMessage: trimmed,
        provider
      });
      console.info("AI response:", reply);
      appendMessage("assistant", reply.answer);
    } catch (err) {
      const message = normalizeErrorMessage(err);
      console.error("Chat error:", { message });
      setCooldownUntil(Date.now() + 30_000);
      await fallbackToMock(trimmed, normalizedTasks);
      appendMessage("assistant", `⚠️ ${normalizeErrorMessage(message)}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <aside className="flex h-screen w-[380px] shrink-0 flex-col border-l border-slate-800 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="text-sm font-semibold text-slate-100">
          AI Assistant
        </div>
        <select
          value={model}
          onChange={(event) => setModel(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600"
          aria-label="Model selector"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                {normalizeErrorMessage(message.content)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-600"
            type="text"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </aside>
  );
}
