import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateScreenshotFiles } from "@/lib/validateScreenshots";

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

  return NextResponse.json({ ok: true, fileCount: files.length });
}
