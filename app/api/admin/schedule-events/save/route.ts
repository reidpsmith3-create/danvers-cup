import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const seasonId = String(body.seasonId ?? "");
  const title = String(body.title ?? "").trim();

  if (!seasonId) {
    return NextResponse.json({ error: "Missing season ID." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Event title is required." }, { status: 400 });
  }

  const payload = {
    season_id: seasonId,
    title,
    description: String(body.description ?? "").trim() || null,
    event_date: String(body.eventDate ?? "").trim() || null,
    event_time: String(body.eventTime ?? "").trim() || null,
    location: String(body.location ?? "").trim() || null,
    event_type: String(body.eventType ?? "social"),
    is_visible: Boolean(body.isVisible),
  };

  if (body.id) {
    const { data, error } = await supabase
      .from("schedule_events")
      .update(payload)
      .eq("id", String(body.id))
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, eventId: data.id });
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eventId: data.id });
}