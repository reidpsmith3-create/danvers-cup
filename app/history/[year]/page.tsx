import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HistorySeasonPageProps = {
  params: {
    year: string;
  };
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function HistorySeasonPage({
  params,
}: HistorySeasonPageProps) {
  const year = Number(params.year);

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", year)
    .single();

  if (!season) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Season not found</h1>
          <Link href="/history" className="mt-4 block text-danvers-muted">
            Back to history
          </Link>
        </section>
      </main>
    );
  }

  const { data: seasonResult } = await supabase
    .from("season_results")
    .select("*, teams(name), players(full_name)")
    .eq("season_id", season.id)
    .maybeSingle();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("season_id", season.id)
    .order("created_at", { ascending: true });

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: results } =
    competitionIds.length > 0
      ? await supabase
          .from("competition_results")
          .select(
            "id, competition_id, team_id, player_id, points, result_label, teams(name), players(full_name)"
          )
          .in("competition_id", competitionIds)
          .eq("is_official", true)
      : { data: [] };

  const resultRows = (results as any[]) ?? [];

  const teamChampion =
    season.team_champion_name ??
    getSingleRelation(seasonResult?.teams)?.name ??
    "Pending";

  const individualChampion =
    season.individual_champion_name ??
    getSingleRelation(seasonResult?.players)?.full_name ??
    "Pending";

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/history"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to History
        </Link>

        <section className="mt-5 relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
              Season Archive
            </p>

            <h1 className="mt-4 text-6xl font-extrabold leading-none tracking-tight">
              {season.year}
            </h1>

            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
              {season.location ?? "Location TBD"}
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {competitions?.length ?? 0}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Events
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {resultRows.length}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Results
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {season.status}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Status
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-green/20 to-black/50 p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Team Champion
            </p>

            <h2 className="mt-3 text-3xl font-black">{teamChampion}</h2>

            <p className="mt-2 text-sm text-danvers-muted">
              {seasonResult?.team_champion_points ?? "—"} points
            </p>
          </div>

          <div className="rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-green/20 to-black/50 p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Individual Champion
            </p>

            <h2 className="mt-3 text-3xl font-black">{individualChampion}</h2>

            <p className="mt-2 text-sm text-danvers-muted">
              {seasonResult?.individual_champion_points ?? "—"} points
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6 shadow-xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Competition Results
          </p>

          <h2 className="mt-2 text-3xl font-black">Official Results</h2>

          <div className="mt-6 grid gap-4">
            {competitions?.length ? (
              competitions.map((competition) => {
                const competitionResults = resultRows.filter(
                  (result) => result.competition_id === competition.id
                );

                return (
                  <div
                    key={competition.id}
                    className="rounded-3xl border border-white/10 bg-black/25 p-5"
                  >
                    <h3 className="text-xl font-black">{competition.name}</h3>

                    <div className="mt-4 grid gap-2">
                      {competitionResults.length ? (
                        competitionResults.slice(0, 6).map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-danvers-muted">
                              {getSingleRelation(result.teams)?.name ??
                                getSingleRelation(result.players)?.full_name ??
                                "Result"}
                            </p>

                            <p className="text-sm font-black text-white">
                              {result.points} pts
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-danvers-muted">
                          No official results.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-danvers-muted">
                No competitions found for this season.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}