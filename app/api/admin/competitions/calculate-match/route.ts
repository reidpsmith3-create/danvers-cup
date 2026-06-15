import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateMatchPlayResult } from "@/lib/scoring/matchPlay";

export async function POST(request: Request) {
  const body = await request.json();

  const competitionId = body.competitionId;

  if (!competitionId) {
    return NextResponse.json(
      { error: "Missing competition ID." },
      { status: 400 }
    );
  }

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();

  if (!competition) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 }
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competitionId);

  const matchRows = matches ?? [];

  await supabase
    .from("competition_results")
    .delete()
    .eq("competition_id", competitionId);

  const settings = competition.settings ?? {};

  const winPoints = Number(settings.winPoints ?? 2);
  const tiePoints = Number(settings.tiePoints ?? 1);

  const countsForTeamPoints = Boolean(competition.counts_for_team_points);
  const countsForIndividualPoints = Boolean(
    competition.counts_for_individual_points
  );

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
    if (!countsForTeamPoints || !teamId) return;

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
    if (!countsForIndividualPoints) return;

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
    const { data: holes } = await supabase
      .from("match_holes")
      .select("*")
      .eq("match_id", match.id);

    const result = calculateMatchPlayResult(holes ?? []);

    if (result.winner === "team_a") {
      const label = `${match.team_a_name} defeated ${match.team_b_name}`;

      addTeamResult({
        teamId: match.team_a_id,
        points: winPoints,
        label,
      });

      addPlayerResults({
        playerIds: match.team_a_player_ids ?? [],
        points: winPoints,
        label,
      });
    }

    if (result.winner === "team_b") {
      const label = `${match.team_b_name} defeated ${match.team_a_name}`;

      addTeamResult({
        teamId: match.team_b_id,
        points: winPoints,
        label,
      });

      addPlayerResults({
        playerIds: match.team_b_player_ids ?? [],
        points: winPoints,
        label,
      });
    }

    if (result.winner === "tie") {
      const teamALabel = `${match.team_a_name} tied ${match.team_b_name}`;
      const teamBLabel = `${match.team_b_name} tied ${match.team_a_name}`;

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

  if (rows.length) {
    const { error } = await supabase.from("competition_results").insert(rows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    results: rows.length,
  });
}