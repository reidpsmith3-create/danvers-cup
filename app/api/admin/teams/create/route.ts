import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  const body = await request.json();

  const seasonId = String(body.seasonId ?? "");
  const name = String(body.name ?? "").trim();
  const color = String(body.color ?? "#1f7a4d");

  if (!seasonId) {
    return NextResponse.json({ error: "Missing season ID." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Team name is required." }, { status: 400 });
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      season_id: seasonId,
      name,
      color,
    })
    .select("id")
    .single();

  if (error || !team) {
    return NextResponse.json(
      { error: error?.message ?? "Team could not be created." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, teamId: team.id });
}