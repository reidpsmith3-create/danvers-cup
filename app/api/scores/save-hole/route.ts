import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type SubmittedScore = {
  playerId: string;
  grossScore: number;
};

function getSideScore(playerIds: string[], scores: SubmittedScore[]) {
  const sideScores = scores
    .filter((score) => playerIds.includes(score.playerId))
    .map((score) => Number(score.grossScore));

  if (sideScores.length === 0) return null;

  return Math.min(...sideScores);
}

function getWinningSide(teamAScore: number | null, teamBScore: number | null) {
  if (teamAScore === null || teamBScore === null) return null;
  if (teamAScore < teamBScore) return "team_a";
  if (teamBScore < teamAScore) return "team_b";
  return "halved";
}

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = body.roundId;
  const holeNumber = Number(body.holeNumber);
  const scores = body.scores as SubmittedScore[];

  if (!roundId || !holeNumber || !Array.isArray(scores)) {
    return NextResponse.json(
      { error: "Missing roundId, holeNumber, or scores." },
      { status: 400 }
    );
  }

  for (const score of scores) {
    await supabase
      .from("scores")
      .delete()
      .eq("round_id", roundId)
      .eq("player_id", score.playerId)
      .eq("hole_number", holeNumber);

    const { error } = await supabase.from("scores").insert({
      round_id: roundId,
      player_id: score.playerId,
      hole_number: holeNumber,
      gross_score: score.grossScore,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, format")
    .eq("round_id", roundId)
    .in("format", ["match", "best_ball"]);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  if (competitionIds.length > 0) {
    const { data: matches } = await supabase
      .from("matches")
      .select("id, competition_id, team_a_player_ids, team_b_player_ids")
      .in("competition_id", competitionIds);

    for (const match of matches ?? []) {
      const teamAScore = getSideScore(match.team_a_player_ids ?? [], scores);
      const teamBScore = getSideScore(match.team_b_player_ids ?? [], scores);
      const winningSide = getWinningSide(teamAScore, teamBScore);

      if (!winningSide) continue;

      await supabase
        .from("match_holes")
        .delete()
        .eq("match_id", match.id)
        .eq("hole_number", holeNumber);

      const { error } = await supabase.from("match_holes").insert({
        match_id: match.id,
        hole_number: holeNumber,
        winning_side: winningSide,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}