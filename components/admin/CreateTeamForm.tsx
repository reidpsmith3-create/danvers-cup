"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTeamForm({ seasonId }: { seasonId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#1f7a4d");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function createTeam() {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/teams/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ seasonId, name, color }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    router.push(`/admin/teams/${result.teamId}`);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5">
      <div>
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
          Team Name
        </label>

        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
          Team Color
        </label>

        <input
          value={color}
          onChange={(event) => setColor(event.target.value)}
          type="color"
          className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
        />
      </div>

      <button
        type="button"
        onClick={createTeam}
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create Team"}
      </button>

      {message ? <p className="text-sm font-bold text-red-300">{message}</p> : null}
    </div>
  );
}