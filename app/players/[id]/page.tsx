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
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: seasonPlayer } = await supabase
    .from("season_players")
    .select("handicap")
    .eq("player_id", params.id)
    .single();

  const { data: teamMember } = await supabase
    .from("team_members")
    .select("teams(name, color)")
    .eq("player_id", params.id)
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

  const team = Array.isArray(teamMember?.teams)
  ? teamMember?.teams[0]
  : teamMember?.teams;

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-4xl">
        <Link href="/players" className="text-sm font-bold text-danvers-muted">
          ← Back to Players
        </Link>

        <div className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-border bg-danvers-surface">
          <div className="h-2 bg-danvers-green" />

          <div className="p-6">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-danvers-border bg-danvers-green/20 text-3xl font-black">
                {player.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="h-full w-full rounded-3xl object-cover"
                  />
                ) : (
                  getInitials(player.full_name)
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
                  Player Profile
                </p>
                <h1 className="mt-2 text-4xl font-black">
                  {player.full_name}
                </h1>
                <p className="mt-2 text-danvers-muted">
                  {team?.name ?? "Team TBD"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Handicap
                </p>
                <p className="mt-2 text-2xl font-black">
                  {seasonPlayer?.handicap ?? "TBD"}
                </p>
              </div>

              <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Cups
                </p>
                <p className="mt-2 text-2xl font-black">0</p>
              </div>

              <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Career Points
                </p>
                <p className="mt-2 text-2xl font-black">0</p>
              </div>
            </div>

            <section className="mt-8 rounded-3xl border border-danvers-border bg-black/20 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
                Bio
              </p>
              <p className="mt-3 leading-7 text-danvers-muted">
                {player.bio ??
                  "Career history, player notes, photos, and Danvers Cup records coming soon."}
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}