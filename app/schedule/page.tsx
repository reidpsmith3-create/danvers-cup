import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCompetitionScoringRule } from "@/lib/scoring/competitionScoring";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SchedulePage() {
  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, courses(name, city, state)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, round_id, name, format, scoring_basis, counts_for_team_points, counts_for_individual_points")
    .eq("season_id", season?.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });

  const competitionsByRoundId = ((competitions as any[]) ?? []).reduce(
    (acc, competition) => {
      if (!acc[competition.round_id]) {
        acc[competition.round_id] = [];
      }

      acc[competition.round_id].push(competition);

      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            2026
          </p>

          <h1 className="mt-4 text-5xl font-black">Schedule</h1>

          <p className="mt-3 max-w-2xl text-danvers-muted">
            Three rounds across Myrtle Beach. One cup on the line.
          </p>
        </div>

        <section className="mt-8 grid gap-4">
          {rounds?.map((round) => {
            const roundCompetitions = competitionsByRoundId[round.id] ?? [];

            return (
              <article
                key={round.id}
                className="overflow-hidden rounded-3xl border border-danvers-border bg-danvers-surface"
              >
                <div className="h-1 bg-danvers-green" />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                          Round {round.round_number}
                        </p>

                        <span className="rounded-full border border-danvers-border px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-danvers-muted">
                          {round.status}
                        </span>
                      </div>

                      <h2 className="mt-2 text-2xl font-black">
                        {round.name}
                      </h2>

                      <p className="mt-3 text-danvers-muted">
                        {round.courses?.name}
                      </p>

                      <p className="text-sm text-danvers-muted">
                        {round.courses?.city}, {round.courses?.state}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">{round.round_date}</p>

                      <p className="mt-1 text-lg font-black text-danvers-text">
                        {round.tee_time}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-danvers-border bg-black/20 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-muted">
                      Competitions
                    </p>

                    <div className="mt-3 grid gap-3">
                      {roundCompetitions.length ? (
                        roundCompetitions.map((competition: any) => {
                          const scoringRule = getCompetitionScoringRule(
                            competition.format
                          );

                          return (
                            <Link
                              key={competition.id}
                              href={`/competitions/${competition.id}`}
                              className="rounded-2xl border border-danvers-border bg-black/20 p-4 transition hover:border-danvers-green"
                            >
                              <p className="font-black">{competition.name}</p>

                              <p className="mt-1 text-sm text-danvers-muted">
                                {scoringRule.label} ·{" "}
                                {competition.scoring_basis}
                              </p>

                              <p className="mt-1 text-xs text-danvers-muted">
                                Team points:{" "}
                                {competition.counts_for_team_points
                                  ? "Yes"
                                  : "No"}{" "}
                                · Individual points:{" "}
                                {competition.counts_for_individual_points
                                  ? "Yes"
                                  : "No"}
                              </p>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="text-sm text-danvers-muted">
                          No competitions attached to this round yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}