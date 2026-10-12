import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/app");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center">
      <h1 className="max-w-md text-2xl font-semibold text-zinc-900">
        Mi Total te muestra cuánto debes en total, en un solo lugar.
      </h1>
      <GoogleSignInButton />
    </main>
  );
}
