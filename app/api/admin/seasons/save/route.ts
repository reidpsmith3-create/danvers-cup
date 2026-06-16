import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const year = Number(body.year);
  const name = String(body.name ?? "").trim();

  if (!Number.isInteger(year)) {
    return NextResponse.json(
      { error: "Year must be a valid whole number." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: "Season name is required." },
      { status: 400 }
    );
  }

  const payload = {
    year,
    name,
    location: String(body.location ?? "").trim() || null,
    start_date: String(body.startDate ?? "").trim() || null,
    end_date: String(body.endDate ?? "").trim() || null,
    status: String(body.status ?? "upcoming"),
    team_champion_name: String(body.teamChampionName ?? "").trim() || null,
    individual_champion_name:
      String(body.individualChampionName ?? "").trim() || null,
  };

  if (body.id) {
    const { data, error } = await supabase
      .from("seasons")
      .update(payload)
      .eq("id", String(body.id))
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, seasonId: data.id });
  }

  const { data, error } = await supabase
    .from("seasons")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, seasonId: data.id });
}