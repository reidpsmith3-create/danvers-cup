import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type SubmittedGroup = {
  groupNumber: number;
  name?: string;
  teeTime?: string;
  playerIds: string[];
};

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = body.roundId as string;
  const groups = body.groups as SubmittedGroup[];

  if (!roundId || !Array.isArray(groups)) {
    return NextResponse.json(
      { error: "Missing roundId or groups." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("round_groups")
    .delete()
    .eq("round_id", roundId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  for (const group of groups) {
    const playerIds = group.playerIds.filter(Boolean);

    if (playerIds.length === 0) continue;

    const { data: createdGroup, error: groupError } = await supabase
      .from("round_groups")
      .insert({
        round_id: roundId,
        group_number: group.groupNumber,
        name: group.name || `Group ${group.groupNumber}`,
        tee_time: group.teeTime || null,
      })
      .select("id")
      .single();

    if (groupError) {
      return NextResponse.json({ error: groupError.message }, { status: 500 });
    }

    const rows = playerIds.map((playerId, index) => ({
      group_id: createdGroup.id,
      player_id: playerId,
      sort_order: index + 1,
    }));

    const { error: playersError } = await supabase
      .from("group_players")
      .insert(rows);

    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}