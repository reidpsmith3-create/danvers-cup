import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = body.roundId;
  const holeNumber = Number(body.holeNumber);
  const scores = body.scores as {
    playerId: string;
    grossScore: number;
  }[];

  if (!roundId || !holeNumber || !Array.isArray(scores)) {
    return NextResponse.json(
      { error: "Missing roundId, holeNumber, or scores." },
      { status: 400 }
    );
  }

  for (const score of scores) {
    await supabase
      .from("scores")
      .delete()
      .eq("round_id", roundId)
      .eq("player_id", score.playerId)
      .eq("hole_number", holeNumber);

    const { error } = await supabase.from("scores").insert({
      round_id: roundId,
      player_id: score.playerId,
      hole_number: holeNumber,
      gross_score: score.grossScore,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}