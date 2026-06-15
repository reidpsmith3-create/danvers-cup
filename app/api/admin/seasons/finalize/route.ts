import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const seasonId = body.seasonId;

  if (!seasonId) {
    return NextResponse.json(
      { error: "Missing season ID." },
      { status: 400 }
    );
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id")
    .eq("season_id", seasonId);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  if (competitionIds.length === 0) {
    return NextResponse.json(
      { error: "No competitions found for this season." },
      { status: 400 }
    );
  }

  const { data: results, error: resultsError } = await supabase
    .from("competition_results")
    .select("team_id, player_id, points")
    .in("competition_id", competitionIds)
    .eq("is_official", true);

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 });
  }

  const teamTotals = new Map<string, number>();
  const playerTotals = new Map<string, number>();

  for (const result of results ?? []) {
    if (result.team_id) {
      teamTotals.set(
        result.team_id,
        (teamTotals.get(result.team_id) ?? 0) + Number(result.points ?? 0)
      );
    }

    if (result.player_id) {
      playerTotals.set(
        result.player_id,
        (playerTotals.get(result.player_id) ?? 0) + Number(result.points ?? 0)
      );
    }
  }

  const teamChampion = Array.from(teamTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const individualChampion = Array.from(playerTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  if (!teamChampion && !individualChampion) {
    return NextResponse.json(
      { error: "No official team or individual results found." },
      { status: 400 }
    );
  }

  await supabase.from("season_results").delete().eq("season_id", seasonId);

  const { error: insertError } = await supabase.from("season_results").insert({
    season_id: seasonId,
    team_champion_id: teamChampion?.[0] ?? null,
    individual_champion_player_id: individualChampion?.[0] ?? null,
    team_champion_points: teamChampion?.[1] ?? null,
    individual_champion_points: individualChampion?.[1] ?? null,
    is_final: true,
    finalized_at: new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}