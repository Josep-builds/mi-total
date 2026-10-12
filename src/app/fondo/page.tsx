import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FunderView, type TokenAggregates } from "@/components/FunderView";

export default async function FondoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data, error } = await supabase.rpc("token_aggregates");
  const aggregates: TokenAggregates | null =
    !error && data && data.length > 0 ? data[0] : null;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-zinc-50 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">Vista del evaluador</h1>
      <FunderView aggregates={aggregates} />
    </main>
  );
}
