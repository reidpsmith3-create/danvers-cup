import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TeamRow = {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
};

type TeamMemberRow = {
  team_id: string;
  player_id: string;
  players:
    | {
        id: string;
        full_name: string;
        photo_url: string | null;
      }
    | {
        id: string;
        full_name: string;
        photo_url: string | null;
      }[]
    | null;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function getMatchRecord(teamId: string, matches: any[]) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  matches.forEach((match) => {
    const isSideA = match.team_a_id === teamId;
    const isSideB = match.team_b_id === teamId;

    if (!isSideA && !isSideB) return;

    if (match.winning_side === "halved") {
      ties += 1;
      return;
    }

    if (
      (isSideA && match.winning_side === "team_a") ||
      (isSideB && match.winning_side === "team_b")
    ) {
      wins += 1;
      return;
    }

    losses += 1;
  });

  return `${wins}-${losses}-${ties}`;
}

export default async function TeamsPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["upcoming", "active"])
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name, color, logo_url")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const teams = (teamsData as TeamRow[] | null) ?? [];

  const teamIds = teams.map((team) => team.id);

  const { data: membersData } =
    teamIds.length > 0
      ? await supabase
          .from("team_members")
          .select("team_id, player_id, players(id, full_name, photo_url)")
          .in("team_id", teamIds)
      : { data: [] };

  const { data: resultsData } =
    season?.id && teamIds.length > 0
      ? await supabase
          .from("competition_results")
          .select("team_id, points, competitions(season_id, is_visible)")
          .in("team_id", teamIds)
          .eq("is_official", true)
      : { data: [] };

  const { data: matchesData } =
    season?.id && teamIds.length > 0
      ? await supabase
          .from("matches")
          .select(
            "team_a_id, team_b_id, winning_side, competitions(season_id, is_visible)"
          )
          .or(
            `team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`
          )
          .eq("is_official", true)
      : { data: [] };

  const membersByTeamId = new Map<string, TeamMemberRow[]>();

  ((membersData as TeamMemberRow[] | null) ?? []).forEach((member) => {
    const existing = membersByTeamId.get(member.team_id) ?? [];
    membersByTeamId.set(member.team_id, [...existing, member]);
  });

  const visibleSeasonResults = ((resultsData as any[]) ?? []).filter(
    (result) => {
      const competition = getSingleRelation(result.competitions);
      return (
        competition?.season_id === season?.id &&
        competition?.is_visible !== false
      );
    }
  );

  const visibleSeasonMatches = ((matchesData as any[]) ?? []).filter(
    (match) => {
      const competition = getSingleRelation(match.competitions);
      return (
        competition?.season_id === season?.id &&
        competition?.is_visible !== false
      );
    }
  );
const { data: seasonPlayersData } = await supabase
  .from("season_players")
  .select("player_id, handicap")
  .eq("season_id", season?.id);

  const handicapByPlayerId = new Map(
  ((seasonPlayersData as any[]) ?? []).map((row) => [
    row.player_id,
    row.handicap,
  ])
);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
              Teams
            </p>

            <h1 className="mt-4 text-5xl font-extrabold leading-none tracking-tight">
              {season?.year ?? "Current"} Teams
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
              Season-specific rosters, points, records, and team race snapshots.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2">
          {teams.map((team) => {
            const teamColor = team.color || "#1f7a4d";
            const members = membersByTeamId.get(team.id) ?? [];

            const teamPoints = visibleSeasonResults
              .filter((result) => result.team_id === team.id)
              .reduce(
                (total, result) => total + Number(result.points ?? 0),
                0
              );

            const totalHandicap = members.reduce((total, member) => {
  const handicap = handicapByPlayerId.get(member.player_id);
  return total + Number(handicap ?? 0);
}, 0);
const teamRecord = getMatchRecord(team.id, visibleSeasonMatches);

            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-danvers-surface to-black/50 shadow-xl shadow-black/20 transition hover:border-danvers-gold/60"
              >
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
                  }}
                />

                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-danvers-gold">
                        Season Team
                      </p>
                      <h2 className="mt-2 text-3xl font-black">
                        {team.name}
                      </h2>
                    </div>

                    <div
                      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border text-xl font-black text-danvers-gold"
                      style={{
                        borderColor: teamColor,
                        backgroundColor: `${teamColor}33`,
                      }}
                    >
                      {team.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        team.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-muted">
                        Players
                      </p>
                      <p className="mt-2 text-xl font-black text-danvers-gold">
                        {members.length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-muted">
    HCP
  </p>
  <p className="mt-2 text-xl font-black text-danvers-gold">
    {totalHandicap.toFixed(1)}
  </p>
</div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-muted">
                        Points
                      </p>
                      <p className="mt-2 text-xl font-black text-danvers-gold">
                        {formatPoints(teamPoints)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-muted">
                        Record
                      </p>
                      <p className="mt-2 text-xl font-black text-danvers-gold">
                        {teamRecord}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                      Roster Preview
                    </p>

                    <div className="mt-4 flex -space-x-3">
                      {members.map((member) => {
                        const player = getSingleRelation(member.players);
                        if (!player) return null;

                        return (
                          <div
                            key={player.id}
                            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-black bg-danvers-green/20 text-xs font-black text-danvers-gold"
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
                        );
                      })}
                    </div>

                    <p className="mt-4 text-sm text-danvers-muted">
                      {members
                        .map((member) => getSingleRelation(member.players))
                        .filter(Boolean)
                        .map((player: any) => player.full_name)
                        .join(", ")}
                    </p>
                  </div>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                    View Team →
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      </section>
    </main>
  );
}