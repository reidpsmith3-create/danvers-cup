import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const matchId = body.matchId;
  const holeNumber = Number(body.holeNumber);
  const winningSide = body.winningSide;
  const teamAScore = body.teamAScore ? Number(body.teamAScore) : null;
  const teamBScore = body.teamBScore ? Number(body.teamBScore) : null;

  if (!matchId || !holeNumber || !winningSide) {
    return NextResponse.json(
      { error: "Missing match, hole, or winning side." },
      { status: 400 }
    );
  }

  if (!["team_a", "team_b", "halved"].includes(winningSide)) {
    return NextResponse.json(
      { error: "Invalid winning side." },
      { status: 400 }
    );
  }

  await supabase
    .from("match_holes")
    .delete()
    .eq("match_id", matchId)
    .eq("hole_number", holeNumber);

  const { error } = await supabase.from("match_holes").insert({
    match_id: matchId,
    hole_number: holeNumber,
    winning_side: winningSide,
    team_a_score: teamAScore,
    team_b_score: teamBScore,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}