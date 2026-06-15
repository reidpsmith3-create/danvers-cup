export type StrokeScoreRow = {
  player_id: string;
  gross_score: number;
};

export type StrokePlayerResult = {
  playerId: string;
  totalGross: number;
  holesPlayed: number;
  place: number;
};

export function calculateStrokePlayResults(scores: StrokeScoreRow[]) {
  const byPlayer = new Map<
    string,
    {
      playerId: string;
      totalGross: number;
      holesPlayed: number;
    }
  >();

  scores.forEach((score) => {
    const existing =
      byPlayer.get(score.player_id) ??
      {
        playerId: score.player_id,
        totalGross: 0,
        holesPlayed: 0,
      };

    existing.totalGross += Number(score.gross_score ?? 0);
    existing.holesPlayed += 1;

    byPlayer.set(score.player_id, existing);
  });

  return Array.from(byPlayer.values())
    .sort((a, b) => a.totalGross - b.totalGross)
    .map((result, index) => ({
      ...result,
      place: index + 1,
    }));
}