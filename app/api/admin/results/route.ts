import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const competitionId = body.competitionId;
  const teamId = body.teamId || null;
  const playerId = body.playerId || null;
  const points = Number.parseFloat(body.points);
  const resultLabel = body.resultLabel || null;

  if (!competitionId || Number.isNaN(points)) {
    return NextResponse.json(
      { error: "Missing competition or points." },
      { status: 400 }
    );
  }

  if (!teamId && !playerId) {
    return NextResponse.json(
      { error: "Choose a team or player." },
      { status: 400 }
    );
  }

  await supabase
  .from("competition_results")
  .delete()
  .eq("competition_id", competitionId)
  .eq(teamId ? "team_id" : "player_id", teamId ?? playerId);

const { error } = await supabase.from("competition_results").insert({
  competition_id: competitionId,
  team_id: teamId,
  player_id: playerId,
  points,
  result_label: resultLabel,
  is_official: true,
});

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}