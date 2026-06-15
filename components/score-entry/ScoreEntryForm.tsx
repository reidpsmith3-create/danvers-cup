"use client";

import { useEffect, useState } from "react";

type ScorePlayer = {
  playerId: string;
  playerName: string;
};

type ScoreEntryFormProps = {
  roundId: string;
  players: ScorePlayer[];
};

type ScoreState = {
  playerId: string;
  playerName: string;
  grossScore: number;
};

export default function ScoreEntryForm({
  roundId,
  players,
}: ScoreEntryFormProps) {
  const [holeNumber, setHoleNumber] = useState(1);
  const [scores, setScores] = useState<ScoreState[]>(
    players.map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      grossScore: 4,
    }))
  );
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadExistingScores() {
      setIsLoadingScores(true);
      setMessage("");

      const response = await fetch(
        `/api/scores/hole?roundId=${roundId}&holeNumber=${holeNumber}`
      );

      const result = await response.json();

      const scoresByPlayerId = new Map<string, number>(
        (result.scores ?? []).map(
          (score: { player_id: string; gross_score: number }) => [
            score.player_id,
            score.gross_score,
          ]
        )
      );

      setScores(
        players.map((player) => ({
          playerId: player.playerId,
          playerName: player.playerName,
          grossScore: scoresByPlayerId.get(player.playerId) ?? 4,
        }))
      );

      setIsLoadingScores(false);
    }

    loadExistingScores();
  }, [roundId, holeNumber, players]);

  function updateScore(playerId: string, amount: number) {
    setScores((current) =>
      current.map((score) =>
        score.playerId === playerId
          ? {
              ...score,
              grossScore: Math.max(1, score.grossScore + amount),
            }
          : score
      )
    );
  }

  async function saveHole() {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/scores/save-hole", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roundId,
        holeNumber,
        scores: scores.map((score) => ({
          playerId: score.playerId,
          grossScore: score.grossScore,
        })),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setMessage(`Hole ${holeNumber} saved.`);
    setHoleNumber((current) => Math.min(18, current + 1));
    setIsSaving(false);
  }

  function goToHole(nextHole: number) {
    setHoleNumber(Math.min(18, Math.max(1, nextHole)));
  }

  return (
    <>
      <section className="mt-8 rounded-[2rem] border border-danvers-border bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
          Current Hole
        </p>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-7xl font-black">{holeNumber}</p>
            <p className="mt-2 text-danvers-muted">
              {isLoadingScores
                ? "Loading saved scores..."
                : "Hole-by-hole gross score entry"}
            </p>
          </div>

          <button
            type="button"
            onClick={saveHole}
            disabled={isSaving || isLoadingScores}
            className="rounded-2xl bg-danvers-green px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Hole"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-9">
          {Array.from({ length: 18 }).map((_, index) => {
            const hole = index + 1;
            const isActive = hole === holeNumber;

            return (
              <button
                key={hole}
                type="button"
                onClick={() => goToHole(hole)}
                className={`rounded-xl px-3 py-2 text-sm font-black ${
                  isActive
                    ? "bg-danvers-green text-white"
                    : "border border-danvers-border bg-danvers-surface text-danvers-muted"
                }`}
              >
                {hole}
              </button>
            );
          })}
        </div>

        {message ? (
          <p className="mt-4 text-sm font-bold text-danvers-muted">
            {message}
          </p>
        ) : null}
      </section>

      <section className="mt-6 grid gap-3">
        {scores.map((score) => (
          <div
            key={score.playerId}
            className="rounded-3xl border border-danvers-border bg-danvers-surface p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">{score.playerName}</h2>
                <p className="mt-1 text-sm text-danvers-muted">Gross score</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateScore(score.playerId, -1)}
                  disabled={isLoadingScores}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-danvers-border text-xl font-black disabled:opacity-50"
                >
                  −
                </button>

                <div className="flex h-12 w-14 items-center justify-center rounded-2xl bg-black/30 text-2xl font-black">
                  {score.grossScore}
                </div>

                <button
                  type="button"
                  onClick={() => updateScore(score.playerId, 1)}
                  disabled={isLoadingScores}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-danvers-border text-xl font-black disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}