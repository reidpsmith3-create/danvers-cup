import { supabase } from "@/lib/supabase";

type PlayerRow = {
  id: string;
  handicap: number | null;
  players: {
    id: string;
    full_name: string;
    photo_url: string | null;
    bio: string | null;
  } | null;
};

type TeamMemberRow = {
  player_id: string;
  teams: {
    name: string;
    color: string | null;
  } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function PlayersPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("id, player_id, handicap, players(id, full_name, photo_url, bio)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("player_id, teams(name, color)")
    .in(
      "player_id",
      seasonPlayers?.map((row) => row.player_id) ?? []
    );

  const teamByPlayerId = new Map<string, TeamMemberRow["teams"]>();

  (teamMembers as TeamMemberRow[] | null)?.forEach((member) => {
    teamByPlayerId.set(member.player_id, member.teams);
  });

  const players = (seasonPlayers as PlayerRow[] | null) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-gold">
            Field
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            2026 Players
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-danvers-muted sm:text-base">
            The eight-man field for the Danvers Cup at Myrtle Beach. Player
            profiles will eventually include career records, championships,
            match history, photos, and scoring trends.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Players
              </p>
              <p className="mt-2 text-2xl font-black text-danvers-gold">
                {players.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Teams
              </p>
              <p className="mt-2 text-2xl font-black text-white">2</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Location
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                Myrtle Beach
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {players.map((seasonPlayer) => {
            const player = seasonPlayer.players;
            if (!player) return null;

            const team = teamByPlayerId.get(player.id);

            return (
              <a
  href={`/players/${player.id}`}
                key={seasonPlayer.id}
                className="overflow-hidden rounded-3xl border border-danvers-green/30 bg-gradient-to-br from-danvers-surface to-black/50 shadow-xl shadow-black/20"
              >
                <div className="h-1 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-danvers-gold/30 bg-danvers-green/20 text-xl font-black text-danvers-gold">
                      {player.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photo_url}
                          alt={player.full_name}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        getInitials(player.full_name)
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-black leading-tight">
                        {player.full_name}
                      </h2>

                      <p className="mt-1 text-sm text-danvers-muted">
                        {team?.name ?? "Team TBD"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                        Handicap
                      </p>
                      <p className="mt-2 text-xl font-black text-danvers-gold">
                        {seasonPlayer.handicap ?? "TBD"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                        Status
                      </p>
                      <p className="mt-2 text-xl font-black text-white">
                        Active
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 min-h-12 text-sm leading-6 text-danvers-muted">
                    {player.bio ??
                      "Player profile, Danvers Cup history, and career stats coming soon."}
                  </p>
                </div>
              </a>
            );
          })}
        </section>
      </section>
    </main>
  );
}