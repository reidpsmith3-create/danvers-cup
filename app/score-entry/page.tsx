import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ScoreEntryForm from "@/components/score-entry/ScoreEntryForm";
import { getCurrentSeason } from "@/lib/currentSeason";

type ScoreEntryPageProps = {
  searchParams?: {
    round?: string;
    group?: string;
  };
};

export default async function ScoreEntryPage({
  searchParams,
}: ScoreEntryPageProps) {
  const requestedRoundNumber = searchParams?.round
    ? Number(searchParams.round)
    : null;

  const requestedGroupNumber = searchParams?.group
    ? Number(searchParams.group)
    : null;

  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, courses(name)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const liveRound = rounds?.find((item) => item.status === "live");

  const round = requestedRoundNumber
    ? rounds?.find((item) => item.round_number === requestedRoundNumber) ??
      liveRound ??
      rounds?.[0]
    : liveRound ?? rounds?.[0];

  const { data: groups } = round
    ? await supabase
        .from("round_groups")
        .select("id, group_number, name, tee_time")
        .eq("round_id", round.id)
        .order("group_number", { ascending: true })
    : { data: [] };

  const selectedGroup =
    requestedGroupNumber && groups?.length
      ? groups.find((group) => group.group_number === requestedGroupNumber) ??
        groups[0]
      : groups?.[0] ?? null;

  const { data: groupPlayers } = selectedGroup
    ? await supabase
        .from("group_players")
        .select("player_id, sort_order, players(full_name)")
        .eq("group_id", selectedGroup.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const { data: allSeasonPlayers } = await supabase
    .from("season_players")
    .select("player_id, players(full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const scorePlayers =
    selectedGroup && groupPlayers && groupPlayers.length > 0
      ? groupPlayers.map((row: any) => ({
          playerId: row.player_id,
          playerName: row.players?.full_name ?? "Unknown Player",
        }))
      : allSeasonPlayers?.map((row: any) => ({
          playerId: row.player_id,
          playerName: row.players?.full_name ?? "Unknown Player",
        })) ?? [];

  const { data: courseHoles } = round?.course_id
    ? await supabase
        .from("course_holes")
        .select("hole_number, par, yardage, handicap_number")
        .eq("course_id", round.course_id)
        .order("hole_number", { ascending: true })
    : { data: [] };

  const holes =
    courseHoles?.map((hole: any) => ({
      holeNumber: hole.hole_number,
      par: hole.par,
      yardage: hole.yardage,
      handicapNumber: hole.handicap_number,
    })) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Scorekeeper
          </p>

          <h1 className="mt-4 text-5xl font-black">Score Entry</h1>

          <p className="mt-3 text-danvers-muted">
            {round?.name ?? "Round 1"} · {round?.courses?.name ?? "Course TBD"}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {rounds?.map((roundOption) => {
              const isActive =
                roundOption.round_number === round?.round_number;

              return (
                <Link
                  key={roundOption.id}
                  href={`/score-entry?round=${roundOption.round_number}`}
                  className={`rounded-2xl px-4 py-3 text-center text-sm font-black ${
                    isActive
                      ? "bg-danvers-green text-white"
                      : "border border-danvers-border bg-black/20 text-danvers-muted"
                  }`}
                >
                  Round {roundOption.round_number}
                </Link>
              );
            })}
          </div>

          {groups && groups.length > 0 && round ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {groups.map((group) => {
                const isActive = group.id === selectedGroup?.id;

                return (
                  <Link
                    key={group.id}
                    href={`/score-entry?round=${round.round_number}&group=${group.group_number}`}
                    className={`rounded-2xl px-4 py-3 text-sm font-black ${
                      isActive
                        ? "bg-danvers-gold text-black"
                        : "border border-danvers-border bg-black/20 text-danvers-muted"
                    }`}
                  >
                    {group.name ?? `Group ${group.group_number}`}
{group.tee_time ? ` · ${group.tee_time}` : ""}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-danvers-border bg-black/20 p-4 text-sm text-danvers-muted">
              No groups found for this round. Showing all players.
            </p>
          )}
        </div>

        {round ? (
<ScoreEntryForm
  roundId={round.id}
  groupId={selectedGroup?.id ?? null}
  groupName={selectedGroup?.name ?? null}
  players={scorePlayers}
  holes={holes}
/>
        ) : (
          <p className="mt-6 text-danvers-muted">No round found.</p>
        )}
      </section>
    </main>
  );
}