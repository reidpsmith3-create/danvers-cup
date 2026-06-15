import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StandingsPageProps = {
  searchParams?: {
    tab?: string;
  };
};

export default async function StandingsPage({
  searchParams,
}: StandingsPageProps) {
  const activeTab = searchParams?.tab === "individual" ? "individual" : "team";

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("season_id", season?.id);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: results } =
    competitionIds.length > 0
      ? await supabase
          .from("competition_results")
          .select(
            "id, competition_id, team_id, player_id, points, result_label, is_official"
          )
          .in("competition_id", competitionIds)
          .eq("is_official", true)
      : { data: [] };

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, color")
    .eq("season_id", season?.id);

  const { data: players } = await supabase
    .from("players")
    .select("id, full_name");

  const officialResults = (results as any[]) ?? [];

  const competitionById = new Map(
    ((competitions as any[]) ?? []).map((competition) => [
      competition.id,
      competition,
    ])
  );

  const teamById = new Map(
    ((teams as any[]) ?? []).map((team) => [team.id, team])
  );

  const playerById = new Map(
    ((players as any[]) ?? []).map((player) => [player.id, player])
  );

  const teamStandings = Object.values(
    officialResults
      .filter((result) => result.team_id)
      .reduce((acc: any, result) => {
        const teamId = result.team_id;

        if (!acc[teamId]) {
          acc[teamId] = {
            teamId,
            name: teamById.get(teamId)?.name ?? "Unknown Team",
            points: 0,
            results: 0,
            recentResults: [],
          };
        }

        acc[teamId].points += Number(result.points ?? 0);
        acc[teamId].results += 1;
        acc[teamId].recentResults.push(result);

        return acc;
      }, {})
  ).sort((a: any, b: any) => b.points - a.points);

  const individualStandings = Object.values(
    officialResults
      .filter((result) => result.player_id)
      .reduce((acc: any, result) => {
        const playerId = result.player_id;

        if (!acc[playerId]) {
          acc[playerId] = {
            playerId,
            name: playerById.get(playerId)?.full_name ?? "Unknown Player",
            points: 0,
            results: 0,
            recentResults: [],
          };
        }

        acc[playerId].points += Number(result.points ?? 0);
        acc[playerId].results += 1;
        acc[playerId].recentResults.push(result);

        return acc;
      }, {})
  ).sort((a: any, b: any) => b.points - a.points);

const leader = (activeTab === "team"
  ? teamStandings[0]
  : individualStandings[0]) as any;

const standingsRows = (activeTab === "team"
  ? teamStandings
  : individualStandings) as any[];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Official Standings
          </p>

          <h1 className="mt-4 text-5xl font-black">Standings</h1>

          <p className="mt-3 max-w-2xl text-danvers-muted">
            Official Danvers Cup standings are based on finalized competition
            results.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Current Leader
              </p>
              <p className="mt-2 text-2xl font-black">
                {leader?.name ?? "Pending"}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Leader Points
              </p>
              <p className="mt-2 text-2xl font-black">
                {leader?.points ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Results Posted
              </p>
              <p className="mt-2 text-2xl font-black">
                {officialResults.length}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-1">
            <div className="grid grid-cols-2 gap-1">
              <Link
                href="/standings"
                className={`rounded-xl px-4 py-3 text-center text-sm font-bold ${
                  activeTab === "team"
                    ? "bg-danvers-green text-white shadow-lg shadow-danvers-green/20"
                    : "text-danvers-muted hover:bg-white/5 hover:text-danvers-text"
                }`}
              >
                Team
              </Link>

              <Link
                href="/standings?tab=individual"
                className={`rounded-xl px-4 py-3 text-center text-sm font-bold ${
                  activeTab === "individual"
                    ? "bg-danvers-green text-white shadow-lg shadow-danvers-green/20"
                    : "text-danvers-muted hover:bg-white/5 hover:text-danvers-text"
                }`}
              >
                Individual
              </Link>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4">
          {standingsRows.length > 0 ? (
            standingsRows.map((row: any, index) => {
              const href =
                activeTab === "team"
                  ? `/teams/${row.teamId}`
                  : `/players/${row.playerId}`;

              return (
                <Link
                  key={activeTab === "team" ? row.teamId : row.playerId}
                  href={href}
                  className="rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-danvers-border bg-danvers-green/20 text-xl font-black">
                        {index + 1}
                      </div>

                      <div>
                        <h2 className="text-2xl font-black">{row.name}</h2>
                        <p className="mt-1 text-sm text-danvers-muted">
                          {row.results} official result(s)
                        </p>

                        <div className="mt-3 grid gap-1">
  {row.recentResults
    .slice(0, 3)
    .map((result: any) => (
      <span
        key={result.id}
        className="text-xs text-danvers-muted"
      >
        {competitionById.get(result.competition_id)
          ?.name ?? "Competition"}
        : +{result.points}
      </span>
    ))}
</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black">{row.points}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                        points
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
              <h2 className="text-2xl font-black">No official results yet</h2>
              <p className="mt-2 text-danvers-muted">
                Standings will appear once competitions are finalized.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}