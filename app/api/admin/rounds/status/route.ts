import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const allowedStatuses = ["scheduled", "live", "complete"];

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = body.roundId;
  const status = body.status;

  if (!roundId || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Missing round ID or invalid status." },
      { status: 400 }
    );
  }

  if (status === "live") {
    const { data: round } = await supabase
      .from("rounds")
      .select("season_id")
      .eq("id", roundId)
      .single();

    if (round?.season_id) {
      await supabase
        .from("rounds")
        .update({ status: "scheduled" })
        .eq("season_id", round.season_id)
        .eq("status", "live");
    }
  }

  const { error } = await supabase
    .from("rounds")
    .update({ status })
    .eq("id", roundId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}