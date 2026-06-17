import PairingsBuilder from "@/components/admin/PairingsBuilder";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GroupsAdminPageProps = {
  searchParams?: {
    roundId?: string;
  };
};

export default async function GroupsAdminPage({
  searchParams,
}: GroupsAdminPageProps) {
  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, round_number, name")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const roundOptions =
    rounds?.map((round: any) => ({
      id: round.id,
      roundNumber: round.round_number,
      name: round.name,
    })) ?? [];

  const selectedRoundId = searchParams?.roundId ?? roundOptions[0]?.id ?? "";

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("player_id, players(full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const players =
    seasonPlayers?.map((row: any) => ({
      playerId: row.player_id,
      playerName: row.players?.full_name ?? "Unknown Player",
    })) ?? [];

  const { data: groups } = selectedRoundId
    ? await supabase
        .from("round_groups")
        .select("id, group_number, name, tee_time")
        .eq("round_id", selectedRoundId)
        .order("group_number", { ascending: true })
    : { data: [] };

  const groupIds = groups?.map((group) => group.id) ?? [];

  const { data: groupPlayers } =
    groupIds.length > 0
      ? await supabase
          .from("group_players")
          .select("group_id, player_id, sort_order")
          .in("group_id", groupIds)
          .order("sort_order", { ascending: true })
      : { data: [] };

  const existingGroups =
    groups?.map((group: any) => ({
      id: group.id,
      groupNumber: group.group_number,
      name: group.name,
      teeTime: group.tee_time,
      playerIds:
        groupPlayers
          ?.filter((row: any) => row.group_id === group.id)
          .map((row: any) => row.player_id) ?? [],
    })) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>

          <h1 className="mt-4 text-5xl font-black">Groups / Pairings</h1>

          <p className="mt-3 max-w-2xl text-danvers-muted">
            Build foursomes for each round. Score entry will use these groups so
            scorekeepers only see the players in their group.
          </p>
        </div>

        {selectedRoundId ? (
          <PairingsBuilder
            rounds={roundOptions}
            players={players}
            selectedRoundId={selectedRoundId}
            existingGroups={existingGroups}
          />
        ) : (
          <div className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
            <h2 className="text-2xl font-black">No rounds found</h2>
            <p className="mt-2 text-danvers-muted">
              Create rounds before building pairings.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}