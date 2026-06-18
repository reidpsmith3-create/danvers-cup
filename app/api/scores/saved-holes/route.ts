import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const roundId = searchParams.get("roundId");
  const groupId = searchParams.get("groupId");

  if (!roundId) {
    return NextResponse.json({ error: "Missing roundId." }, { status: 400 });
  }

  let playerIds: string[] = [];

  if (groupId) {
    const { data: groupPlayers, error: groupError } = await supabase
      .from("group_players")
      .select("player_id")
      .eq("group_id", groupId);

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    playerIds = groupPlayers?.map((row) => row.player_id) ?? [];
  }

  let query = supabase
    .from("scores")
    .select("hole_number, player_id")
    .eq("round_id", roundId);

  if (playerIds.length > 0) {
    query = query.in("player_id", playerIds);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const playerCount = playerIds.length || 1;

  const countsByHole = new Map<number, number>();

  (data ?? []).forEach((row) => {
    countsByHole.set(
      row.hole_number,
      (countsByHole.get(row.hole_number) ?? 0) + 1
    );
  });

  const savedHoles = Array.from(countsByHole.entries())
    .filter(([, count]) => count >= playerCount)
    .map(([holeNumber]) => holeNumber)
    .sort((a, b) => a - b);

  return NextResponse.json({ savedHoles });
}