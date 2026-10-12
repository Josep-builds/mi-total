"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="rounded-full bg-teal-700 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
    >
      {loading ? "Entrando..." : "Entrar con Google"}
    </button>
  );
}
