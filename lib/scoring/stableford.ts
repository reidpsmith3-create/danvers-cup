export type StablefordScoreRow = {
  player_id: string;
  hole_number: number;
  gross_score: number;
  course_holes: {
    par: number;
  } | null;
};

export type StablefordPlayerResult = {
  playerId: string;
  points: number;
  holesPlayed: number;
  place: number;
};

export function calculateStablefordResults(scores: StablefordScoreRow[]) {
  const byPlayer = new Map<
    string,
    {
      playerId: string;
      points: number;
      holesPlayed: number;
    }
  >();

  scores.forEach((score) => {
    const par = score.course_holes?.par;
    if (!par) return;

    const stablefordPoints = getStablefordPoints(score.gross_score, par);

    const existing =
      byPlayer.get(score.player_id) ??
      {
        playerId: score.player_id,
        points: 0,
        holesPlayed: 0,
      };

    existing.points += stablefordPoints;
    existing.holesPlayed += 1;

    byPlayer.set(score.player_id, existing);
  });

  return Array.from(byPlayer.values())
    .sort((a, b) => b.points - a.points)
    .map((result, index) => ({
      ...result,
      place: index + 1,
    }));
}

function getStablefordPoints(score: number, par: number) {
  const relativeToPar = score - par;

  if (relativeToPar <= -3) return 5;
  if (relativeToPar === -2) return 4;
  if (relativeToPar === -1) return 3;
  if (relativeToPar === 0) return 2;
  if (relativeToPar === 1) return 1;
  return 0;
}