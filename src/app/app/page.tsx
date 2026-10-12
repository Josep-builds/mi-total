import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { DebtFlow } from "@/components/DebtFlow";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const firstName =
    user.user_metadata?.given_name ??
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "ahí";

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">Hola, {firstName}</h1>
      <DebtFlow />
      <SignOutButton />
    </main>
  );
}
