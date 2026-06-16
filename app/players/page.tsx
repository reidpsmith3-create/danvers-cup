import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

type PlayerRow = {
  id: string;
  player_id: string;
  handicap: number | null;
  players:
    | {
        id: string;
        full_name: string;
        photo_url: string | null;
        bio: string | null;
      }
    | {
        id: string;
        full_name: string;
        photo_url: string | null;
        bio: string | null;
      }[]
    | null;
};

type TeamMemberRow = {
  player_id: string;
  teams:
    | {
        name: string;
        color: string | null;
      }
    | {
        name: string;
        color: string | null;
      }[]
    | null;
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

export default async function PlayersPage() {
  const season = await getCurrentSeason();

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("id, player_id, handicap, players(id, full_name, photo_url, bio)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const typedSeasonPlayers = (seasonPlayers as PlayerRow[] | null) ?? [];

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("player_id, teams(name, color)")
    .in(
      "player_id",
      typedSeasonPlayers.map((row) => row.player_id)
    );

  const teamByPlayerId = new Map<
    string,
    {
      name: string;
      color: string | null;
    } | null
  >();

  (teamMembers as TeamMemberRow[] | null)?.forEach((member) => {
    teamByPlayerId.set(member.player_id, getSingleRelation(member.teams));
  });

  const players = typedSeasonPlayers
    .map((seasonPlayer) => {
      const player = getSingleRelation(seasonPlayer.players);
      if (!player) return null;

      return {
        seasonPlayer,
        player,
        team: teamByPlayerId.get(player.id) ?? null,
      };
    })
    .filter(Boolean);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              The Field
            </p>

            <h1 className="mt-4 text-5xl font-extrabold leading-none tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
              2026 Players
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
              The eight-man field for the Danvers Cup at Myrtle Beach. Player
              profiles track teams, handicaps, history, and future Cup records.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {players.length}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Players
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">2</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Teams
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">3</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Rounds
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {players.map((entry) => {
            if (!entry) return null;

            const { seasonPlayer, player, team } = entry;
            const teamColor = team?.color || "#1f7a4d";

            return (
              <Link
                href={`/players/${player.id}`}
                key={seasonPlayer.id}
                className="group overflow-hidden rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-surface to-black/50 shadow-xl shadow-black/20 transition hover:border-danvers-gold/60"
              >
                <div
                  className="h-1"
                  style={{
                    background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
                  }}
                />

                <div className="p-5">
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

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-danvers-gold">
                        Player Profile
                      </p>

                      <h2 className="mt-2 text-2xl font-black leading-tight">
                        {player.full_name}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-danvers-muted">
                        {team?.name ?? "Team TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                        Handicap
                      </p>
                      <p className="mt-2 text-2xl font-black text-danvers-gold">
                        {seasonPlayer.handicap ?? "TBD"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                        Status
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        Active
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-danvers-muted">
                    {player.bio ??
                      "Player profile, Danvers Cup history, and career stats coming soon."}
                  </p>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                    View Profile →
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