import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = body.roundId as string;
  const holeNumber = Number(body.holeNumber);
  const playerIds = body.playerIds as string[];

  if (!roundId || !holeNumber || !Array.isArray(playerIds)) {
    return NextResponse.json(
      { error: "Missing roundId, holeNumber, or playerIds." },
      { status: 400 }
    );
  }

  const { error: scoreError } = await supabase
    .from("scores")
    .delete()
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber)
    .in("player_id", playerIds);

  if (scoreError) {
    return NextResponse.json({ error: scoreError.message }, { status: 500 });
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id")
    .eq("round_id", roundId)
    .in("format", ["match", "best_ball"]);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  if (competitionIds.length > 0) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id, team_a_player_ids, team_b_player_ids")
      .in("competition_id", competitionIds);

    const affectedMatchIds =
      matches
        ?.filter((match) => {
          const matchPlayerIds = [
            ...(match.team_a_player_ids ?? []),
            ...(match.team_b_player_ids ?? []),
          ];

          return matchPlayerIds.some((playerId) => playerIds.includes(playerId));
        })
        .map((match) => match.id) ?? [];

    if (affectedMatchIds.length > 0) {
      await supabase
        .from("match_holes")
        .delete()
        .eq("hole_number", holeNumber)
        .in("match_id", affectedMatchIds);

      await supabase
        .from("matches")
        .update({
          is_official: false,
          winning_side: null,
          final_result: null,
        })
        .in("id", affectedMatchIds);
    }
  }

  return NextResponse.json({ success: true });
}