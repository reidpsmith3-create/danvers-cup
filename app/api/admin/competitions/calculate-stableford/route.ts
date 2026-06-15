import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateStablefordResults } from "@/lib/scoring/stableford";
import { calculateTeamAggregateResults } from "@/lib/scoring/teamAggregate";

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
    .select("*, rounds(course_id)")
    .eq("id", competitionId)
    .single();

  if (!competition) {
    return NextResponse.json(
      { error: "Competition not found." },
      { status: 404 }
    );
  }

  if (competition.format !== "stableford") {
    return NextResponse.json(
      { error: "Only Stableford competitions can be calculated here." },
      { status: 400 }
    );
  }

  if (!competition.round_id) {
    return NextResponse.json(
      { error: "Competition must be assigned to a round." },
      { status: 400 }
    );
  }

  await supabase
    .from("competition_results")
    .delete()
    .eq("competition_id", competitionId);

  const courseId = competition.rounds?.course_id;

  if (!courseId) {
    return NextResponse.json(
      { error: "Round must have a course." },
      { status: 400 }
    );
  }

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("player_id, hole_number, gross_score")
    .eq("round_id", competition.round_id);

  if (scoresError) {
    return NextResponse.json({ error: scoresError.message }, { status: 500 });
  }

  const { data: courseHoles, error: courseHolesError } = await supabase
    .from("course_holes")
    .select("hole_number, par")
    .eq("course_id", courseId);

  if (courseHolesError) {
    return NextResponse.json(
      { error: courseHolesError.message },
      { status: 500 }
    );
  }

  const parByHole = new Map(
    ((courseHoles as any[]) ?? []).map((hole) => [hole.hole_number, hole.par])
  );

  const stablefordScores =
    scores?.map((score: any) => ({
      ...score,
      course_holes: {
        par: parByHole.get(score.hole_number),
      },
    })) ?? [];

  const settings = competition.settings ?? {};

  const pointsByPlace = [
    Number(settings.pointsForFirst ?? 5),
    Number(settings.pointsForSecond ?? 3),
    Number(settings.pointsForThird ?? 2),
    Number(settings.pointsForFourth ?? 1),
  ];

  const rows: any[] = [];

  const individualResults = calculateStablefordResults(stablefordScores);

  if (competition.counts_for_individual_points) {
    individualResults.forEach((result) => {
      rows.push({
        competition_id: competitionId,
        player_id: result.playerId,
        team_id: null,
        points: pointsByPlace[result.place - 1] ?? 0,
        result_label: `${result.place}${getOrdinalSuffix(
          result.place
        )} · ${result.points} Stableford pts · ${result.holesPlayed} holes`,
        is_official: true,
      });
    });
  }

  if (competition.counts_for_team_points) {
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from("team_members")
      .select("team_id, player_id");

    if (teamMembersError) {
      return NextResponse.json(
        { error: teamMembersError.message },
        { status: 500 }
      );
    }

    const teamResults = calculateTeamAggregateResults({
      playerTotals: individualResults.map((result) => ({
        playerId: result.playerId,
        total: result.points,
      })),
      teamMembers: (teamMembers as any[]) ?? [],
      method: settings.teamScoringMethod ?? "best_2_total",
      higherIsBetter: true,
    });

    teamResults.forEach((result) => {
      rows.push({
        competition_id: competitionId,
        player_id: null,
        team_id: result.teamId,
        points: pointsByPlace[result.place - 1] ?? 0,
        result_label: `${result.place}${getOrdinalSuffix(
          result.place
        )} · ${result.teamTotal} team Stableford pts · ${
          result.countedPlayers
        } counted`,
        is_official: true,
      });
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("competition_results").insert(rows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, results: rows.length });
}

function getOrdinalSuffix(place: number) {
  if (place === 1) return "st";
  if (place === 2) return "nd";
  if (place === 3) return "rd";
  return "th";
}