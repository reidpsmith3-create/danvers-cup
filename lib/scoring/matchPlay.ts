export type MatchHole = {
  winning_side: string;
};

export function calculateMatchPlayResult(
  holes: MatchHole[]
) {
  const teamAWins = holes.filter(
    (hole) => hole.winning_side === "team_a"
  ).length;

  const teamBWins = holes.filter(
    (hole) => hole.winning_side === "team_b"
  ).length;

  const halved = holes.filter(
    (hole) => hole.winning_side === "halved"
  ).length;

  if (teamAWins > teamBWins) {
    return {
      winner: "team_a",
      loser: "team_b",
      teamAWins,
      teamBWins,
      halved,
      margin: teamAWins - teamBWins,
    };
  }

  if (teamBWins > teamAWins) {
    return {
      winner: "team_b",
      loser: "team_a",
      teamAWins,
      teamBWins,
      halved,
      margin: teamBWins - teamAWins,
    };
  }

  return {
    winner: "tie",
    loser: null,
    teamAWins,
    teamBWins,
    halved,
    margin: 0,
  };
}