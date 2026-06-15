import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const competitionId = body.competitionId;
  const teamAId = body.teamAId || null;
const teamBId = body.teamBId || null;
const teamAName = body.teamAName || "Team A";
const teamBName = body.teamBName || "Team B";
const teamAPlayerIds = body.teamAPlayerIds ?? [];
const teamBPlayerIds = body.teamBPlayerIds ?? [];

  if (!competitionId) {
    return NextResponse.json(
      { error: "Missing competition." },
      { status: 400 }
    );
  }

  if (!teamAPlayerIds.length || !teamBPlayerIds.length) {
    return NextResponse.json(
      { error: "Each side needs at least one player." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("matches").insert({
    competition_id: competitionId,
    team_a_id: teamAId,
team_b_id: teamBId,
team_a_name: teamAName,
team_b_name: teamBName,
team_a_player_ids: teamAPlayerIds,
team_b_player_ids: teamBPlayerIds,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}