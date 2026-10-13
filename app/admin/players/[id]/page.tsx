import Link from "next/link";
import PlayerProfileForm from "@/components/admin/PlayerProfileForm";
import PlayerSponsorsManager from "@/components/admin/PlayerSponsorsManager";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

type AdminPlayerEditPageProps = {
  params: {
    id: string;
  };
};

export default async function AdminPlayerEditPage({
  params,
}: AdminPlayerEditPageProps) {
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", params.id)
    .single();

  const season = await getCurrentSeason();

  const { data: seasonPlayer } = await supabase
    .from("season_players")
    .select("*")
    .eq("season_id", season?.id)
    .eq("player_id", params.id)
    .single();

  const [
    { data: sponsors, error: sponsorsError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase
      .from("sponsors")
      .select("id, name, logo_url, website_url")
      .order("name", { ascending: true }),
    supabase
      .from("player_sponsors")
      .select("sponsor_id, display_order")
      .eq("player_id", params.id)
      .order("display_order", { ascending: true }),
  ]);

  if (!player) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link
            href="/admin/players"
            className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
          >
            ← Players
          </Link>

          <h1 className="mt-6 text-4xl font-black">Player not found</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/players"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Players
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Edit Player</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Update profile photo, bio, and handicap for {player.full_name}.
          </p>
        </div>

        <div className="mt-6">
          <PlayerProfileForm player={player} seasonPlayer={seasonPlayer} />
        </div>

        {sponsorsError || assignmentsError ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 p-4 text-sm text-red-300">
            Unable to load player sponsors. Please refresh and try again.
          </p>
        ) : (
          <PlayerSponsorsManager
            playerId={player.id}
            sponsors={sponsors ?? []}
            assignments={assignments ?? []}
          />
        )}
      </section>
    </main>
  );
}