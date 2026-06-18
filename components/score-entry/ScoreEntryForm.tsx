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

type MatchStatus = {
  id: string;
  competitionName: string;
  format: string;
  sideAName: string;
  sideBName: string;
  sideAPlayers: string;
  sideBPlayers: string;
  sideAColor: string;
  sideBColor: string;
  leaderColor: string;
  matchupLabel: string;
  status: string;
  holesScored: number;
};

type ScoreEntryFormProps = {
  roundId: string;
  groupId: string | null;
  groupName: string | null;
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
  groupId,
  groupName,
  players,
  holes,
}: ScoreEntryFormProps) {
  const [holeNumber, setHoleNumber] = useState(1);
  const [scores, setScores] = useState<ScoreState[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [savedHoles, setSavedHoles] = useState<number[]>([]);
  const [matches, setMatches] = useState<MatchStatus[]>([]);

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

  useEffect(() => {
    async function loadSavedHoles() {
      const response = await fetch(
        `/api/scores/saved-holes?roundId=${roundId}${
          groupId ? `&groupId=${groupId}` : ""
        }`
      );

      const result = await response.json();
      setSavedHoles(result.savedHoles ?? []);
    }

    loadSavedHoles();
  }, [roundId, groupId, message]);

  useEffect(() => {
    async function loadMatches() {
      const response = await fetch(
        `/api/score-entry/matches?roundId=${roundId}${
          groupId ? `&groupId=${groupId}` : ""
        }`
      );

      const result = await response.json();
      setMatches(result.matches ?? []);
    }

    loadMatches();
  }, [roundId, groupId, message]);

  useEffect(() => {
    if (savedHoles.length === 0) {
      setHoleNumber(1);
      return;
    }

    const firstUnsavedHole =
      Array.from({ length: 18 })
        .map((_, index) => index + 1)
        .find((hole) => !savedHoles.includes(hole)) ?? 18;

    setHoleNumber(firstUnsavedHole);
  }, [groupId, savedHoles]);

  function updateScore(playerId: string, amount: number) {
    setScores((current) =>
      current.map((score) =>
        score.playerId === playerId
          ? { ...score, grossScore: Math.max(1, score.grossScore + amount) }
          : score
      )
    );
  }

  function setScore(playerId: string, grossScore: number) {
    setScores((current) =>
      current.map((score) =>
        score.playerId === playerId ? { ...score, grossScore } : score
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

    setMessage(
      `Saved Hole ${savedHole}. Moving to Hole ${Math.min(18, savedHole + 1)}.`
    );

    setSavedHoles((current) =>
      Array.from(new Set([...current, savedHole])).sort((a, b) => a - b)
    );

    setHoleNumber((current) => Math.min(18, current + 1));
    setIsSaving(false);
  }
  async function clearHole() {
  const confirmed = window.confirm(
    `Clear all scores for Hole ${holeNumber} for this group?`
  );

  if (!confirmed) return;

  setIsSaving(true);
  setMessage("");

  const response = await fetch("/api/scores/clear-hole", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roundId,
      holeNumber,
      playerIds: players.map((player) => player.playerId),
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    setMessage(result.error ?? "Something went wrong clearing the hole.");
    setIsSaving(false);
    return;
  }

  setScores(
    players.map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      grossScore: currentPar,
    }))
  );

  setSavedHoles((current) => current.filter((hole) => hole !== holeNumber));
  setMessage(`Cleared Hole ${holeNumber}.`);
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
  <div className="flex flex-col items-center text-center">
    <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
      Current Hole
    </p>

    {groupName ? (
      <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-danvers-brass">
        {groupName}
      </p>
    ) : null}

    <p className="mt-4 text-7xl font-black leading-none">{holeNumber}</p>

    <div className="mt-4 flex flex-wrap justify-center gap-2">
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

    <p className="mt-3 text-center text-sm text-danvers-muted">
      {isLoadingScores
        ? "Loading saved scores..."
        : `${scores.length} players · Group total ${
            totalToPar >= 0 ? "+" : ""
          }${totalToPar}`}
    </p>
  </div>

  {matches.length > 0 ? (
    <div className="mt-4 rounded-3xl border border-danvers-green/30 bg-danvers-green/10 p-3">
      <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-danvers-brass">
        Live Matches
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {matches.slice(0, 4).map((match) => (
          <div
            key={match.id}
            className="flex min-w-[180px] flex-col items-center rounded-2xl border border-danvers-border bg-black/30 px-4 py-3"
          >
            <p className="text-center text-[11px] font-bold text-danvers-muted">
              {match.matchupLabel}
            </p>

<p
  className="mt-1 text-center text-sm font-black"
  style={{ color: match.leaderColor }}
>
  {match.status}
</p>

{match.status.includes("wins") || match.status === "Match Halved" ? (
  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-danvers-gold">
    Final
  </p>
) : (
  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-danvers-muted">
    Thru {match.holesScored}
  </p>
)}
          </div>
        ))}
      </div>
    </div>
  ) : null}

  <div className="mt-5 flex justify-center gap-2 overflow-x-auto pb-1">
    {Array.from({ length: 18 }).map((_, index) => {
      const hole = index + 1;
      const isActive = hole === holeNumber;
      const isSaved = savedHoles.includes(hole);

      return (
        <button
          key={hole}
          type="button"
          onClick={() => goToHole(hole)}
          className={`flex h-10 min-w-10 items-center justify-center rounded-xl border text-sm font-black ${
            isActive
              ? "border-danvers-green bg-danvers-green text-white"
              : isSaved
                ? "border-danvers-gold bg-danvers-gold/20 text-danvers-gold"
                : "border-danvers-border bg-black/20 text-danvers-muted"
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

<div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
  <button
    type="button"
    onClick={saveHole}
    disabled={
      isSaving || isLoadingScores || scores.length === 0 || players.length === 0
    }
    className="rounded-2xl bg-danvers-gold px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
  >
    {isSaving ? "Saving..." : `Save Hole ${holeNumber}`}
  </button>

  <button
    type="button"
    onClick={clearHole}
    disabled={isSaving || isLoadingScores || players.length === 0}
    className="rounded-2xl border border-red-900/50 bg-red-950/20 px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-red-200 disabled:opacity-50"
  >
    Clear
  </button>
</div>

  {message ? (
    <div className="mt-4 rounded-2xl border border-danvers-green/40 bg-danvers-green/10 p-3 text-sm font-bold text-danvers-text">
      {message}
    </div>
  ) : null}
</section>

      {players.length === 0 ? (
        <div className="mt-6 rounded-[2rem] border border-red-900/50 bg-red-950/20 p-5">
          <h2 className="text-2xl font-black">No players in this group</h2>
          <p className="mt-2 text-danvers-muted">
            Go to Admin → Groups / Pairings and assign players before entering scores.
          </p>
        </div>
      ) : null}

      <section className="mt-6 grid gap-3">
        {scores.map((score) => {
          const scoreToPar = score.grossScore - currentPar;
          const scoreLabel =
            scoreToPar === 0
              ? "EVEN"
              : scoreToPar > 0
                ? `+${scoreToPar}`
                : scoreToPar;

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