import Link from "next/link";
import CompetitionForm from "@/components/admin/CompetitionForm";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

type EditCompetitionPageProps = {
  params: {
    id: string;
  };
};

export default async function EditCompetitionPage({
  params,
}: EditCompetitionPageProps) {
  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, round_number, name")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!season || !competition) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link
            href="/admin/competitions"
            className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
          >
            ← Competitions
          </Link>

          <h1 className="mt-6 text-4xl font-black">
            Competition not found
          </h1>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/competitions"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Competitions
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Edit Competition</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Update scoring setup for {competition.name}.
          </p>
        </div>

        <CompetitionForm
          seasonId={season.id}
          rounds={(rounds as any[]) ?? []}
          competition={competition}
        />
      </section>
    </main>
  );
}