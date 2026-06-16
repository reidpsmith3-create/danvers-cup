import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PlayerPageProps = {
  params: {
    id: string;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function get2024Record(name: string) {
  const records: Record<string, string> = {
    "Neil Birky": "3-0-1",
    "Taylor Marvin": "3-1-0",
    "Ryan Smith": "2-1-1",
    "Reid Smith": "2-2-0",
    "Jeff Freitag": "2-0-0",
    "Dusty Hayes": "1-3-0",
    "Mike Rodriguez": "1-3-0",
    "Scottie The Doctor": "1-1-0",
    "Mitch Birky": "0-4-0",
  };

  return records[name] ?? "—";
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!player) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black">Player not found</h1>
          <Link href="/players" className="mt-4 block text-danvers-muted">
            Back to players
          </Link>
        </section>
      </main>
    );
  }

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("handicap, seasons(id, year, name, location, status)")
    .eq("player_id", params.id);

  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("teams(id, name, color, season_id)")
    .eq("player_id", params.id);

  const { data: competitionResults } = await supabase
    .from("competition_results")
    .select("points, result_label, competitions(season_id, name), teams(name)")
    .eq("player_id", params.id)
    .eq("is_official", true);

  const { data: seasonResults } = await supabase
    .from("season_results")
    .select(
      "season_id, individual_champion_player_id, team_champion_id, seasons(year)"
    );

  const seasonRows =
    seasonPlayers?.map((row: any) => ({
      handicap: row.handicap,
      season: getSingleRelation(row.seasons),
    })) ?? [];

  const memberships =
    teamMemberships?.map((membership: any) =>
      getSingleRelation(membership.teams)
    ) ?? [];

  const results = (competitionResults as any[]) ?? [];

  const careerPoints = results.reduce(
    (total, result) => total + Number(result.points ?? 0),
    0
  );

  const seasonsPlayed = seasonRows.filter((row) => row.season).length;

  const individualTitles =
    seasonResults?.filter(
      (result: any) => result.individual_champion_player_id === player.id
    ).length ?? 0;

  const teamTitleSeasonIds = new Set(
    ((seasonResults as any[]) ?? [])
      .filter((result) =>
        memberships.some(
          (membership: any) =>
            membership?.season_id === result.season_id &&
            membership?.id === result.team_champion_id
        )
      )
      .map((result) => result.season_id)
  );

  const latestMembership =
    memberships
      .filter(Boolean)
      .sort((a: any, b: any) => String(b.season_id).localeCompare(String(a.season_id)))[0] ??
    null;

  const teamColor = latestMembership?.color || "#1f7a4d";

  const seasonHistory = seasonRows
    .filter((row) => row.season)
    .map((row) => {
      const season = row.season;
      const membership = memberships.find(
        (item: any) => item?.season_id === season.id
      );

      const seasonPoints = results
        .filter((result) => {
          const competition = getSingleRelation(result.competitions);
          return competition?.season_id === season.id;
        })
        .reduce((total, result) => total + Number(result.points ?? 0), 0);

      const wonIndividual =
        seasonResults?.some(
          (result: any) =>
            result.season_id === season.id &&
            result.individual_champion_player_id === player.id
        ) ?? false;

      const wonTeam =
        seasonResults?.some(
          (result: any) =>
            result.season_id === season.id &&
            result.team_champion_id === membership?.id
        ) ?? false;

      return {
        season,
        handicap: row.handicap,
        team: membership,
        points: seasonPoints,
        wonIndividual,
        wonTeam,
      };
    })
    .sort((a: any, b: any) => b.season.year - a.season.year);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-4xl">
        <Link
          href="/players"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to Field
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black shadow-2xl shadow-black/50">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
            }}
          />

          <div className="relative p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border text-4xl font-black text-danvers-gold shadow-xl shadow-black/30"
                style={{
                  borderColor: teamColor,
                  backgroundColor: `${teamColor}33`,
                }}
              >
                {player.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(player.full_name)
                )}
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
                  Player Profile
                </p>

                <h1 className="mt-3 text-5xl font-extrabold leading-none tracking-tight">
                  {player.full_name}
                </h1>

                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                  {latestMembership?.name ?? "Team TBD"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  Appearances
                </p>
                <p className="mt-2 text-2xl font-black text-danvers-gold">
                  {seasonsPlayed}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  Team Titles
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {teamTitleSeasonIds.size}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  Career Points
                </p>
                <p className="mt-2 text-2xl font-black text-white">
                  {careerPoints}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6 shadow-xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Bio
          </p>

          <p className="mt-4 leading-7 text-danvers-muted">
            {player.bio ??
              "Career history, player notes, photos, and Danvers Cup records coming soon."}
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-danvers-green/20 to-black/40 p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Cup Résumé
            </p>

            <div className="mt-5 space-y-3">
              {[
                ["Appearances", String(seasonsPlayed)],
                ["Team Titles", String(teamTitleSeasonIds.size)],
                ["Individual Titles", String(individualTitles)],
                ["Career Points", String(careerPoints)],
                ["2024 Record", get2024Record(player.full_name)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-danvers-muted">
                    {label}
                  </p>
                  <p className="text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-danvers-surface to-black/50 p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Season History
            </p>

            <div className="mt-5 grid gap-3">
              {seasonHistory.length ? (
                seasonHistory.map((entry: any) => (
                  <Link
                    key={entry.season.id}
                    href={`/history/${entry.season.year}`}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-danvers-gold"
                  >
                    <p className="text-xl font-black">
                      {entry.season.year}
                    </p>
                    <p className="mt-1 text-sm text-danvers-muted">
                      {entry.team?.name ?? "Team TBD"} · {entry.points} pts
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-danvers-gold">
                      {entry.wonIndividual
                        ? "Individual Champion"
                        : entry.wonTeam
                          ? "Team Champion"
                          : "Participant"}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-danvers-muted">
                  No season history yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}