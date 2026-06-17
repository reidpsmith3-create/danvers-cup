import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const sectionId = body.sectionId;

  if (!sectionId) {
    return NextResponse.json(
      { error: "Missing section." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("trip_info_sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}