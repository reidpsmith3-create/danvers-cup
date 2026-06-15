import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const resultId = body.resultId;

  if (!resultId) {
    return NextResponse.json(
      { error: "Missing result ID." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("competition_results")
    .delete()
    .eq("id", resultId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}