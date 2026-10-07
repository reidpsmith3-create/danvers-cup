export type VegasSide = "team_a" | "team_b";

export type VegasHoleResult = {
  teamANormalNumber: number;
  teamBNormalNumber: number;

  teamAVegasNumber: number;
  teamBVegasNumber: number;

  teamAHasBirdie: boolean;
  teamBHasBirdie: boolean;

  teamAHasEagle: boolean;
  teamBHasEagle: boolean;

  teamAFlipped: boolean;
  teamBFlipped: boolean;

  differential: number;
  multiplier: number;

  winner: VegasSide | "halved";
  teamAPoints: number;
  teamBPoints: number;

  explanation: string;
};

function makeVegasNumber(
  score1: number,
  score2: number,
  flipped: boolean
): number {
  const low = Math.min(score1, score2);
  const high = Math.max(score1, score2);

  return flipped
    ? high * 10 + low
    : low * 10 + high;
}

export function calculateVegasHole({
  par,
  teamAScores,
  teamBScores,
}: {
  par: number;
  teamAScores: [number, number];
  teamBScores: [number, number];
}): VegasHoleResult {
  if (!Number.isFinite(par) || par <= 0) {
    throw new Error("Vegas scoring requires a valid par.");
  }

  const allScores = [...teamAScores, ...teamBScores];

  if (
    allScores.some(
      (score) =>
        !Number.isFinite(score) ||
        !Number.isInteger(score) ||
        score <= 0 ||
        score >= 10
    )
  ) {
    throw new Error(
      "Vegas scoring requires four positive single-digit whole-number scores."
    );
  }

  const teamAHasBirdie = teamAScores.some((score) => score === par - 1);
  const teamBHasBirdie = teamBScores.some((score) => score === par - 1);

  const teamAHasEagle = teamAScores.some((score) => score <= par - 2);
  const teamBHasEagle = teamBScores.some((score) => score <= par - 2);

  // An eagle also counts as a flip-triggering score.
  const teamATriggersFlip = teamAHasBirdie || teamAHasEagle;
  const teamBTriggersFlip = teamBHasBirdie || teamBHasEagle;

  // A flip occurs only when exactly one side triggers it.
  // If both sides make birdie-or-better, the flips cancel.
  const teamAFlipped = teamBTriggersFlip && !teamATriggersFlip;
  const teamBFlipped = teamATriggersFlip && !teamBTriggersFlip;

  const teamANormalNumber = makeVegasNumber(
    teamAScores[0],
    teamAScores[1],
    false
  );

  const teamBNormalNumber = makeVegasNumber(
    teamBScores[0],
    teamBScores[1],
    false
  );

  const teamAVegasNumber = makeVegasNumber(
    teamAScores[0],
    teamAScores[1],
    teamAFlipped
  );

  const teamBVegasNumber = makeVegasNumber(
    teamBScores[0],
    teamBScores[1],
    teamBFlipped
  );

  const differential = Math.abs(teamAVegasNumber - teamBVegasNumber);

  let winner: VegasSide | "halved" = "halved";

  if (teamAVegasNumber < teamBVegasNumber) {
    winner = "team_a";
  } else if (teamBVegasNumber < teamAVegasNumber) {
    winner = "team_b";
  }

  // Eagle doubling belongs only to the team that made the eagle,
  // and only if that team wins the hole.
  let multiplier = 1;

  if (winner === "team_a" && teamAHasEagle) {
    multiplier = 2;
  } else if (winner === "team_b" && teamBHasEagle) {
    multiplier = 2;
  }

  const awardedPoints =
    winner === "halved" ? 0 : differential * multiplier;

  const teamAPoints = winner === "team_a" ? awardedPoints : 0;
  const teamBPoints = winner === "team_b" ? awardedPoints : 0;

  let explanation = `Team A ${teamAVegasNumber} vs Team B ${teamBVegasNumber}.`;

  if (teamAFlipped) {
    explanation += " Team A was flipped.";
  }

  if (teamBFlipped) {
    explanation += " Team B was flipped.";
  }

  if (
    teamATriggersFlip &&
    teamBTriggersFlip
  ) {
    explanation += " Both teams made birdie-or-better, so the flips canceled.";
  }

  if (winner === "halved") {
    explanation += " Hole halved; no Vegas points awarded.";
  } else {
    const winnerLabel = winner === "team_a" ? "Team A" : "Team B";

    explanation += ` ${winnerLabel} wins ${awardedPoints} Vegas point${
      awardedPoints === 1 ? "" : "s"
    }`;

    if (multiplier === 2) {
      explanation += " after the eagle double";
    }

    explanation += ".";
  }

  return {
    teamANormalNumber,
    teamBNormalNumber,
    teamAVegasNumber,
    teamBVegasNumber,
    teamAHasBirdie,
    teamBHasBirdie,
    teamAHasEagle,
    teamBHasEagle,
    teamAFlipped,
    teamBFlipped,
    differential,
    multiplier,
    winner,
    teamAPoints,
    teamBPoints,
    explanation,
  };
}

