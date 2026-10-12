import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateScreenshotFiles } from "@/lib/validateScreenshots";
import { runExtraction } from "@/lib/extraction/core";
import { callGeminiVision } from "@/lib/extraction/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File);

  const errors = validateScreenshotFiles(files);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const result = await runExtraction({
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    forceSimulated: process.env.USE_SIMULATED_AI === "true",
    callGemini: () => callGeminiVision(files),
  });

  return NextResponse.json(result);
}
