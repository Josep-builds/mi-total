import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TokenRequestSchema, signTokenPayload } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const secret = process.env.TOKEN_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const json = await request.json().catch(() => null);
  const parsed = TokenRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { picture_complete, comprehension_pass, loans_count } = parsed.data;
  const issued_at = new Date().toISOString();
  const signature = signTokenPayload(secret, {
    userId: user.id,
    issuedAt: issued_at,
    pictureComplete: picture_complete,
    comprehensionPass: comprehension_pass,
    loansCount: loans_count,
  });

  const { data, error } = await supabase
    .from("tokens")
    .insert({
      user_id: user.id,
      issued_at,
      picture_complete,
      comprehension_pass,
      loans_count,
      signature,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "token_insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tokenId: data.id as string });
}
