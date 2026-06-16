import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const update = {
    id: "main",
    eyebrow: String(body.eyebrow ?? ""),
    title: String(body.title ?? ""),
    location: String(body.location ?? ""),
    dates: String(body.dates ?? ""),
    scheduled_title: String(body.scheduled_title ?? ""),
    scheduled_subtitle: String(body.scheduled_subtitle ?? ""),
    live_title: String(body.live_title ?? ""),
    live_subtitle: String(body.live_subtitle ?? ""),
    next_up_label: String(body.next_up_label ?? ""),
    live_leaders_title: String(body.live_leaders_title ?? ""),
    empty_leaders_title: String(body.empty_leaders_title ?? ""),
    empty_leaders_body: String(body.empty_leaders_body ?? ""),
    field_title: String(body.field_title ?? ""),
    rounds_count: String(body.rounds_count ?? ""),
    players_count: String(body.players_count ?? ""),
    cup_count: String(body.cup_count ?? ""),
    history_title: String(body.history_title ?? ""),
    history_body: String(body.history_body ?? ""),
    history_button_label: String(body.history_button_label ?? ""),
    hero_image_url: String(body.hero_image_url ?? ""),
    next_round_image_url: String(body.next_round_image_url ?? ""),
    history_image_url: String(body.history_image_url ?? ""),
    updated_at: new Date().toISOString(),
  };

  const { error: homepageError } = await supabase
    .from("homepage_settings")
    .upsert(update, { onConflict: "id" });

  if (homepageError) {
    return NextResponse.json(
      { error: homepageError.message },
      { status: 500 }
    );
  }

  if (body.defending_season_id) {
    const { error: seasonError } = await supabase
      .from("seasons")
      .update({
        team_champion_name: String(body.team_champion_name ?? ""),
        individual_champion_name: String(
          body.individual_champion_name ?? ""
        ),
      })
      .eq("id", String(body.defending_season_id));

    if (seasonError) {
      return NextResponse.json(
        { error: seasonError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}