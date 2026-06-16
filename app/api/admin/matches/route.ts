import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const competitionId = String(body.competitionId ?? "");
  const teamAId = String(body.teamAId ?? "");
  const teamBId = String(body.teamBId ?? "");
  const teamAName = String(body.teamAName ?? "Team A");
  const teamBName = String(body.teamBName ?? "Team B");

  const teamAPlayerIds = Array.isArray(body.teamAPlayerIds)
    ? body.teamAPlayerIds.map((id: unknown) => String(id))
    : [];

  const teamBPlayerIds = Array.isArray(body.teamBPlayerIds)
    ? body.teamBPlayerIds.map((id: unknown) => String(id))
    : [];

  if (!competitionId) {
    return NextResponse.json(
      { error: "Missing competition." },
      { status: 400 }
    );
  }

  if (!teamAId || !teamBId) {
    return NextResponse.json(
      { error: "Both teams are required." },
      { status: 400 }
    );
  }

  if (teamAId === teamBId) {
    return NextResponse.json(
      { error: "Choose two different teams." },
      { status: 400 }
    );
  }

  if (!teamAPlayerIds.length || !teamBPlayerIds.length) {
    return NextResponse.json(
      { error: "Each side needs at least one player." },
      { status: 400 }
    );
  }

const duplicatePlayer = teamAPlayerIds.find((playerId: string) =>
  teamBPlayerIds.includes(playerId)
);

  if (duplicatePlayer) {
    return NextResponse.json(
      { error: "A player cannot be on both sides of the same match." },
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