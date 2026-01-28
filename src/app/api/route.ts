import { NextResponse } from "next/server";

type ApiError = {
  type: "config" | "invalid_request" | "quota" | "auth" | "network" | "upstream";
  message: string;
  code?: string;
  retryable: boolean;
};

function jsonError(error: ApiError, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY in server environment.");
      return jsonError(
        {
          type: "config",
          message: "OPENAI_API_KEY is not configured on the server.",
          retryable: false
        },
        500
      );
    }

    const { message } = await req.json();
    if (typeof message !== "string" || message.trim().length === 0) {
      return jsonError(
        {
          type: "invalid_request",
          message: "Invalid request: message must be a non-empty string.",
          retryable: false
        },
        400
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: message
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errPayload: { error?: { message?: string; type?: string; code?: string } } =
        {};
      try {
        errPayload = JSON.parse(errText);
      } catch {
        // keep raw text
      }
      const errInfo = errPayload.error || {};
      const isQuota = response.status === 429 || errInfo.code === "insufficient_quota";
      const isAuth = response.status === 401 || errInfo.code === "invalid_api_key";
      const error: ApiError = {
        type: isQuota ? "quota" : isAuth ? "auth" : "upstream",
        code: errInfo.code,
        message:
          errInfo.message ||
          `OpenAI request failed with status ${response.status}.`,
        retryable: !isAuth
      };
      console.error("OpenAI error:", response.status, error.message);
      return jsonError(error, response.status === 429 ? 429 : 502);
    }

    const data = await response.json();

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "No response";

    return NextResponse.json({ ok: true, reply: text });
  } catch (err) {
    console.error("API crash:", err);
    return jsonError(
      {
        type: "network",
        message: "Failed to reach OpenAI.",
        retryable: true
      },
      502
    );
  }
}