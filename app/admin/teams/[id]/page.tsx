import Link from "next/link";
import TeamForm from "@/components/admin/TeamForm";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

type AdminTeamEditPageProps = {
  params: {
    id: string;
  };
};

type SeasonPlayerRow = {
  player_id: string;
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

type TeamMemberRow = {
  player_id: string;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AdminTeamEditPage({
  params,
}: AdminTeamEditPageProps) {
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", params.id)
    .single();

  const season = await getCurrentSeason();

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("player_id, players(id, full_name, photo_url)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("player_id")
    .eq("team_id", params.id);

  if (!team) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link href="/admin/teams" className="text-danvers-muted">
            ← Teams
          </Link>

          <h1 className="mt-6 text-4xl font-black">Team not found</h1>
        </section>
      </main>
    );
  }

  const players = ((seasonPlayers as SeasonPlayerRow[] | null) ?? []).flatMap(
    (row) => {
      const player = getSingleRelation(row.players);
      return player ? [player] : [];
    }
  );

  const selectedPlayerIds = ((teamMembers as TeamMemberRow[] | null) ?? []).map(
    (member) => member.player_id
  );

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/teams"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Teams
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Edit Team</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Update team name, color, logo, and roster for {team.name}.
          </p>
        </div>

        <div className="mt-6">
          <TeamForm
            team={team}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
          />
        </div>
      </section>
    </main>
  );
}