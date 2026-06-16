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

  const team = getSingleRelation(teamMember?.teams);
  const teamColor = team?.color || "#1f7a4d";

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
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
            <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

            <div className="relative">
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
                    {team?.name ?? "Team TBD"}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Handicap
                  </p>
                  <p className="mt-2 text-2xl font-black text-danvers-gold">
                    {seasonPlayer?.handicap ?? "TBD"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Cups
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">0</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Points
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">0</p>
                </div>
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
                ["Appearances", "1"],
                ["Team Titles", "0"],
                ["Individual Titles", "0"],
                ["Match Record", "Coming Soon"],
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
              2026 Status
            </p>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
              <p className="text-2xl font-black text-white">Active</p>
              <p className="mt-2 text-sm leading-6 text-danvers-muted">
                Entered in the 2026 Danvers Cup field for Myrtle Beach.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}