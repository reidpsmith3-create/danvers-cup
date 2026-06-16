import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TeamPageProps = {
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

export default async function TeamPage({ params }: TeamPageProps) {
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: members } = await supabase
    .from("team_members")
    .select("player_id")
    .eq("team_id", params.id);

  const playerIds = members?.map((member) => member.player_id) ?? [];

  const { data: players } =
    playerIds.length > 0
      ? await supabase
          .from("players")
          .select("id, full_name, photo_url, bio")
          .in("id", playerIds)
      : { data: [] };

  const { data: seasonPlayers } =
    playerIds.length > 0
      ? await supabase
          .from("season_players")
          .select("player_id, handicap")
          .in("player_id", playerIds)
      : { data: [] };

  const handicapByPlayerId = new Map(
    seasonPlayers?.map((row) => [row.player_id, row.handicap]) ?? []
  );

  if (!team) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black">Team not found</h1>
          <Link href="/teams" className="mt-4 block text-danvers-muted">
            Back to teams
          </Link>
        </section>
      </main>
    );
  }

  const teamColor = team.color || "#1f7a4d";

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/teams"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to Teams
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black shadow-2xl shadow-black/50">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
            }}
          />

          <div className="relative p-6">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
            <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
                    2026 Team
                  </p>

                  <h1 className="mt-3 text-5xl font-extrabold leading-none tracking-tight">
                    {team.name}
                  </h1>

                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                    Myrtle Beach Roster
                  </p>
                </div>

                <div
                  className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border text-3xl font-black text-danvers-gold shadow-xl shadow-black/30"
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

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Players
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {players?.length ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Points
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">0</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Status
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">Active</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
                Roster
              </p>
              <h2 className="mt-2 text-3xl font-black">Team Members</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {players?.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="group rounded-[2rem] border border-white/10 bg-gradient-to-br from-danvers-surface to-black/50 p-5 shadow-xl shadow-black/20 transition hover:border-danvers-gold/60"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border text-2xl font-black text-danvers-gold"
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
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-danvers-gold">
                      Player
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      {player.full_name}
                    </h3>
                    <p className="mt-1 text-sm text-danvers-muted">
                      Handicap: {handicapByPlayerId.get(player.id) ?? "TBD"}
                    </p>
                  </div>
                </div>

                <p className="mt-5 line-clamp-2 text-sm leading-6 text-danvers-muted">
                  {player.bio ??
                    "Player profile, Danvers Cup history, and career stats coming soon."}
                </p>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                  View Profile →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}