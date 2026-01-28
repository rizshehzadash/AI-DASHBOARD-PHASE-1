export type AIResponse = {
  intent: "URGENT" | "PRIORITY" | "SUMMARY" | "UNKNOWN";
  confidence: number;
  answer: string;
  actions: string[];
  warnings: string[];
};
