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
      { error: "Missing competition ID." },
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

  if (matchRows.some((match) => !match.is_official)) {
    return NextResponse.json(
      {
        error:
          "All matches must be official before competition results can be finalized.",
      },
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

  const rows: any[] = [];

  function addTeamResult({
    teamId,
    points,
    label,
  }: {
    teamId: string | null;
    points: number;
    label: string;
  }) {
    if (!competition.counts_for_team_points || !teamId) return;

    rows.push({
      competition_id: competitionId,
      points,
      team_id: teamId,
      player_id: null,
      result_label: label,
      is_official: true,
    });
  }

  function addPlayerResults({
    playerIds,
    points,
    label,
  }: {
    playerIds: string[];
    points: number;
    label: string;
  }) {
    if (!competition.counts_for_individual_points) return;

    playerIds.forEach((playerId) => {
      rows.push({
        competition_id: competitionId,
        points,
        team_id: null,
        player_id: playerId,
        result_label: label,
        is_official: true,
      });
    });
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

    if (outcome.winner === "team_a") {
      addTeamResult({
        teamId: match.team_a_id,
        points: winPoints,
        label: outcome.label,
      });

      addPlayerResults({
        playerIds: match.team_a_player_ids ?? [],
        points: winPoints,
        label: outcome.label,
      });
    }

    if (outcome.winner === "team_b") {
      addTeamResult({
        teamId: match.team_b_id,
        points: winPoints,
        label: outcome.label,
      });

      addPlayerResults({
        playerIds: match.team_b_player_ids ?? [],
        points: winPoints,
        label: outcome.label,
      });
    }

    if (outcome.winner === "tie") {
      const teamALabel =
        competition.format === "vegas"
          ? outcome.label
          : `${match.team_a_name} tied ${match.team_b_name}`;

      const teamBLabel =
        competition.format === "vegas"
          ? outcome.label
          : `${match.team_b_name} tied ${match.team_a_name}`;

      addTeamResult({
        teamId: match.team_a_id,
        points: tiePoints,
        label: teamALabel,
      });

      addTeamResult({
        teamId: match.team_b_id,
        points: tiePoints,
        label: teamBLabel,
      });

      addPlayerResults({
        playerIds: match.team_a_player_ids ?? [],
        points: tiePoints,
        label: teamALabel,
      });

      addPlayerResults({
        playerIds: match.team_b_player_ids ?? [],
        points: tiePoints,
        label: teamBLabel,
      });
    }
  }

  await supabase
    .from("competition_results")
    .delete()
    .eq("competition_id", competitionId);

  if (rows.length) {
    const { error } = await supabase
      .from("competition_results")
      .insert(rows);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    results: rows.length,
  });
}
