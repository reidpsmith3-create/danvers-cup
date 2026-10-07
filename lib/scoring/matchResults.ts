import { calculateMatchPlayResult } from "@/lib/scoring/matchPlay";
import { calculateVegasMatch } from "@/lib/scoring/vegasScoring";

export type MatchResultSide = "team_a" | "team_b" | "tie" | "pending";

export function resolveMatchPointValues(
  match: any,
  competitionSettings: any
) {
  const settings = competitionSettings ?? {};

  const winPoints = Number(
    match?.win_points_override ??
      settings.matchWinPoints ??
      settings.winPoints ??
      1
  );

  const tiePoints = Number(
    match?.tie_points_override ??
      settings.matchTiePoints ??
      settings.tiePoints ??
      0.5
  );

  return {
    winPoints:
      Number.isFinite(winPoints) && winPoints >= 0 ? winPoints : 1,
    tiePoints:
      Number.isFinite(tiePoints) && tiePoints >= 0 ? tiePoints : 0.5,
  };
}

export function resolveMatchOutcome({
  match,
  holes,
  format,
  settings,
}: {
  match: any;
  holes: any[];
  format: string;
  settings: any;
}): {
  winner: MatchResultSide;
  label: string;
  teamAScore: number;
  teamBScore: number;
} {
  if (format === "vegas") {
    const holeCount = Number(settings?.holeCount ?? 9);
    const nineType = settings?.nineType ?? "front";

    const vegasResult = calculateVegasMatch(
      holes.map((hole) => ({
        hole_number: Number(hole.hole_number),
        team_a_vegas_points:
          hole.team_a_vegas_points === null ||
          hole.team_a_vegas_points === undefined
            ? null
            : Number(hole.team_a_vegas_points),
        team_b_vegas_points:
          hole.team_b_vegas_points === null ||
          hole.team_b_vegas_points === undefined
            ? null
            : Number(hole.team_b_vegas_points),
      })),
      holeCount,
      nineType
    );

    if (!vegasResult.isOfficial) {
      return {
        winner: "pending",
        label: `Vegas in progress ${vegasResult.teamAPoints}-${vegasResult.teamBPoints}`,
        teamAScore: vegasResult.teamAPoints,
        teamBScore: vegasResult.teamBPoints,
      };
    }

    const winner: MatchResultSide =
      vegasResult.winningSide === "team_a"
        ? "team_a"
        : vegasResult.winningSide === "team_b"
          ? "team_b"
          : "tie";

    return {
      winner,
      label:
        winner === "team_a"
          ? `${match.team_a_name} won Vegas ${vegasResult.teamAPoints}-${vegasResult.teamBPoints}`
          : winner === "team_b"
            ? `${match.team_b_name} won Vegas ${vegasResult.teamBPoints}-${vegasResult.teamAPoints}`
            : `Vegas match halved ${vegasResult.teamAPoints}-${vegasResult.teamBPoints}`,
      teamAScore: vegasResult.teamAPoints,
      teamBScore: vegasResult.teamBPoints,
    };
  }

  const result = calculateMatchPlayResult(holes);

  return {
    winner:
      result.winner === "team_a"
        ? "team_a"
        : result.winner === "team_b"
          ? "team_b"
          : "tie",
    label:
      result.winner === "team_a"
        ? `${match.team_a_name} defeated ${match.team_b_name}`
        : result.winner === "team_b"
          ? `${match.team_b_name} defeated ${match.team_a_name}`
          : `${match.team_a_name} tied ${match.team_b_name}`,
    teamAScore: holes.filter(
      (hole) => hole.winning_side === "team_a"
    ).length,
    teamBScore: holes.filter(
      (hole) => hole.winning_side === "team_b"
    ).length,
  };
}
