import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SeasonRow = {
  id: string;
  year: number;
  name: string;
  location: string | null;
  status: string;
  team_champion_name: string | null;
  individual_champion_name: string | null;
};

type SeasonResultRow = {
  id: string;
  season_id: string;
  team_champion_points: number | null;
  individual_champion_points: number | null;
  is_final: boolean | null;
  finalized_at: string | null;
  teams:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
  players:
    | {
        full_name: string;
      }
    | {
        full_name: string;
      }[]
    | null;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function HistoryPage() {
  const { data: seasonsData } = await supabase
    .from("seasons")
    .select(
      "id, year, name, location, status, team_champion_name, individual_champion_name"
    )
    .order("year", { ascending: false });

  const seasons = (seasonsData as SeasonRow[] | null) ?? [];

  const { data: seasonResultsData } = await supabase
    .from("season_results")
    .select(
      "id, season_id, team_champion_points, individual_champion_points, is_final, finalized_at, teams(name), players(full_name)"
    )
    .order("finalized_at", { ascending: false });

  const resultBySeasonId = new Map<string, SeasonResultRow>();

  ((seasonResultsData as SeasonResultRow[] | null) ?? []).forEach((result) => {
    resultBySeasonId.set(result.season_id, result);
  });

  const completedSeasons = seasons.filter(
    (season) =>
      season.status === "complete" ||
      season.team_champion_name ||
      season.individual_champion_name ||
      resultBySeasonId.get(season.id)?.is_final
  );

  const latestChampionSeason = completedSeasons[0] ?? null;
  const latestChampionResult = latestChampionSeason
    ? resultBySeasonId.get(latestChampionSeason.id)
    : null;

  const latestTeamChampion =
    latestChampionSeason?.team_champion_name ??
    getSingleRelation(latestChampionResult?.teams)?.name ??
    "Pending";

  const latestIndividualChampion =
    latestChampionSeason?.individual_champion_name ??
    getSingleRelation(latestChampionResult?.players)?.full_name ??
    "Pending";

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
              Danvers Cup
            </p>

            <h1 className="mt-4 text-5xl font-extrabold leading-none tracking-tight">
              History
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
              Champions, season archives, records, and the growing story of the
              Danvers Cup.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {seasons.length}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Seasons
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {completedSeasons.length}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Completed
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {seasonResultsData?.length ?? 0}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Finals
                </p>
              </div>
            </div>
          </div>
        </section>

        {latestChampionSeason ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-green/20 to-black/50 p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Latest Champions
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {latestChampionSeason.year} Danvers Cup
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                  Team Champion
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  {latestTeamChampion}
                </h3>

                <p className="mt-2 text-sm text-danvers-muted">
                  {latestChampionResult?.team_champion_points ?? "—"} points
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                  Individual Champion
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  {latestIndividualChampion}
                </h3>

                <p className="mt-2 text-sm text-danvers-muted">
                  {latestChampionResult?.individual_champion_points ?? "—"}{" "}
                  points
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Archive
            </p>
            <h2 className="mt-2 text-3xl font-black">Seasons</h2>
          </div>

          <div className="grid gap-4">
            {seasons.length ? (
              seasons.map((season) => {
                const result = resultBySeasonId.get(season.id);
                const teamChampion =
                  season.team_champion_name ??
                  getSingleRelation(result?.teams)?.name ??
                  null;
                const individualChampion =
                  season.individual_champion_name ??
                  getSingleRelation(result?.players)?.full_name ??
                  null;

                return (
                  <Link
                    key={season.id}
                    href={`/history/${season.year}`}
                    className="block overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-danvers-surface to-black/50 shadow-xl shadow-black/20 transition hover:border-danvers-gold/60"
                  >
                    <div className="h-1 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-gold">
                            Season
                          </p>

                          <h3 className="mt-2 text-4xl font-black">
                            {season.year}
                          </h3>

                          <p className="mt-1 text-sm text-danvers-muted">
                            {season.location ?? "Location TBD"}
                          </p>
                        </div>

                        <div className="rounded-full border border-white/10 bg-black/30 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-muted">
                            {result?.is_final || season.status === "complete"
                              ? "Final"
                              : season.status}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                            Team Champion
                          </p>
                          <p className="mt-2 text-lg font-black text-white">
                            {teamChampion ?? "Pending"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                            Individual Champion
                          </p>
                          <p className="mt-2 text-lg font-black text-white">
                            {individualChampion ?? "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
                <h3 className="text-2xl font-black">No seasons found</h3>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6 shadow-xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Records
          </p>

          <h2 className="mt-3 text-3xl font-black">Record Book Coming Soon</h2>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Most points, most appearances, most team titles, individual titles,
            match records, and course records will live here as the archive
            grows.
          </p>
        </section>
      </section>
    </main>
  );
}