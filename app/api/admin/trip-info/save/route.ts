import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const sectionId = body.sectionId;
  const seasonId = body.seasonId;
  const title = String(body.title ?? "").trim();

  if (!seasonId || !title) {
    return NextResponse.json(
      { error: "Season and title are required." },
      { status: 400 }
    );
  }

const payload = {
  season_id: seasonId,
  eyebrow: String(body.eyebrow ?? "").trim() || null,
  title,
  body: String(body.body ?? "").trim() || null,
  image_url: String(body.imageUrl ?? "").trim() || null,
  primary_button_label: String(body.primaryButtonLabel ?? "").trim() || null,
  primary_button_url: String(body.primaryButtonUrl ?? "").trim() || null,
  secondary_button_label:
    String(body.secondaryButtonLabel ?? "").trim() || null,
  secondary_button_url: String(body.secondaryButtonUrl ?? "").trim() || null,
  sort_order: Number(body.sortOrder ?? 0),
  is_visible: Boolean(body.isVisible),
};

  const query = sectionId
    ? supabase.from("trip_info_sections").update(payload).eq("id", sectionId)
    : supabase.from("trip_info_sections").insert(payload);

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}