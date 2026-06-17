import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getMatchOutcome(holes: any[]) {
  const teamAWins = holes.filter((hole) => hole.winning_side === "team_a").length;
  const teamBWins = holes.filter((hole) => hole.winning_side === "team_b").length;

  if (teamAWins > teamBWins) {
    return {
      teamAPoints: 1,
      teamBPoints: 0,
      label: `Team A wins ${teamAWins}-${teamBWins}`,
    };
  }

  if (teamBWins > teamAWins) {
    return {
      teamAPoints: 0,
      teamBPoints: 1,
      label: `Team B wins ${teamBWins}-${teamAWins}`,
    };
  }

  return {
    teamAPoints: 0.5,
    teamBPoints: 0.5,
    label: "Match halved",
  };
}

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
    return NextResponse.json({ error: matchesError.message }, { status: 500 });
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
    return NextResponse.json({ error: holesError.message }, { status: 500 });
  }

  const holeRows = (holes as any[]) ?? [];

  await supabase
    .from("competition_results")
    .delete()
    .eq("competition_id", competitionId);

  const teamPoints = new Map<string, number>();
  const playerPoints = new Map<string, number>();
  const resultRows: any[] = [];

  matchRows.forEach((match) => {
    const holesForMatch = holeRows.filter((hole) => hole.match_id === match.id);
    const outcome = getMatchOutcome(holesForMatch);

    if (competition.counts_for_team_points) {
      if (match.team_a_id) {
        teamPoints.set(
          match.team_a_id,
          (teamPoints.get(match.team_a_id) ?? 0) + outcome.teamAPoints
        );
      }

      if (match.team_b_id) {
        teamPoints.set(
          match.team_b_id,
          (teamPoints.get(match.team_b_id) ?? 0) + outcome.teamBPoints
        );
      }
    }

    if (competition.counts_for_individual_points) {
      (match.team_a_player_ids ?? []).forEach((playerId: string) => {
        playerPoints.set(
          playerId,
          (playerPoints.get(playerId) ?? 0) + outcome.teamAPoints
        );
      });

      (match.team_b_player_ids ?? []).forEach((playerId: string) => {
        playerPoints.set(
          playerId,
          (playerPoints.get(playerId) ?? 0) + outcome.teamBPoints
        );
      });
    }
  });

  teamPoints.forEach((points, teamId) => {
    resultRows.push({
      competition_id: competitionId,
      team_id: teamId,
      player_id: null,
      points,
      result_label: "Auto-finalized from match results",
      is_official: true,
    });
  });

  playerPoints.forEach((points, playerId) => {
    resultRows.push({
      competition_id: competitionId,
      team_id: null,
      player_id: playerId,
      points,
      result_label: "Auto-finalized from match results",
      is_official: true,
    });
  });

  const { error: insertError } = await supabase
    .from("competition_results")
    .insert(resultRows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    resultsCreated: resultRows.length,
  });
}