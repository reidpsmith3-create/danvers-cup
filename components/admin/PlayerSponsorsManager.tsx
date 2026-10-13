"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
};

type Assignment = {
  sponsor_id: string;
  display_order: number;
};

export default function PlayerSponsorsManager({
  playerId,
  sponsors,
  assignments,
}: {
  playerId: string;
  sponsors: Sponsor[];
  assignments: Assignment[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const ordered = [...assignments].sort(
    (a, b) => a.display_order - b.display_order
  );

  const assignedIds = new Set(assignments.map((a) => a.sponsor_id));

  const available = sponsors.filter(
    (sponsor) => !assignedIds.has(sponsor.id)
  );

  const sponsorById = new Map(
    sponsors.map((sponsor) => [sponsor.id, sponsor])
  );

  async function submit(
    action: "add" | "remove" | "reorder",
    extra: Record<string, unknown>
  ) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/player-sponsors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          playerId,
          ...extra,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update sponsors.");
      }

      setSelectedId("");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update sponsors."
      );
    } finally {
      setBusy(false);
    }
  }

  async function moveSponsor(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= ordered.length) return;

    const ids = ordered.map((assignment) => assignment.sponsor_id);

    [ids[index], ids[target]] = [ids[target], ids[index]];

    await submit("reorder", { sponsorIds: ids });
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
        Sponsorships
      </p>

      <h2 className="mt-2 text-2xl font-black">Player Sponsors</h2>

      <p className="mt-2 text-sm text-danvers-muted">
        Assign sponsors to this player. Their logos will appear in the
        order shown below.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          disabled={busy || available.length === 0}
          className="min-w-0 flex-1 rounded-2xl border border-danvers-border bg-black/30 px-4 py-3 text-sm text-white"
        >
          <option value="">Select a sponsor</option>
          {available.map((sponsor) => (
            <option key={sponsor.id} value={sponsor.id}>
              {sponsor.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={busy || !selectedId}
          onClick={() => submit("add", { sponsorId: selectedId })}
          className="rounded-full bg-danvers-gold px-6 py-3 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50"
        >
          Add Sponsor
        </button>
      </div>

      {sponsors.length === 0 ? (
        <p className="mt-4 text-sm text-danvers-muted">
          No sponsors exist yet. Add them under Admin → Sponsors.
        </p>
      ) : null}

      {ordered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-danvers-border p-5 text-sm text-danvers-muted">
          No sponsors assigned to this player.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {ordered.map((assignment, index) => {
            const sponsor = sponsorById.get(assignment.sponsor_id);

            if (!sponsor) return null;

            return (
              <div
                key={assignment.sponsor_id}
                className="flex flex-col gap-4 rounded-2xl border border-danvers-border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="font-bold">{sponsor.name}</p>
                    <p className="text-xs text-danvers-muted">
                      Position {index + 1}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 sm:ml-auto">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => moveSponsor(index, -1)}
                    className="rounded-full border border-danvers-border px-3 py-2 text-xs font-bold disabled:opacity-30"
                  >
                    ↑ Up
                  </button>

                  <button
                    type="button"
                    disabled={busy || index === ordered.length - 1}
                    onClick={() => moveSponsor(index, 1)}
                    className="rounded-full border border-danvers-border px-3 py-2 text-xs font-bold disabled:opacity-30"
                  >
                    ↓ Down
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      submit("remove", {
                        sponsorId: assignment.sponsor_id,
                      })
                    }
                    className="rounded-full border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {message ? (
        <p className="mt-4 text-sm text-red-300">{message}</p>
      ) : null}
    </section>
  );
}
