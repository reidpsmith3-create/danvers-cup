import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateBestBallMatch } from "@/lib/scoring/bestBall";

export async function POST(request: Request) {
  const body = await request.json();

  const competitionId = body.competitionId;

  if (!competitionId) {
    return NextResponse.json(
      { error: "Missing competition ID." },
      { status: 400 }
    );
  }

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();

  if (!competition) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 }
    );
  }

  if (competition.format !== "best_ball") {
    return NextResponse.json(
      { error: "Only best ball competitions can be calculated here." },
      { status: 400 }
    );
  }

  if (!competition.round_id) {
    return NextResponse.json(
      { error: "Competition must be assigned to a round." },
      { status: 400 }
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  const { data: scores } = await supabase
    .from("scores")
    .select("player_id, hole_number, gross_score")
    .eq("round_id", competition.round_id);

  for (const match of matches ?? []) {
    const holeResults = calculateBestBallMatch({
      scores: scores ?? [],
      sideA: {
        name: match.team_a_name,
        playerIds: match.team_a_player_ids ?? [],
      },
      sideB: {
        name: match.team_b_name,
        playerIds: match.team_b_player_ids ?? [],
      },
    });

    await supabase.from("match_holes").delete().eq("match_id", match.id);

    const rows = holeResults
      .filter(
        (hole) => hole.sideAScore !== null && hole.sideBScore !== null
      )
      .map((hole) => ({
        match_id: match.id,
        hole_number: hole.holeNumber,
        winning_side:
          hole.winningSide === "side_a"
            ? "team_a"
            : hole.winningSide === "side_b"
              ? "team_b"
              : "halved",
        team_a_score: hole.sideAScore,
        team_b_score: hole.sideBScore,
      }));

    if (rows.length) {
      const { error } = await supabase.from("match_holes").insert(rows);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}