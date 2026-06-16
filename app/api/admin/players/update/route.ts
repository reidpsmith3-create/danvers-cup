import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const playerId = String(body.playerId ?? "");
  const seasonPlayerId = body.seasonPlayerId
    ? String(body.seasonPlayerId)
    : null;

  if (!playerId) {
    return NextResponse.json(
      { error: "Missing player ID." },
      { status: 400 }
    );
  }

  const handicapRaw = String(body.handicap ?? "").trim();
  const handicap =
    handicapRaw.length > 0 ? Number(handicapRaw) : null;

  if (handicap !== null && !Number.isFinite(handicap)) {
    return NextResponse.json(
      { error: "Handicap must be a valid number." },
      { status: 400 }
    );
  }

  const { error: playerError } = await supabase
    .from("players")
    .update({
      full_name: String(body.full_name ?? ""),
      bio: String(body.bio ?? ""),
      photo_url: String(body.photoUrl ?? ""),
    })
    .eq("id", playerId);

  if (playerError) {
    return NextResponse.json(
      { error: playerError.message },
      { status: 500 }
    );
  }

  if (seasonPlayerId) {
    const { error: seasonPlayerError } = await supabase
      .from("season_players")
      .update({
        handicap,
      })
      .eq("id", seasonPlayerId);

    if (seasonPlayerError) {
      return NextResponse.json(
        { error: seasonPlayerError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}