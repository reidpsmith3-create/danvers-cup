import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function formatMatchType(format: string | null | undefined) {
  if (!format) return "Match Play";

  return format
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
}

function playerNames(ids: string[], players: any[]) {
  const names = ids
    .map((id) => players.find((player) => player.id === id)?.full_name)
    .filter(Boolean);

  return names.length ? names.join(" / ") : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const roundId = searchParams.get("roundId");
  const groupId = searchParams.get("groupId");

  if (!roundId) {
    return NextResponse.json({ error: "Missing roundId." }, { status: 400 });
  }

  let groupPlayerIds: string[] = [];

  if (groupId) {
    const { data: groupPlayers } = await supabase
      .from("group_players")
      .select("player_id")
      .eq("group_id", groupId);

    groupPlayerIds = groupPlayers?.map((row) => row.player_id) ?? [];
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, format")
    .eq("round_id", roundId)
    .eq("is_active", true)
    .eq("is_visible", true);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  if (competitionIds.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("competition_id", competitionIds);

  const relevantMatches =
    groupPlayerIds.length > 0
      ? (matches ?? []).filter((match) => {
          const sideA = match.team_a_player_ids ?? [];
          const sideB = match.team_b_player_ids ?? [];

          return [...sideA, ...sideB].some((playerId) =>
            groupPlayerIds.includes(playerId)
          );
        })
      : matches ?? [];

  const matchIds = relevantMatches.map((match) => match.id);

  const { data: matchHoles } =
    matchIds.length > 0
      ? await supabase.from("match_holes").select("*").in("match_id", matchIds)
      : { data: [] };

  const allPlayerIds = Array.from(
    new Set(
      relevantMatches.flatMap((match) => [
        ...(match.team_a_player_ids ?? []),
        ...(match.team_b_player_ids ?? []),
      ])
    )
  );

  const teamIds = Array.from(
    new Set(
      relevantMatches.flatMap((match) =>
        [match.team_a_id, match.team_b_id].filter(Boolean)
      )
    )
  );

  const { data: players } =
    allPlayerIds.length > 0
      ? await supabase.from("players").select("id, full_name").in("id", allPlayerIds)
      : { data: [] };

  const { data: teams } =
    teamIds.length > 0
      ? await supabase.from("teams").select("id, name, color").in("id", teamIds)
      : { data: [] };

  const competitionById = new Map(
    (competitions ?? []).map((competition) => [competition.id, competition])
  );

  const teamById = new Map((teams ?? []).map((team) => [team.id, team]));

  const matchCards = relevantMatches.map((match) => {
    const holes = (matchHoles ?? []).filter((hole) => hole.match_id === match.id);

    const teamAWins = holes.filter((hole) => hole.winning_side === "team_a").length;
    const teamBWins = holes.filter((hole) => hole.winning_side === "team_b").length;
    const margin = Math.abs(teamAWins - teamBWins);

    const sideAPlayers =
      playerNames(match.team_a_player_ids ?? [], players ?? []) ??
      match.team_a_name ??
      "Team A";

    const sideBPlayers =
      playerNames(match.team_b_player_ids ?? [], players ?? []) ??
      match.team_b_name ??
      "Team B";

    const sideAColor =
      teamById.get(match.team_a_id)?.color ?? "#1f7a4d";

    const sideBColor =
      teamById.get(match.team_b_id)?.color ?? "#1f7a4d";

    const leadingSide =
      margin === 0 ? null : teamAWins > teamBWins ? "team_a" : "team_b";

    const leader =
      leadingSide === "team_a"
        ? sideAPlayers
        : leadingSide === "team_b"
          ? sideBPlayers
          : null;

    const leaderColor =
      leadingSide === "team_a"
        ? sideAColor
        : leadingSide === "team_b"
          ? sideBColor
          : "#c39b45";

const status =
  match.final_result && match.winning_side
    ? match.winning_side === "halved"
      ? "Match Halved"
      : `${leader} wins ${match.final_result}`
    : holes.length === 0 || margin === 0
      ? "All Square"
      : `${leader} ${margin} Up`;

    const competition = competitionById.get(match.competition_id);
const shortA =
  sideAPlayers.split("/")[0]?.trim() ?? sideAPlayers;

const shortB =
  sideBPlayers.split("/")[0]?.trim() ?? sideBPlayers;

const matchupLabel = `${shortA} vs ${shortB}`;
    return {
      id: match.id,
      competitionName: competition?.name ?? "Match",
      format: formatMatchType(competition?.format),
      sideAName: match.team_a_name ?? "Team A",
      sideBName: match.team_b_name ?? "Team B",
      sideAPlayers,
      sideBPlayers,
      sideAColor,
      sideBColor,
      leaderColor,
      matchupLabel,
      status,
      holesScored: holes.length,
    };
  });

  return NextResponse.json({ matches: matchCards });
}