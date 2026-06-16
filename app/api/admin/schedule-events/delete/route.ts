import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const eventId = String(body.eventId ?? "");

  if (!eventId) {
    return NextResponse.json({ error: "Missing event ID." }, { status: 400 });
  }

  const { error } = await supabase
    .from("schedule_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}