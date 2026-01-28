import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------- utils ----------

function safeJsonParse(text: string) {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// ---------- handler ----------

export async function POST(req: Request) {
  try {
    const body = await req.json().catch((err) => {
      console.error("❌ Invalid JSON body:", err);
      return null;
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    let { id, subject, snippet } = body as {
      id?: string;
      subject?: string;
      snippet?: string;
    };

    // Normalize input
    id = id?.trim();
    subject = subject?.trim();
    snippet = snippet?.trim();

    if (!id || !subject) {
      return NextResponse.json(
        { error: "Missing id or subject" },
        { status: 400 }
      );
    }

    // ✅ UUID validation (this would have caught your bug earlier)
    if (!isValidUUID(id)) {
      console.error("❌ Invalid UUID received:", id);
      return NextResponse.json(
        { error: "Invalid UUID format", id },
        { status: 400 }
      );
    }

    const prompt = `
Return ONLY valid JSON. No markdown. No commentary.

{
  "intent": "short label",
  "urgent": true or false,
  "suggested_action": "short action"
}

Email:
Subject: ${subject}
Snippet: ${snippet}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "";
    console.log("🧠 RAW AI OUTPUT:", raw);

    const parsed = safeJsonParse(raw);

    if (!parsed) {
      console.error("❌ AI returned invalid JSON:", raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 500 }
      );
    }

    console.log("✅ Parsed AI JSON:", parsed);

    const { error } = await supabase
      .from("emails")
      .update({
        intent: parsed.intent ?? null,
        urgent: parsed.urgent ?? false,
        suggested_action: parsed.suggested_action ?? null,
      })
      .eq("id", id);

    if (error) {
      console.error("🔥 SUPABASE ERROR FULL:", error);
      return NextResponse.json(
        { error: "Supabase update failed", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result: parsed });
  } catch (err) {
    console.error("💥 Analyze fatal error:", err);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
     