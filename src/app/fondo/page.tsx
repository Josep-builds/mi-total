import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FondoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">Vista del evaluador</h1>
      <p className="text-zinc-600">Próximamente: métricas agregadas.</p>
    </main>
  );
}
