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

  const { data: membersData } =
    teams.length > 0
      ? await supabase
          .from("team_members")
          .select("team_id, players(id, full_name, photo_url)")
          .in(
            "team_id",
            teams.map((team) => team.id)
          )
      : { data: [] };

  const membersByTeamId = new Map<string, TeamMemberRow[]>();

  ((membersData as TeamMemberRow[] | null) ?? []).forEach((member) => {
    const existing = membersByTeamId.get(member.team_id) ?? [];
    membersByTeamId.set(member.team_id, [...existing, member]);
  });

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
              2026 Teams
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
              The Danvers Cup teams are season-specific. Each trip gets its own
              rosters, matchups, and team champion.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 sm:grid-cols-2">
          {teams.map((team) => {
            const teamColor = team.color || "#1f7a4d";
            const members = membersByTeamId.get(team.id) ?? [];

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
                        2026 Team
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

                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                      Roster
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
                      {members.length} players
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