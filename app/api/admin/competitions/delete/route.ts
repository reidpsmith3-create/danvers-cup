import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.competitionId) {
    return NextResponse.json({ error: "Missing competition ID." }, { status: 400 });
  }

  const { error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", body.competitionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}