export type VegasMatchHole = {
  hole_number: number;
  team_a_vegas_points: number | null;
  team_b_vegas_points: number | null;
};

export type VegasMatchResult = {
  teamAPoints: number;
  teamBPoints: number;
  holesPlayed: number;
  holesRequired: number;
  isOfficial: boolean;
  winningSide: VegasSide | "halved" | null;
  finalResult: string | null;
};

export function calculateVegasMatch(
  holes: VegasMatchHole[],
  holeCount = 9,
  nineType: string | null = "front"
): VegasMatchResult {
  const competitionHoles = getVegasCompetitionHoles({
    holeCount,
    nineType,
  });

  const competitionHoleSet = new Set(competitionHoles);

  const completedHoles = holes.filter(
    (hole) =>
      competitionHoleSet.has(Number(hole.hole_number)) &&
      hole.team_a_vegas_points !== null &&
      hole.team_b_vegas_points !== null
  );

  const teamAPoints = completedHoles.reduce(
    (total, hole) => total + Number(hole.team_a_vegas_points ?? 0),
    0
  );

  const teamBPoints = completedHoles.reduce(
    (total, hole) => total + Number(hole.team_b_vegas_points ?? 0),
    0
  );

  const holesPlayed = completedHoles.length;

  // Vegas never closes early. All scheduled holes must be completed.
  if (holesPlayed < holeCount) {
    return {
      teamAPoints,
      teamBPoints,
      holesPlayed,
      holesRequired: holeCount,
      isOfficial: false,
      winningSide: null,
      finalResult: null,
    };
  }

  if (teamAPoints === teamBPoints) {
    return {
      teamAPoints,
      teamBPoints,
      holesPlayed,
      holesRequired: holeCount,
      isOfficial: true,
      winningSide: "halved",
      finalResult: `Vegas ${teamAPoints}-${teamBPoints} · Halved`,
    };
  }

  const winningSide =
    teamAPoints > teamBPoints ? "team_a" : "team_b";

  return {
    teamAPoints,
    teamBPoints,
    holesPlayed,
    holesRequired: holeCount,
    isOfficial: true,
    winningSide,
    finalResult: `Vegas ${teamAPoints}-${teamBPoints}`,
  };
}

export type VegasNineType = "front" | "back" | null;

export function getVegasCompetitionHoles({
  holeCount,
  nineType,
}: {
  holeCount: number;
  nineType?: string | null;
}): number[] {
  if (holeCount === 9) {
    if (nineType === "back") {
      return Array.from({ length: 9 }, (_, index) => index + 10);
    }

    return Array.from({ length: 9 }, (_, index) => index + 1);
  }

  return Array.from(
    { length: holeCount },
    (_, index) => index + 1
  );
}
