import type { AIContextTask } from "@/lib/aiContextBuilder";
import type { Intent } from "@/lib/intentRouter";

type PromptInput = {
  intent: Intent;
  normalizedTasks: AIContextTask[];
  userMessage: string;
};

export function buildAIPrompt({
  intent,
  normalizedTasks,
  userMessage
}: PromptInput) {
  const responseContract = [
    "You must respond ONLY with valid JSON matching this schema:",
    "{",
    '  "intent": "URGENT" | "PRIORITY" | "SUMMARY" | "UNKNOWN",',
    '  "confidence": number (0 to 1),',
    '  "answer": string,',
    '  "actions": string[],',
    '  "warnings": string[]',
    "}",
    "No markdown, no commentary, no prose. actions and warnings must be arrays."
  ].join("\n");

  const taskLines = normalizedTasks.map((task) => {
    const due = task.dueDate || "no due date";
    return `- ${task.title} | ${task.status} | ${due} | overdue=${task.isOverdue}`;
  });

  return [
    responseContract,
    `Intent: ${intent}`,
    `User: ${userMessage}`,
    "Tasks:",
    taskLines.length > 0 ? taskLines.join("\n") : "- none"
  ].join("\n");
}
