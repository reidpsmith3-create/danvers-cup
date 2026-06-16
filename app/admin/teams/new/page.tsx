import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CreateTeamForm from "@/components/admin/CreateTeamForm";

export default async function NewTeamPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["upcoming", "active"])
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/teams"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Teams
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">New Team</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Create a season-specific team for {season?.year ?? "the current season"}.
          </p>
        </div>

<CreateTeamForm seasonId={season?.id ?? ""} />
      </section>
    </main>
  );
}