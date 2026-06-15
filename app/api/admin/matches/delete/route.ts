import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.matchId) {
    return NextResponse.json({ error: "Missing match ID." }, { status: 400 });
  }

  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", body.matchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}