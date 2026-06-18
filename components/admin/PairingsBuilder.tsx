"use client";

import { useState } from "react";

type PlayerOption = {
  playerId: string;
  playerName: string;
};

type RoundOption = {
  id: string;
  roundNumber: number;
  name: string;
};

type ExistingGroup = {
  id: string;
  groupNumber: number;
  name: string | null;
  teeTime: string | null;
  playerIds: string[];
};

type EditableGroup = {
  groupNumber: number;
  name: string;
  teeTime: string;
  playerIds: string[];
};

type PairingsBuilderProps = {
  rounds: RoundOption[];
  players: PlayerOption[];
  selectedRoundId: string;
  existingGroups: ExistingGroup[];
};

function emptyGroup(groupNumber: number): EditableGroup {
  return {
    groupNumber,
    name: `Group ${groupNumber}`,
    teeTime: "",
    playerIds: ["", "", "", ""],
  };
}

export default function PairingsBuilder({
  rounds,
  players,
  selectedRoundId,
  existingGroups,
}: PairingsBuilderProps) {
  const [roundId, setRoundId] = useState(selectedRoundId);
  const [groups, setGroups] = useState<EditableGroup[]>(
    existingGroups.length
      ? existingGroups.map((group) => ({
          groupNumber: group.groupNumber,
          name: group.name ?? `Group ${group.groupNumber}`,
          teeTime: group.teeTime ?? "",
          playerIds: [
            group.playerIds[0] ?? "",
            group.playerIds[1] ?? "",
            group.playerIds[2] ?? "",
            group.playerIds[3] ?? "",
          ],
        }))
      : [emptyGroup(1), emptyGroup(2)]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedPlayerIds = groups.flatMap((group) =>
  group.playerIds.filter(Boolean)
);
const assignedPlayerCount = selectedPlayerIds.length;
const duplicateCount = assignedPlayerCount - new Set(selectedPlayerIds).size;
const unassignedPlayerCount = players.length - new Set(selectedPlayerIds).size;
  function updateGroupName(groupNumber: number, name: string) {
    setGroups((current) =>
      current.map((group) =>
        group.groupNumber === groupNumber ? { ...group, name } : group
      )
    );
  }

  function updateGroupPlayer(
    groupNumber: number,
    playerIndex: number,
    playerId: string
  ) {
    setGroups((current) =>
      current.map((group) =>
        group.groupNumber === groupNumber
          ? {
              ...group,
              playerIds: group.playerIds.map((existingPlayerId, index) =>
                index === playerIndex ? playerId : existingPlayerId
              ),
            }
          : group
      )
    );
  }

  function updateTeeTime(groupNumber: number, teeTime: string) {
    setGroups((current) =>
      current.map((group) =>
        group.groupNumber === groupNumber ? { ...group, teeTime } : group
      )
    );
  }

  function addGroup() {
    setGroups((current) => [...current, emptyGroup(current.length + 1)]);
  }

  function removeGroup(groupNumber: number) {
    setGroups((current) =>
      current
        .filter((group) => group.groupNumber !== groupNumber)
        .map((group, index) => ({
          ...group,
          groupNumber: index + 1,
        }))
    );
  }

  async function savePairings() {
  setIsSaving(true);
  setMessage("");

  const usedPlayerIds = groups.flatMap((group) =>
    group.playerIds.filter(Boolean)
  );

  const hasDuplicates = usedPlayerIds.length !== new Set(usedPlayerIds).size;

  if (hasDuplicates) {
    setMessage("Each player can only be assigned to one group.");
    setIsSaving(false);
    return;
  }

    const response = await fetch("/api/admin/groups/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roundId,
        groups,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setMessage("Pairings saved.");
    setIsSaving(false);
    window.location.href = `/admin/groups?roundId=${roundId}`;
  }

  return (
    <div className="mt-8 grid gap-5">
      <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
        <label className="text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
          Round
        </label>

        <select
          value={roundId}
          onChange={(event) => {
            const nextRoundId = event.target.value;
            setRoundId(nextRoundId);
            window.location.href = `/admin/groups?roundId=${nextRoundId}`;
          }}
          className="mt-3 w-full rounded-2xl border border-danvers-border bg-black/30 px-4 py-3 font-bold text-danvers-text"
        >
          {rounds.map((round) => (
            <option key={round.id} value={round.id}>
              Round {round.roundNumber} — {round.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
  <div className="rounded-2xl border border-danvers-border bg-danvers-surface p-4">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
      Players Assigned
    </p>
    <p className="mt-2 text-3xl font-black">
      {assignedPlayerCount}/{players.length}
    </p>
  </div>

  <div className="rounded-2xl border border-danvers-border bg-danvers-surface p-4">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
      Groups Created
    </p>
    <p className="mt-2 text-3xl font-black">{groups.length}</p>
  </div>

  <div
    className={`rounded-2xl border p-4 ${
      duplicateCount > 0
        ? "border-red-900/50 bg-red-950/20"
        : "border-danvers-border bg-danvers-surface"
    }`}
  >
    <p className="text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
      Status
    </p>
    <p className="mt-2 text-xl font-black">
      {duplicateCount > 0
        ? `${duplicateCount} duplicate`
        : unassignedPlayerCount > 0
          ? `${unassignedPlayerCount} unassigned`
          : "Ready"}
    </p>
  </div>
</div>

      {groups.map((group) => (
        <div
          key={group.groupNumber}
          className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
                Group {group.groupNumber}
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {group.name || `Group ${group.groupNumber}`}
              </h2>
            </div>

<div className="flex items-center gap-2">
  <a
    href={`/score-entry?group=${group.groupNumber}`}
    className="rounded-full border border-danvers-green/50 px-4 py-2 text-xs font-black text-danvers-green"
  >
    Score
  </a>

  {groups.length > 1 && (
    <button
      type="button"
      onClick={() => removeGroup(group.groupNumber)}
                className="rounded-full border border-red-900/50 px-4 py-2 text-xs font-black text-red-300"
              >
                Remove
      </button>
  )}
</div>
          </div>

          <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
            Group Name
          </label>

          <input
            type="text"
            value={group.name}
            onChange={(event) =>
              updateGroupName(group.groupNumber, event.target.value)
            }
            placeholder={`Group ${group.groupNumber}`}
            className="mt-2 w-full rounded-2xl border border-danvers-border bg-black/30 px-4 py-3 font-bold text-danvers-text"
          />

          <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
            Tee Time
          </label>

          <input
            type="time"
            value={group.teeTime}
            onChange={(event) =>
              updateTeeTime(group.groupNumber, event.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-danvers-border bg-black/30 px-4 py-3 font-bold text-danvers-text"
          />

          <div className="mt-5 grid gap-3">
            {group.playerIds.map((playerId, index) => (
              <select
                key={index}
                value={playerId}
                onChange={(event) =>
                  updateGroupPlayer(group.groupNumber, index, event.target.value)
                }
                className="w-full rounded-2xl border border-danvers-border bg-black/30 px-4 py-3 font-bold text-danvers-text"
              >
                <option value="">Player {index + 1}</option>
{players.map((player) => {
  const isSelectedElsewhere =
    selectedPlayerIds.includes(player.playerId) &&
    player.playerId !== playerId;

  return (
    <option
      key={player.playerId}
      value={player.playerId}
      disabled={isSelectedElsewhere}
    >
      {player.playerName}
      {isSelectedElsewhere ? " — already selected" : ""}
    </option>
  );
})}
              </select>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="rounded-[2rem] border border-danvers-border bg-black/20 p-5 text-left text-lg font-black text-danvers-text"
      >
        + Add Group
      </button>

      <button
        type="button"
        onClick={savePairings}
        disabled={isSaving}
        className="rounded-[2rem] bg-danvers-gold p-5 text-lg font-black text-black disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Pairings"}
      </button>

      {message ? (
        <p className="text-sm font-bold text-danvers-muted">{message}</p>
      ) : null}
    </div>
  );
}