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
    .map((part) => part[0])
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
          <Link href="/standings" className="mt-4 block text-danvers-muted">
            Back to standings
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link href="/standings" className="text-sm font-bold text-danvers-muted">
          ← Back to Standings
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-border bg-danvers-surface">
          <div className="h-2 bg-danvers-green" />

          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
              Danvers Cup Team
            </p>

            <h1 className="mt-3 text-5xl font-black">{team.name}</h1>

            <p className="mt-3 text-danvers-muted">
              2026 Myrtle Beach roster and team profile.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Players
                </p>
                <p className="mt-2 text-2xl font-black">
                  {players?.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Team Points
                </p>
                <p className="mt-2 text-2xl font-black">0</p>
              </div>

              <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Status
                </p>
                <p className="mt-2 text-2xl font-black">Active</p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {players?.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-danvers-border bg-danvers-green/20 text-xl font-black">
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
                  <h2 className="text-xl font-black">{player.full_name}</h2>
                  <p className="mt-1 text-sm text-danvers-muted">
                    Handicap: {handicapByPlayerId.get(player.id) ?? "TBD"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}