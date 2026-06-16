import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const competitionId = body.competitionId
    ? String(body.competitionId)
    : null;

  const seasonId = String(body.seasonId ?? "");
  const roundId = String(body.roundId ?? "");
  const name = String(body.name ?? "").trim();
  const format = String(body.format ?? "match");
  const scoringBasis = String(body.scoringBasis ?? "gross");
  const handicapPercent = Number(body.handicapPercent ?? 100);

  if (!seasonId) {
    return NextResponse.json({ error: "Missing season ID." }, { status: 400 });
  }

  if (!roundId) {
    return NextResponse.json({ error: "Missing round ID." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json(
      { error: "Competition name is required." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(handicapPercent)) {
    return NextResponse.json(
      { error: "Handicap percent must be a valid number." },
      { status: 400 }
    );
  }

  const payload = {
    season_id: seasonId,
    round_id: roundId,
    name,
    format,
    scoring_basis: scoringBasis,
    handicap_percent: handicapPercent,
    counts_for_team_points: Boolean(body.countsForTeamPoints),
    counts_for_individual_points: Boolean(body.countsForIndividualPoints),
    is_active: Boolean(body.isActive),
    is_visible: Boolean(body.isVisible),
    settings: body.settings ?? {},
  };

  if (competitionId) {
    const { error } = await supabase
      .from("competitions")
      .update(payload)
      .eq("id", competitionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, competitionId });
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, competitionId: data.id });
}