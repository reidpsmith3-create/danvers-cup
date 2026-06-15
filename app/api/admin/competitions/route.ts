import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const seasonId = body.seasonId;
  const roundId = body.roundId || null;
  const name = body.name;
  const format = body.format;
  const scoringBasis = body.scoringBasis;
  const handicapPercent = Number(body.handicapPercent ?? 100);
  const countsForTeamPoints = Boolean(body.countsForTeamPoints);
  const countsForIndividualPoints = Boolean(body.countsForIndividualPoints);
  const settings = body.settings ?? {};

  if (!seasonId || !name || !format || !scoringBasis) {
    return NextResponse.json(
      { error: "Missing required competition fields." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("competitions").insert({
    season_id: seasonId,
    round_id: roundId,
    name,
    format,
    scoring_basis: scoringBasis,
    handicap_percent: handicapPercent,
    counts_for_team_points: countsForTeamPoints,
    counts_for_individual_points: countsForIndividualPoints,
    is_active: true,
    is_visible: true,
    settings,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}