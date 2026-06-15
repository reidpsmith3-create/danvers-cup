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
    .select("id")
    .eq("season_id", season?.id);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: results } =
    competitionIds.length > 0
      ? await supabase
          .from("competition_results")
          .select("id, competition_id, team_id, player_id, points, result_label, is_official")
          .in("competition_id", competitionIds)
          .eq("is_official", true)
      : { data: [] };

  const officialResults = (results as any[]) ?? [];

  const { data: teams } = await supabase
  .from("teams")
  .select("id, name, color")
  .eq("season_id", season?.id);

const { data: players } = await supabase
  .from("players")
  .select("id, full_name");

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
          };
        }

        acc[teamId].points += Number(result.points ?? 0);
        acc[teamId].results += 1;

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
          };
        }

        acc[playerId].points += Number(result.points ?? 0);
        acc[playerId].results += 1;

        return acc;
      }, {})
  ).sort((a: any, b: any) => b.points - a.points);

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
            results, not in-progress hole scores.
          </p>

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

        {activeTab === "team" ? (
          <section className="mt-8 grid gap-4">
            {teamStandings.length > 0 ? (
              teamStandings.map((team: any, index) => (
                <Link
                  key={team.teamId}
                  href={`/teams/${team.teamId}`}
                  className="rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danvers-border bg-danvers-green/20 text-xl font-black">
                        {index + 1}
                      </div>

                      <div>
                        <h2 className="text-2xl font-black">{team.name}</h2>
                        <p className="mt-1 text-sm text-danvers-muted">
                          {team.results} official results
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black">{team.points}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                        points
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
                <h2 className="text-2xl font-black">No official results yet</h2>
                <p className="mt-2 text-danvers-muted">
                  Team standings will appear once competitions are finalized.
                </p>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8 grid gap-3">
            {individualStandings.length > 0 ? (
              individualStandings.map((player: any, index) => (
                <Link
                  key={player.playerId}
                  href={`/players/${player.playerId}`}
                  className="rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danvers-border bg-danvers-green/20 text-lg font-black">
                        {index + 1}
                      </div>

                      <div>
                        <h2 className="text-xl font-black">{player.name}</h2>
                        <p className="mt-1 text-sm text-danvers-muted">
                          {player.results} official results
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black">{player.points}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                        points
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
                <h2 className="text-2xl font-black">No official results yet</h2>
                <p className="mt-2 text-danvers-muted">
                  Individual standings will appear once competitions are finalized.
                </p>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}