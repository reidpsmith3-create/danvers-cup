export type BestBallScoreRow = {
  player_id: string;
  hole_number: number;
  gross_score: number;
};

export type BestBallSide = {
  name: string;
  playerIds: string[];
};

export type BestBallHoleResult = {
  holeNumber: number;
  sideAScore: number | null;
  sideBScore: number | null;
  winningSide: "side_a" | "side_b" | "halved";
};

export function calculateBestBallMatch({
  scores,
  sideA,
  sideB,
}: {
  scores: BestBallScoreRow[];
  sideA: BestBallSide;
  sideB: BestBallSide;
}) {
  const holes = Array.from({ length: 18 }).map((_, index) => index + 1);

  return holes.map((holeNumber) => {
    const sideAScores = scores
      .filter(
        (score) =>
          score.hole_number === holeNumber &&
          sideA.playerIds.includes(score.player_id)
      )
      .map((score) => Number(score.gross_score));

    const sideBScores = scores
      .filter(
        (score) =>
          score.hole_number === holeNumber &&
          sideB.playerIds.includes(score.player_id)
      )
      .map((score) => Number(score.gross_score));

    const sideAScore = sideAScores.length ? Math.min(...sideAScores) : null;
    const sideBScore = sideBScores.length ? Math.min(...sideBScores) : null;

    let winningSide: "side_a" | "side_b" | "halved" = "halved";

    if (sideAScore !== null && sideBScore !== null) {
      if (sideAScore < sideBScore) winningSide = "side_a";
      if (sideBScore < sideAScore) winningSide = "side_b";
    }

    return {
      holeNumber,
      sideAScore,
      sideBScore,
      winningSide,
    };
  });
}