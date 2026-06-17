import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

type PlayersPageProps = {
  searchParams?: {
    tab?: string;
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

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const activeTab = searchParams?.tab === "all" ? "all" : "current";
  const season = await getCurrentSeason();

  const { data: allPlayersData } = await supabase
    .from("players")
    .select("id, full_name, photo_url, bio, is_active")
    .order("full_name", { ascending: true });

  const { data: allSeasonPlayersData } = await supabase
    .from("season_players")
    .select("player_id, handicap, seasons(id, year)");

  const { data: currentSeasonPlayersData } = await supabase
    .from("season_players")
    .select("player_id, handicap")
    .eq("season_id", season?.id);

  const currentPlayerIds = new Set(
    ((currentSeasonPlayersData as any[]) ?? []).map((row) => row.player_id)
  );

  const handicapByPlayerId = new Map(
    ((currentSeasonPlayersData as any[]) ?? []).map((row) => [
      row.player_id,
      row.handicap,
    ])
  );

  const appearancesByPlayerId = new Map<string, number>();

  ((allSeasonPlayersData as any[]) ?? []).forEach((row) => {
    appearancesByPlayerId.set(
      row.player_id,
      (appearancesByPlayerId.get(row.player_id) ?? 0) + 1
    );
  });

  const { data: competitionResultsData } = await supabase
    .from("competition_results")
    .select("player_id, points")
    .eq("is_official", true);

  const pointsByPlayerId = new Map<string, number>();

  ((competitionResultsData as any[]) ?? []).forEach((result) => {
    if (!result.player_id) return;

    pointsByPlayerId.set(
      result.player_id,
      (pointsByPlayerId.get(result.player_id) ?? 0) + Number(result.points ?? 0)
    );
  });

  const allPlayers = ((allPlayersData as any[]) ?? []).map((player) => ({
    ...player,
    isCurrent: currentPlayerIds.has(player.id),
    handicap: handicapByPlayerId.get(player.id) ?? null,
    appearances: appearancesByPlayerId.get(player.id) ?? 0,
    points: pointsByPlayerId.get(player.id) ?? 0,
  }));

  const players =
    activeTab === "current"
      ? allPlayers.filter((player) => player.isCurrent)
      : [...allPlayers].sort((a, b) => {
          if (a.isCurrent && !b.isCurrent) return -1;
          if (!a.isCurrent && b.isCurrent) return 1;
          return a.full_name.localeCompare(b.full_name);
        });

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
          <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
              The Field
            </p>

            <h1 className="mt-4 text-5xl font-extrabold leading-none tracking-tight">
              Players
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
              Current Danvers Cup field and all-time player directory.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {currentPlayerIds.size}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Current
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {allPlayers.length}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  All-Time
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">
                  {season?.year ?? "—"}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Season
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          <Link
            href="/players"
            className={`rounded-xl px-4 py-3 text-center text-sm font-black ${
              activeTab === "current"
                ? "bg-danvers-green text-white"
                : "text-danvers-muted"
            }`}
          >
            Current Season
          </Link>

          <Link
            href="/players?tab=all"
            className={`rounded-xl px-4 py-3 text-center text-sm font-black ${
              activeTab === "all"
                ? "bg-danvers-green text-white"
                : "text-danvers-muted"
            }`}
          >
            All Players
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {players.map((player) => (
            <Link
              href={`/players/${player.id}`}
              key={player.id}
              className="group overflow-hidden rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-surface to-black/50 shadow-xl shadow-black/20 transition hover:border-danvers-gold/60"
            >
              <div className="h-1 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-danvers-gold/40 bg-danvers-green/20 text-2xl font-black text-danvers-gold">
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
                      {player.isCurrent ? "Current Player" : "Alumni"}
                    </p>

                    <h2 className="mt-2 text-2xl font-black leading-tight">
                      {player.full_name}
                    </h2>

                    <p className="mt-1 text-sm font-medium text-danvers-muted">
                      {player.appearances} appearance(s)
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                      Handicap
                    </p>
                    <p className="mt-2 text-2xl font-black text-danvers-gold">
                      {player.isCurrent ? player.handicap ?? "TBD" : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                      Career Points
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">
                      {player.points}
                    </p>
                  </div>
                </div>

                <p className="mt-5 line-clamp-3 text-sm leading-6 text-danvers-muted">
                  {player.bio ??
                    "Player profile, Danvers Cup history, and career stats."}
                </p>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                  View Profile →
                </p>
              </div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}