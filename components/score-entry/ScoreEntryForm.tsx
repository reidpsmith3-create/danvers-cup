"use client";

import { useEffect, useState } from "react";

type ScorePlayer = {
  playerId: string;
  playerName: string;
};

type CourseHole = {
  holeNumber: number;
  par: number;
  yardage: number | null;
  handicapNumber: number | null;
};

type ScoreEntryFormProps = {
  roundId: string;
  players: ScorePlayer[];
  holes: CourseHole[];
};

type ScoreState = {
  playerId: string;
  playerName: string;
  grossScore: number;
};

export default function ScoreEntryForm({
  roundId,
  players,
  holes,
}: ScoreEntryFormProps) {
  const [holeNumber, setHoleNumber] = useState(1);
  const [scores, setScores] = useState<ScoreState[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentHole = holes.find((hole) => hole.holeNumber === holeNumber);
  const currentPar = currentHole?.par ?? 4;

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
          grossScore: scoresByPlayerId.get(player.playerId) ?? currentPar,
        }))
      );

      setIsLoadingScores(false);
    }

    loadExistingScores();
  }, [roundId, holeNumber, players, currentPar]);

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

 const savedHole = holeNumber;

setMessage(`Saved Hole ${savedHole}. Moving to Hole ${Math.min(18, savedHole + 1)}.`);
setHoleNumber((current) => Math.min(18, current + 1));
setIsSaving(false);
  }

  function goToHole(nextHole: number) {
    setHoleNumber(Math.min(18, Math.max(1, nextHole)));
  }

  const totalToPar = scores.reduce((total, score) => {
    return total + (score.grossScore - currentPar);
  }, 0);

  const quickScores = Array.from(
    new Set([
      Math.max(1, currentPar - 1),
      currentPar,
      currentPar + 1,
      currentPar + 2,
      currentPar + 3,
    ])
  );

  return (
    <>
<section className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface p-5 shadow-2xl shadow-black/40">
  <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
    Current Hole
  </p>

  <div className="mt-4 flex items-start justify-between gap-4">
    <div>
      <p className="text-7xl font-black leading-none">{holeNumber}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-danvers-border bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-danvers-muted">
          Par {currentPar}
        </span>

        {currentHole?.yardage ? (
          <span className="rounded-full border border-danvers-border bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-danvers-muted">
            {currentHole.yardage} yds
          </span>
        ) : null}

        {currentHole?.handicapNumber ? (
          <span className="rounded-full border border-danvers-border bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-danvers-muted">
            HCP {currentHole.handicapNumber}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-danvers-muted">
        {isLoadingScores
          ? "Loading saved scores..."
          : `${scores.length} players · Group total ${
              totalToPar >= 0 ? "+" : ""
            }${totalToPar}`}
      </p>
    </div>
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

  <div className="mt-5 grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => goToHole(holeNumber - 1)}
      disabled={holeNumber === 1 || isLoadingScores}
      className="rounded-2xl border border-danvers-border bg-black/20 px-4 py-3 text-sm font-black text-danvers-text disabled:opacity-40"
    >
      ← Previous
    </button>

    <button
      type="button"
      onClick={() => goToHole(holeNumber + 1)}
      disabled={holeNumber === 18 || isLoadingScores}
      className="rounded-2xl border border-danvers-border bg-black/20 px-4 py-3 text-sm font-black text-danvers-text disabled:opacity-40"
    >
      Next →
    </button>
  </div>

  <button
    type="button"
    onClick={saveHole}
    disabled={isSaving || isLoadingScores || scores.length === 0}
    className="mt-3 w-full rounded-2xl bg-danvers-gold px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
  >
    {isSaving ? "Saving..." : `Save Hole ${holeNumber}`}
  </button>

{message ? (
  <div className="mt-4 rounded-2xl border border-danvers-green/40 bg-danvers-green/10 p-3 text-sm font-bold text-danvers-text">
    {message}
  </div>
) : null}
</section>

<section className="mt-6 grid gap-3">
  {scores.map((score) => {
    const scoreToPar = score.grossScore - currentPar;
    const scoreLabel =
      scoreToPar === 0 ? "EVEN" : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar;

    return (
      <div
        key={score.playerId}
        className="rounded-3xl border border-danvers-border bg-danvers-surface p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">{score.playerName}</h2>

            <div className="mt-2 inline-flex rounded-full border border-danvers-border bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-danvers-muted">
              {scoreLabel}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateScore(score.playerId, -1)}
              disabled={isLoadingScores}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danvers-border text-3xl font-black disabled:opacity-50"
            >
              −
            </button>

            <div className="flex h-16 w-20 items-center justify-center rounded-2xl bg-black/30 text-4xl font-black">
              {score.grossScore}
            </div>

            <button
              type="button"
              onClick={() => updateScore(score.playerId, 1)}
              disabled={isLoadingScores}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danvers-border text-3xl font-black disabled:opacity-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {quickScores.map((quickScore) => (
            <button
              key={quickScore}
              type="button"
              onClick={() => setScore(score.playerId, quickScore)}
              disabled={isLoadingScores}
              className={`rounded-xl border px-3 py-3 text-base font-black disabled:opacity-50 ${
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
    );
  })}
</section>
<a
  href="/live"
  className="mt-6 block rounded-[2rem] border border-danvers-border bg-black/20 p-5 text-center text-sm font-black uppercase tracking-[0.18em] text-danvers-muted"
>
  Back to Live
</a>
    </>
  );
}