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
  const [scores, setScores] = useState<ScoreState[]>([]);
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

  function setScore(playerId: string, grossScore: number) {
    setScores((current) =>
      current.map((score) =>
        score.playerId === playerId
          ? {
              ...score,
              grossScore,
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

  const totalToPar = scores.reduce((total, score) => {
    return total + (score.grossScore - 4);
  }, 0);

  return (
    <>
      <section className="sticky top-0 z-30 mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
          Current Hole
        </p>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-7xl font-black leading-none">{holeNumber}</p>
            <p className="mt-2 text-sm text-danvers-muted">
              {isLoadingScores
                ? "Loading saved scores..."
                : `${scores.length} players · Group total ${totalToPar >= 0 ? "+" : ""}${totalToPar}`}
            </p>
          </div>

          <button
            type="button"
            onClick={saveHole}
            disabled={isSaving || isLoadingScores || scores.length === 0}
            className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 18 }).map((_, index) => {
            const hole = index + 1;
            const isActive = hole === holeNumber;

            return (
              <button
                key={hole}
                type="button"
                onClick={() => goToHole(hole)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-xl text-sm font-black ${
                  isActive
                    ? "bg-danvers-green text-white"
                    : "border border-danvers-border bg-black/20 text-danvers-muted"
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">{score.playerName}</h2>
                <p className="mt-1 text-sm text-danvers-muted">
                  Gross {score.grossScore}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateScore(score.playerId, -1)}
                  disabled={isLoadingScores}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danvers-border text-2xl font-black disabled:opacity-50"
                >
                  −
                </button>

                <div className="flex h-14 w-16 items-center justify-center rounded-2xl bg-black/30 text-3xl font-black">
                  {score.grossScore}
                </div>

                <button
                  type="button"
                  onClick={() => updateScore(score.playerId, 1)}
                  disabled={isLoadingScores}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danvers-border text-2xl font-black disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {[3, 4, 5, 6, 7].map((quickScore) => (
                <button
                  key={quickScore}
                  type="button"
                  onClick={() => setScore(score.playerId, quickScore)}
                  disabled={isLoadingScores}
                  className={`rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-50 ${
                    score.grossScore === quickScore
                      ? "border-danvers-gold bg-danvers-gold/20 text-danvers-gold"
                      : "border-danvers-border bg-black/20 text-danvers-muted"
                  }`}
                >
                  {quickScore}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}