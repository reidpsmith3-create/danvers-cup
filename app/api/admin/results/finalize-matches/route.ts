import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  resolveMatchOutcome,
  resolveMatchPointValues,
} from "@/lib/scoring/matchResults";

export async function POST(request: Request) {
  const body = await request.json();
  const competitionId = body.competitionId;

  if (!competitionId) {
    return NextResponse.json(
      { error: "Missing competition." },
      { status: 400 }
    );
  }

  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();

  if (competitionError || !competition) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 }
    );
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: true });

  if (matchesError) {
    return NextResponse.json(
      { error: matchesError.message },
      { status: 500 }
    );
  }

  const matchRows = (matches as any[]) ?? [];

  if (!matchRows.length) {
    return NextResponse.json(
      { error: "No matches found for this competition." },
      { status: 400 }
    );
  }

  const matchIds = matchRows.map((match) => match.id);

  const { data: holes, error: holesError } = await supabase
    .from("match_holes")
    .select("*")
    .in("match_id", matchIds)
    .order("hole_number", { ascending: true });

  if (holesError) {
    return NextResponse.json(
      { error: holesError.message },
      { status: 500 }
    );
  }

  const holeRows = (holes as any[]) ?? [];
  const settings = competition.settings ?? {};

  const teamPoints = new Map<string, number>();
  const playerPoints = new Map<string, number>();
  const teamLabels = new Map<string, string[]>();
  const playerLabels = new Map<string, string[]>();

  function addPoints(
    map: Map<string, number>,
    labels: Map<string, string[]>,
    id: string | null | undefined,
    points: number,
    label: string
  ) {
    if (!id) return;

    map.set(id, (map.get(id) ?? 0) + points);
    labels.set(id, [...(labels.get(id) ?? []), label]);
  }

  for (const match of matchRows) {
    const holesForMatch = holeRows.filter(
      (hole) => hole.match_id === match.id
    );

    if (!holesForMatch.length) continue;

    const outcome = resolveMatchOutcome({
      match,
      holes: holesForMatch,
      format: competition.format,
      settings,
    });

    if (outcome.winner === "pending") {
      continue;
    }

    const { winPoints, tiePoints } = resolveMatchPointValues(
      match,
      settings
    );

    const teamAPoints =
      outcome.winner === "team_a"
        ? winPoints
        : outcome.winner === "tie"
          ? tiePoints
          : 0;

    const teamBPoints =
      outcome.winner === "team_b"
        ? winPoints
        : outcome.winner === "tie"
          ? tiePoints
          : 0;

    if (competition.counts_for_team_points) {
      addPoints(
        teamPoints,
        teamLabels,
        match.team_a_id,
        teamAPoints,
        outcome.label
      );

      addPoints(
        teamPoints,
        teamLabels,
        match.team_b_id,
        teamBPoints,
        outcome.label
      );
    }

    if (competition.counts_for_individual_points) {
      (match.team_a_player_ids ?? []).forEach(
        (playerId: string) => {
          addPoints(
            playerPoints,
            playerLabels,
            playerId,
            teamAPoints,
            outcome.label
          );
        }
      );

      (match.team_b_player_ids ?? []).forEach(
        (playerId: string) => {
          addPoints(
            playerPoints,
            playerLabels,
            playerId,
            teamBPoints,
            outcome.label
          );
        }
      );
    }
  }

  const resultRows: any[] = [];

  teamPoints.forEach((points, teamId) => {
    resultRows.push({
      competition_id: competitionId,
      team_id: teamId,
      player_id: null,
      points,
      result_label:
        teamLabels.get(teamId)?.join(" · ") ??
        "Auto-finalized from match results",
      is_official: true,
    });
  });

  playerPoints.forEach((points, playerId) => {
    resultRows.push({
      competition_id: competitionId,
      team_id: null,
      player_id: playerId,
      points,
      result_label:
        playerLabels.get(playerId)?.join(" · ") ??
        "Auto-finalized from match results",
      is_official: true,
    });
  });

  await supabase
    .from("competition_results")
    .delete()
    .eq("competition_id", competitionId);

  if (resultRows.length) {
    const { error: insertError } = await supabase
      .from("competition_results")
      .insert(resultRows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    resultsCreated: resultRows.length,
  });
}
