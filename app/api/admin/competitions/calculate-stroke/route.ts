import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateStrokePlayResults } from "@/lib/scoring/strokePlay";
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

  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", competitionId)
    .single();

  if (competitionError || !competition) {
    return NextResponse.json(
      { error: competitionError?.message ?? "Competition not found." },
      { status: 404 }
    );
  }

  if (competition.format !== "stroke") {
    return NextResponse.json(
      { error: "Only stroke play competitions can be auto-calculated here." },
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

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("player_id, gross_score")
    .eq("round_id", competition.round_id);

  if (scoresError) {
    return NextResponse.json({ error: scoresError.message }, { status: 500 });
  }

  const settings = competition.settings ?? {};

  const pointsByPlace = [
    Number(settings.pointsForFirst ?? 5),
    Number(settings.pointsForSecond ?? 3),
    Number(settings.pointsForThird ?? 2),
    Number(settings.pointsForFourth ?? 1),
  ];

  const rows: any[] = [];

  const individualResults = calculateStrokePlayResults(scores ?? []);

  if (competition.counts_for_individual_points) {
    individualResults.forEach((result) => {
      rows.push({
        competition_id: competitionId,
        player_id: result.playerId,
        team_id: null,
        points: pointsByPlace[result.place - 1] ?? 0,
        result_label: `${result.place}${getOrdinalSuffix(
          result.place
        )} · ${result.totalGross} gross · ${result.holesPlayed} holes`,
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
        total: result.totalGross,
      })),
      teamMembers: (teamMembers as any[]) ?? [],
      method: settings.teamScoringMethod ?? "best_2_total",
    });

    teamResults.forEach((result) => {
      rows.push({
        competition_id: competitionId,
        player_id: null,
        team_id: result.teamId,
        points: pointsByPlace[result.place - 1] ?? 0,
        result_label: `${result.place}${getOrdinalSuffix(
          result.place
        )} · ${result.teamTotal} team gross · ${result.countedPlayers} counted`,
        is_official: true,
      });
    });
  }

  if (rows.length) {
    const { error: insertError } = await supabase
      .from("competition_results")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
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