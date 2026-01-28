import type { AIContextTask } from "@/lib/aiContextBuilder";
import type { AIResponse } from "@/lib/aiTypes";
import type { Intent } from "@/lib/intentRouter";
import { buildAIPrompt } from "@/lib/aiPromptBuilder";
import {
  buildDeterministicReply,
  buildPriorityResponse,
  buildReplyForIntent,
  buildSummaryResponse,
  buildUrgentRankedResponse
} from "@/lib/intentRouter";
import type { Task } from "@/lib/tasks";

type Provider = "mock" | "openai" | "gemini";

type RunAIInput = {
  intent: Intent;
  normalizedTasks: AIContextTask[];
  userMessage: string;
  provider: Provider;
};

function denormalizeTasks(normalizedTasks: AIContextTask[]): Task[] {
  return normalizedTasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate
  }));
}

function isValidAIResponse(value: unknown): value is AIResponse {
  if (!value || typeof value !== "object") return false;
  const obj = value as AIResponse;
  const validIntent =
    obj.intent === "URGENT" ||
    obj.intent === "PRIORITY" ||
    obj.intent === "SUMMARY" ||
    obj.intent === "UNKNOWN";
  const validConfidence =
    typeof obj.confidence === "number" &&
    obj.confidence >= 0 &&
    obj.confidence <= 1;
  const validAnswer = typeof obj.answer === "string";
  const validActions =
    Array.isArray(obj.actions) && obj.actions.every((a) => typeof a === "string");
  const validWarnings =
    Array.isArray(obj.warnings) && obj.warnings.every((w) => typeof w === "string");
  return validIntent && validConfidence && validAnswer && validActions && validWarnings;
}

function toAIResponseIntent(intent: Intent): AIResponse["intent"] {
  if (intent === "URGENT") return "URGENT";
  if (intent === "PRIORITY") return "PRIORITY";
  if (intent === "SUMMARY") return "SUMMARY";
  return "UNKNOWN";
}

function buildMockResponse(
  intent: Intent,
  tasks: Task[],
  userMessage: string,
  warnings: string[] = []
): AIResponse {
  let answer = "";
  if (intent === "SUMMARY") {
    answer = buildSummaryResponse(tasks);
  } else if (intent === "URGENT") {
    answer = buildUrgentRankedResponse(tasks);
  } else if (intent === "PRIORITY") {
    answer = buildPriorityResponse(tasks);
  } else if (intent !== "UNKNOWN") {
    answer = buildReplyForIntent(intent, userMessage, tasks);
  } else {
    answer = buildDeterministicReply(userMessage, tasks);
  }

  return {
    intent: toAIResponseIntent(intent),
    confidence: intent === "UNKNOWN" ? 0.6 : 1,
    answer,
    actions: [],
    warnings
  };
}

export async function runAI({
  intent,
  normalizedTasks,
  userMessage,
  provider
}: RunAIInput) {
  const tasks = denormalizeTasks(normalizedTasks);

  if (provider === "mock") {
    return buildMockResponse(intent, tasks, userMessage);
  }

  if (provider === "gemini") {
    return {
      intent: toAIResponseIntent(intent),
      confidence: 0.1,
      answer: `[LLM placeholder] Intent: ${intent}, Tasks: ${normalizedTasks.length}`,
      actions: [],
      warnings: ["Gemini provider not implemented yet."]
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      intent: toAIResponseIntent(intent),
      confidence: 0.1,
      answer: "[OpenAI placeholder] Missing API key.",
      actions: [],
      warnings: ["Missing OPENAI_API_KEY."]
    };
  }

  const prompt = buildAIPrompt({ intent, normalizedTasks, userMessage });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }

    const data = await response.json();
    const rawText =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";
    const parsed = JSON.parse(rawText);
    if (!isValidAIResponse(parsed)) {
      return buildMockResponse(intent, tasks, userMessage, [
        "Invalid AIResponse shape from OpenAI."
      ]);
    }
    return parsed;
  } catch {
    return buildMockResponse(intent, tasks, userMessage, [
      "OpenAI request failed; using deterministic fallback."
    ]);
  }
}
