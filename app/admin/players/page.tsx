import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SeasonPlayerRow = {
  id: string;
  player_id: string;
  handicap: number | null;
  players:
    | {
        id: string;
        full_name: string;
        photo_url: string | null;
        bio: string | null;
        is_active: boolean | null;
      }
    | {
        id: string;
        full_name: string;
        photo_url: string | null;
        bio: string | null;
        is_active: boolean | null;
      }[]
    | null;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AdminPlayersPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select(
      "id, player_id, handicap, players(id, full_name, photo_url, bio, is_active)"
    )
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const players = ((seasonPlayers as SeasonPlayerRow[] | null) ?? [])
    .map((row) => {
      const player = getSingleRelation(row.players);
      if (!player) return null;

      return {
        seasonPlayerId: row.id,
        handicap: row.handicap,
        player,
      };
    })
    .filter(Boolean);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Admin
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6 shadow-xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Players</h1>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Manage player profile content for the 2026 Danvers Cup field.
          </p>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {players.map((entry) => {
            if (!entry) return null;

            return (
              <Link
                key={entry.seasonPlayerId}
                href={`/admin/players/${entry.player.id}`}
                className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5 transition hover:border-danvers-gold"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-danvers-gold/30 bg-danvers-green/20">
                    {entry.player.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.player.photo_url}
                        alt={entry.player.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      {entry.player.full_name}
                    </h2>

                    <p className="mt-1 text-sm text-danvers-muted">
                      Handicap: {entry.handicap ?? "TBD"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-sm leading-6 text-danvers-muted">
                  {entry.player.bio ?? "No bio yet."}
                </p>
              </Link>
            );
          })}
        </section>
      </section>
    </main>
  );
}