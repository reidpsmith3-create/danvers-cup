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

function formatDate(date: string | null) {
  if (!date) return null;

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, round_number, name, round_date, status, courses(name, city, state)")
    .eq("season_id", season.id)
    .order("round_date", { ascending: true })
    .order("round_number", { ascending: true });

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, round_id")
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

  const teamStandingsMap = new Map<string, number>();

  resultRows
    .filter((result) => result.team_id)
    .forEach((result) => {
      const name = getSingleRelation(result.teams)?.name ?? "Unknown Team";
      const current = teamStandingsMap.get(name) ?? 0;

      teamStandingsMap.set(name, current + Number(result.points ?? 0));
    });

  const teamStandings: [string, number][] = Array.from(
    teamStandingsMap.entries()
  ).sort((a, b) => b[1] - a[1]);

  const individualStandingsMap = new Map<string, number>();

  resultRows
    .filter((result) => result.player_id)
    .forEach((result) => {
      const name =
        getSingleRelation(result.players)?.full_name ?? "Unknown Player";
      const current = individualStandingsMap.get(name) ?? 0;

      individualStandingsMap.set(name, current + Number(result.points ?? 0));
    });

  const individualStandings: [string, number][] = Array.from(
    individualStandingsMap.entries()
  ).sort((a, b) => b[1] - a[1]);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/history"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to History
        </Link>

        <section className="mt-5 rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
            Season Archive
          </p>

          <h1 className="mt-4 text-6xl font-black">{season.year}</h1>

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
            {season.location ?? "Location TBD"}
          </p>

          <p className="mt-3 text-sm text-danvers-muted">
            {formatDate(season.start_date)} — {formatDate(season.end_date)}
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-danvers-green/30 bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Team Champion
            </p>
            <h2 className="mt-3 text-3xl font-black">{teamChampion}</h2>
            <p className="mt-2 text-sm text-danvers-muted">
              {seasonResult?.team_champion_points ?? "—"} points
            </p>
          </div>

          <div className="rounded-[2rem] border border-danvers-green/30 bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Individual Champion
            </p>
            <h2 className="mt-3 text-3xl font-black">{individualChampion}</h2>
            <p className="mt-2 text-sm text-danvers-muted">
              {seasonResult?.individual_champion_points ?? "—"} points
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
          <h2 className="text-3xl font-black">Courses Played</h2>

          <div className="mt-5 grid gap-3">
            {rounds?.length ? (
              rounds.map((round: any) => (
                <div
                  key={round.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-gold">
                    {round.status === "exhibition"
                      ? "Exhibition"
                      : `Round ${round.round_number}`}
                  </p>

                  <h3 className="mt-2 text-xl font-black">{round.name}</h3>

                  <p className="mt-1 text-sm text-danvers-muted">
                    {getSingleRelation(round.courses)?.name ?? "Course TBD"}
                  </p>

                  <p className="mt-1 text-xs text-danvers-muted">
                    {formatDate(round.round_date)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-danvers-muted">No rounds found.</p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <h2 className="text-3xl font-black">Team Standings</h2>

            <div className="mt-5 grid gap-3">
              {teamStandings.length ? (
                teamStandings.map(([name, points], index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <p className="font-black">
                      {index + 1}. {name}
                    </p>
                    <p className="font-black text-danvers-gold">
                      {points} pts
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-danvers-muted">No team standings found.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <h2 className="text-3xl font-black">Individual Standings</h2>

            <div className="mt-5 grid gap-3">
              {individualStandings.length ? (
                individualStandings.map(([name, points], index) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <p className="font-black">
                      {index + 1}. {name}
                    </p>
                    <p className="font-black text-danvers-gold">
                      {points} pts
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-danvers-muted">
                  No individual standings found.
                </p>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}