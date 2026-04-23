import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://127.0.0.1:8000";

function safeJson(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      body: formData
    });
    const text = await response.text();
    const data = safeJson(text);
    if (
      response.ok &&
      data &&
      typeof data === "object" &&
      "audio_url" in data &&
      typeof (data as { audio_url?: unknown }).audio_url === "string"
    ) {
      const audioUrl = (data as { audio_url: string }).audio_url;
      if (audioUrl.startsWith("/")) {
        (data as { audio_url: string }).audio_url = `${API_BASE_URL}${audioUrl}`;
      }
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
