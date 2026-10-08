import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { invalidateCompetitionResults } from "@/lib/scoring/invalidateCompetitionResults";
import {
  calculateVegasHole,
  calculateVegasMatch,
  getVegasCompetitionHoles,
} from "@/lib/scoring/vegasScoring";

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

function getWinningSide(
  teamAScore: number | null,
  teamBScore: number | null
) {
  if (teamAScore === null || teamBScore === null) return null;
  if (teamAScore < teamBScore) return "team_a";
  if (teamBScore < teamAScore) return "team_b";
  return "halved";
}

function getMatchResult(holes: any[], holeCount: number) {
  const teamAWins = holes.filter(
    (hole) => hole.winning_side === "team_a"
  ).length;

  const teamBWins = holes.filter(
    (hole) => hole.winning_side === "team_b"
  ).length;

  const holesPlayed = holes.length;
  const holesRemaining = Math.max(0, holeCount - holesPlayed);
  const margin = Math.abs(teamAWins - teamBWins);

  if (holesPlayed < holeCount && margin <= holesRemaining) {
    return {
      isOfficial: false,
      winningSide: null,
      finalResult: null,
    };
  }

  if (teamAWins === teamBWins) {
    return {
      isOfficial: true,
      winningSide: "halved",
      finalResult: "Halved",
    };
  }

  const winningSide =
    teamAWins > teamBWins ? "team_a" : "team_b";

  if (holesPlayed >= holeCount) {
    return {
      isOfficial: true,
      winningSide,
      finalResult: `${margin} Up`,
    };
  }

  return {
    isOfficial: true,
    winningSide,
    finalResult: `${margin} & ${holesRemaining}`,
  };
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

  // Check whether any submitted score actually changes.
  const submittedPlayerIds = [...new Set(scores.map((s) => s.playerId))];

  const { data: previousScores, error: previousScoresError } =
    await supabase
      .from("scores")
      .select("player_id, gross_score")
      .eq("round_id", roundId)
      .eq("hole_number", holeNumber)
      .in("player_id", submittedPlayerIds);

  if (previousScoresError) {
    return NextResponse.json(
      { error: previousScoresError.message },
      { status: 500 }
    );
  }

  const previousScoreMap = new Map(
    (previousScores ?? []).map((score) => [
      String(score.player_id),
      Number(score.gross_score),
    ])
  );

  const changedPlayerIds = new Set(
    scores
      .filter(
        (score) =>
          !previousScoreMap.has(score.playerId) ||
          previousScoreMap.get(score.playerId) !== Number(score.grossScore)
      )
      .map((score) => score.playerId)
  );

  if (changedPlayerIds.size === 0) {
    return NextResponse.json({ success: true });
  }

  /*
   * Save the submitted individual gross scores first.
   * These remain the source of truth for every competition format.
   */
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  /*
   * Load the round so Vegas can resolve the course and hole par.
   */
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("id, course_id")
    .eq("id", roundId)
    .single();

  if (roundError) {
    return NextResponse.json(
      { error: roundError.message },
      { status: 500 }
    );
  }

  /*
   * Load every match-based competition attached to this round.
   */
  const { data: competitions, error: competitionError } =
    await supabase
      .from("competitions")
      .select("id, format, settings")
      .eq("round_id", roundId)
      .in("format", ["match", "best_ball", "vegas"]);

  if (competitionError) {
    return NextResponse.json(
      { error: competitionError.message },
      { status: 500 }
    );
  }

  const competitionIds =
    competitions?.map((competition) => competition.id) ?? [];

  if (competitionIds.length === 0) {
    return NextResponse.json({ success: true });
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      `
        id,
        competition_id,
        team_a_player_ids,
        team_b_player_ids,
        is_official,
        final_result
      `
    )
    .in("competition_id", competitionIds);

  if (matchesError) {
    return NextResponse.json(
      { error: matchesError.message },
      { status: 500 }
    );
  }

  /*
   * We only need par for Vegas. Fetch it once for the submitted hole.
   */
  let holePar: number | null = null;

  const hasVegasCompetition = competitions?.some(
    (competition) => competition.format === "vegas"
  );

  if (hasVegasCompetition) {
    if (!round?.course_id) {
      return NextResponse.json(
        { error: "Vegas scoring requires the round to have a course." },
        { status: 400 }
      );
    }

    const { data: courseHole, error: courseHoleError } =
      await supabase
        .from("course_holes")
        .select("par")
        .eq("course_id", round.course_id)
        .eq("hole_number", holeNumber)
        .single();

    if (courseHoleError || !courseHole) {
      return NextResponse.json(
        {
          error: `Vegas scoring could not find par for Hole ${holeNumber}.`,
        },
        { status: 400 }
      );
    }

    holePar = Number(courseHole.par);
  }

  const competitionsToInvalidate = new Set<string>();

  for (const match of matches ?? []) {
    const competition = competitions?.find(
      (item) => item.id === match.competition_id
    );

    if (!competition) continue;

    const settings = (competition as any).settings ?? {};

    const matchPlayerIds = [
      ...(match.team_a_player_ids ?? []),
      ...(match.team_b_player_ids ?? []),
    ];

    const relevantScoreChanged = matchPlayerIds.some((playerId) =>
      changedPlayerIds.has(playerId)
    );

    if (!relevantScoreChanged) continue;

    const competitionHoleCount = Number(
      settings.holeCount ?? (competition.format === "vegas" ? 9 : 18)
    );

    const competitionHoles = getVegasCompetitionHoles({
      holeCount: competitionHoleCount,
      nineType:
        competitionHoleCount === 9
          ? String(settings.nineType ?? "front")
          : null,
    });

    const relevantHole = competitionHoles.includes(holeNumber);

    // Never calculate match results from holes outside the competition.
    if (!relevantHole) continue;

    if (match.is_official && relevantScoreChanged && relevantHole) {
      competitionsToInvalidate.add(match.competition_id);
    }

    const holeCount = competitionHoleCount;

    /*
     * VEGAS
     *
     * Vegas has its own hole and match scoring path. It must not use
     * normal match-play "holes up" calculations or early finalization.
     */
    if (competition.format === "vegas") {
      const vegasHoleCount = Number(settings.holeCount ?? 9);
      const vegasNineType =
        vegasHoleCount === 9
          ? String(settings.nineType ?? "front")
          : null;

      const vegasCompetitionHoles = getVegasCompetitionHoles({
        holeCount: vegasHoleCount,
        nineType: vegasNineType,
      });

      // Ignore holes that are outside this Vegas competition.
      // Example: a back-nine Vegas match should not create scoring
      // rows while players are entering holes 1-9.
      if (!vegasCompetitionHoles.includes(holeNumber)) {
        continue;
      }

      const teamAPlayerIds =
        (match.team_a_player_ids ?? []) as string[];

      const teamBPlayerIds =
        (match.team_b_player_ids ?? []) as string[];

      if (
        teamAPlayerIds.length !== 2 ||
        teamBPlayerIds.length !== 2
      ) {
        return NextResponse.json(
          {
            error:
              "Vegas matches require exactly 2 players on each side.",
          },
          { status: 400 }
        );
      }

      /*
       * Read the hole back from Supabase after saving.
       *
       * This makes the database the source of truth for Vegas instead
       * of assuming all four golfers were included in this request.
       * The hole is calculated once all four match players have a
       * persisted score.
       */
      const vegasPlayerIds = [
        ...teamAPlayerIds,
        ...teamBPlayerIds,
      ];

      const { data: persistedVegasScores, error: vegasScoresError } =
        await supabase
          .from("scores")
          .select("player_id, gross_score")
          .eq("round_id", roundId)
          .eq("hole_number", holeNumber)
          .in("player_id", vegasPlayerIds);

      if (vegasScoresError) {
        return NextResponse.json(
          { error: vegasScoresError.message },
          { status: 500 }
        );
      }

      const persistedScoreMap = new Map<string, number | null>(
        (persistedVegasScores ?? []).map((score: any) => {
          const rawScore = score.gross_score;

          if (rawScore === null || rawScore === undefined) {
            return [String(score.player_id), null];
          }

          const numericScore = Number(rawScore);

          return [
            String(score.player_id),
            Number.isFinite(numericScore) ? numericScore : null,
          ];
        })
      );

      const teamAScores = teamAPlayerIds
        .map((playerId) => persistedScoreMap.get(playerId))
        .filter(
          (score): score is number =>
            score !== undefined && score !== null
        );

      const teamBScores = teamBPlayerIds
        .map((playerId) => persistedScoreMap.get(playerId))
        .filter(
          (score): score is number =>
            score !== undefined && score !== null
        );

      /*
       * A Vegas hole isn't calculated until all four golfers in that
       * match have a persisted score for the hole.
       */
      if (
        teamAScores.length !== 2 ||
        teamBScores.length !== 2
      ) {
        continue;
      }

      if (holePar === null) {
        return NextResponse.json(
          { error: "Vegas scoring requires a valid hole par." },
          { status: 400 }
        );
      }

      const allVegasScores = [
        ...teamAScores,
        ...teamBScores,
      ];

      const hasInvalidVegasScore = allVegasScores.some(
        (score) =>
          !Number.isInteger(score) ||
          score <= 0 ||
          score >= 10
      );

      if (hasInvalidVegasScore) {
        return NextResponse.json(
          {
            error:
              "Vegas scores must be positive single-digit whole numbers from 1 through 9.",
          },
          { status: 400 }
        );
      }

      const vegasHole = calculateVegasHole({
        par: holePar,
        teamAScores: [
          teamAScores[0],
          teamAScores[1],
        ],
        teamBScores: [
          teamBScores[0],
          teamBScores[1],
        ],
      });

      await supabase
        .from("match_holes")
        .delete()
        .eq("match_id", match.id)
        .eq("hole_number", holeNumber);

      const { error: vegasHoleError } = await supabase
        .from("match_holes")
        .insert({
          match_id: match.id,
          hole_number: holeNumber,
          winning_side: vegasHole.winner,
          team_a_score: vegasHole.teamAVegasNumber,
          team_b_score: vegasHole.teamBVegasNumber,
          team_a_vegas_points: vegasHole.teamAPoints,
          team_b_vegas_points: vegasHole.teamBPoints,
          vegas_multiplier: vegasHole.multiplier,
          team_a_flipped: vegasHole.teamAFlipped,
          team_b_flipped: vegasHole.teamBFlipped,
        });

      if (vegasHoleError) {
        return NextResponse.json(
          { error: vegasHoleError.message },
          { status: 500 }
        );
      }

      const { data: allVegasHoles, error: vegasHolesError } =
        await supabase
          .from("match_holes")
          .select(
            `
              hole_number,
              team_a_vegas_points,
              team_b_vegas_points
            `
          )
          .eq("match_id", match.id)
          .order("hole_number", { ascending: true });

      if (vegasHolesError) {
        return NextResponse.json(
          { error: vegasHolesError.message },
          { status: 500 }
        );
      }

      const vegasMatch = calculateVegasMatch(
        (allVegasHoles ?? []).map((hole: any) => ({
          hole_number: Number(hole.hole_number),
          team_a_vegas_points:
            hole.team_a_vegas_points === null
              ? null
              : Number(hole.team_a_vegas_points),
          team_b_vegas_points:
            hole.team_b_vegas_points === null
              ? null
              : Number(hole.team_b_vegas_points),
        })),
        vegasHoleCount,
        vegasNineType
      );

      const { error: vegasMatchError } = await supabase
        .from("matches")
        .update({
          is_official: vegasMatch.isOfficial,
          winning_side: vegasMatch.winningSide,
          final_result: vegasMatch.finalResult,
        })
        .eq("id", match.id);

      if (vegasMatchError) {
        return NextResponse.json(
          { error: vegasMatchError.message },
          { status: 500 }
        );
      }

      continue;
    }

    /*
     * NORMAL MATCH / BEST BALL
     *
     * Preserve the existing match-play behavior.
     */
    // Recalculate even when previously official, so score corrections
    // can update the match result and invalidate published standings.
    const teamAScore = getSideScore(
      match.team_a_player_ids ?? [],
      scores
    );

    const teamBScore = getSideScore(
      match.team_b_player_ids ?? [],
      scores
    );

    const winningSide = getWinningSide(
      teamAScore,
      teamBScore
    );

    if (!winningSide) continue;

    await supabase
      .from("match_holes")
      .delete()
      .eq("match_id", match.id)
      .eq("hole_number", holeNumber);

    const { error } = await supabase
      .from("match_holes")
      .insert({
        match_id: match.id,
        hole_number: holeNumber,
        winning_side: winningSide,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const { data: allMatchHoles } = await supabase
      .from("match_holes")
      .select("*")
      .eq("match_id", match.id)
      .order("hole_number", { ascending: true });

    const result = getMatchResult(
      ((allMatchHoles as any[]) ?? []).filter((hole) =>
        competitionHoles.includes(Number(hole.hole_number))
      ),
      holeCount
    );

    await supabase
      .from("matches")
      .update({
        is_official: result.isOfficial,
        winning_side: result.winningSide,
        final_result: result.finalResult,
      })
      .eq("id", match.id);
  }

  try {
    for (const competitionId of competitionsToInvalidate) {
      await invalidateCompetitionResults(competitionId);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Result invalidation failed.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
