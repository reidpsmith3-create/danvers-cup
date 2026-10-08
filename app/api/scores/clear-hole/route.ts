import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { invalidateCompetitionResults } from "@/lib/scoring/invalidateCompetitionResults";
import {
  calculateVegasMatch,
  getVegasCompetitionHoles,
} from "@/lib/scoring/vegasScoring";

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = body.roundId as string;
  const holeNumber = Number(body.holeNumber);
  const playerIds = body.playerIds as string[];

  if (!roundId || !holeNumber || !Array.isArray(playerIds)) {
    return NextResponse.json(
      { error: "Missing roundId, holeNumber, or playerIds." },
      { status: 400 }
    );
  }

  const { error: scoreError } = await supabase
    .from("scores")
    .delete()
    .eq("round_id", roundId)
    .eq("hole_number", holeNumber)
    .in("player_id", playerIds);

  if (scoreError) {
    return NextResponse.json(
      { error: scoreError.message },
      { status: 500 }
    );
  }

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
        team_b_player_ids
      `
    )
    .in("competition_id", competitionIds);

  if (matchesError) {
    return NextResponse.json(
      { error: matchesError.message },
      { status: 500 }
    );
  }

  const affectedMatches =
    matches?.filter((match) => {
      const matchPlayerIds = [
        ...(match.team_a_player_ids ?? []),
        ...(match.team_b_player_ids ?? []),
      ];

      return matchPlayerIds.some((playerId) =>
        playerIds.includes(playerId)
      );
    }) ?? [];

  const competitionsToInvalidate = new Set<string>();

  for (const match of affectedMatches) {
    const competition = competitions?.find(
      (item) => item.id === match.competition_id
    );

    if (!competition) continue;

    const settings = (competition as any).settings ?? {};
    const holeCount = Number(
      settings.holeCount ?? (competition.format === "vegas" ? 9 : 18)
    );
    const nineType =
      holeCount === 9 ? String(settings.nineType ?? "front") : null;

    const competitionHoles = getVegasCompetitionHoles({
      holeCount,
      nineType,
    });

    if (!competitionHoles.includes(holeNumber)) continue;

    competitionsToInvalidate.add(match.competition_id);

    const { error: deleteHoleError } = await supabase
      .from("match_holes")
      .delete()
      .eq("match_id", match.id)
      .eq("hole_number", holeNumber);

    if (deleteHoleError) {
      return NextResponse.json(
        { error: deleteHoleError.message },
        { status: 500 }
      );
    }

    /*
     * Vegas gets recalculated from the remaining completed holes.
     *
     * Because one hole was just removed, a normal 9-hole Vegas match
     * will become unofficial until that hole is entered again.
     */
    if (competition.format === "vegas") {
      const settings = (competition as any).settings ?? {};
      const holeCount = Number(settings.holeCount ?? 9);
      const nineType =
        holeCount === 9
          ? String(settings.nineType ?? "front")
          : null;

      const competitionHoles = getVegasCompetitionHoles({
        holeCount,
        nineType,
      });

      // If the cleared hole is outside this Vegas competition,
      // there is no Vegas match state to recalculate.
      if (!competitionHoles.includes(holeNumber)) {
        continue;
      }

      const { data: remainingHoles, error: remainingHolesError } =
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

      if (remainingHolesError) {
        return NextResponse.json(
          { error: remainingHolesError.message },
          { status: 500 }
        );
      }

      const vegasMatch = calculateVegasMatch(
        (remainingHoles ?? []).map((hole: any) => ({
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
        holeCount,
        nineType
      );

      const { error: vegasUpdateError } = await supabase
        .from("matches")
        .update({
          is_official: vegasMatch.isOfficial,
          winning_side: vegasMatch.winningSide,
          final_result: vegasMatch.finalResult,
        })
        .eq("id", match.id);

      if (vegasUpdateError) {
        return NextResponse.json(
          { error: vegasUpdateError.message },
          { status: 500 }
        );
      }

      continue;
    }

    /*
     * Recalculate Match Play and Fourball from the remaining
     * competition holes, including mathematically decided matches.
     */
    const { data: remainingMatchHoles, error: remainingError } =
      await supabase
        .from("match_holes")
        .select("hole_number, winning_side")
        .eq("match_id", match.id);

    if (remainingError) {
      return NextResponse.json(
        { error: remainingError.message },
        { status: 500 }
      );
    }

    const validHoles = (remainingMatchHoles ?? []).filter((hole) =>
      competitionHoles.includes(Number(hole.hole_number))
    );

    const teamAWins = validHoles.filter(
      (hole) => hole.winning_side === "team_a"
    ).length;
    const teamBWins = validHoles.filter(
      (hole) => hole.winning_side === "team_b"
    ).length;

    const holesPlayed = validHoles.length;
    const holesRemaining = Math.max(0, holeCount - holesPlayed);
    const margin = Math.abs(teamAWins - teamBWins);

    const isOfficial =
      holesPlayed >= holeCount || margin > holesRemaining;

    const winningSide = !isOfficial
      ? null
      : teamAWins === teamBWins
        ? "halved"
        : teamAWins > teamBWins
          ? "team_a"
          : "team_b";

    const finalResult = !isOfficial
      ? null
      : winningSide === "halved"
        ? "Halved"
        : holesPlayed >= holeCount
          ? `${margin} Up`
          : `${margin} & ${holesRemaining}`;

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        is_official: isOfficial,
        winning_side: winningSide,
        final_result: finalResult,
      })
      .eq("id", match.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
  }

  try {
    for (const competitionId of competitionsToInvalidate) {
      await invalidateCompetitionResults(competitionId);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Result invalidation failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
