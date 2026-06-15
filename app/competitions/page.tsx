import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCompetitionScoringRule } from "@/lib/scoring/competitionScoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompetitionsPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*, rounds(round_number, name)")
    .eq("season_id", season?.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Danvers Cup
          </p>

          <h1 className="mt-4 text-5xl font-black">Competitions</h1>

          <p className="mt-3 text-danvers-muted">
            Events, matches, and scoring formats for the 2026 Danvers Cup.
          </p>
        </div>

        <section className="mt-8 grid gap-4">
          {competitions?.length ? (
            competitions.map((competition: any) => {
              const scoringRule = getCompetitionScoringRule(competition.format);

              return (
                <Link
                  key={competition.id}
                  href={`/competitions/${competition.id}`}
                  className="rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                    Round {competition.rounds?.round_number ?? "—"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {competition.name}
                  </h2>

                  <p className="mt-2 text-sm text-danvers-muted">
                    {scoringRule.label} · {competition.scoring_basis}
                  </p>

                  <p className="mt-2 text-xs text-danvers-muted">
                    Team points:{" "}
                    {competition.counts_for_team_points ? "Yes" : "No"} ·
                    Individual points:{" "}
                    {competition.counts_for_individual_points ? "Yes" : "No"}
                  </p>
                </Link>
              );
            })
          ) : (
            <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
              <h2 className="text-2xl font-black">No competitions yet</h2>
              <p className="mt-2 text-danvers-muted">
                Competitions will appear here once they are created.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}