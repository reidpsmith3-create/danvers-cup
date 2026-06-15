import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const roundId = searchParams.get("roundId");
  const holeNumber = Number(searchParams.get("holeNumber"));

  if (!roundId || !holeNumber) {
    return NextResponse.json(
      { error: "Missing roundId or holeNumber." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("scores")
    .select("player_id, gross_score")
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ scores: data ?? [] });
}