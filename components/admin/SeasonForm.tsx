"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Season = {
  id?: string;
  year: number | null;
  name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  team_champion_name: string | null;
  individual_champion_name: string | null;
  total_team_points_available: number | null;
  team_points_needed_to_win: number | null;
};

export default function SeasonForm({ season }: { season?: Season }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/seasons/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: season?.id ?? null,
        year: formData.get("year"),
        name: formData.get("name"),
        location: formData.get("location"),
        startDate: formData.get("start_date"),
        endDate: formData.get("end_date"),
        status: formData.get("status"),
        teamChampionName: formData.get("team_champion_name"),
        individualChampionName: formData.get("individual_champion_name"),
totalTeamPointsAvailable: formData.get("total_team_points_available"),
teamPointsNeededToWin: formData.get("team_points_needed_to_win"),
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error ?? "Something went wrong saving the season.");
      setSaving(false);
      return;
    }

    const result = await response.json();

    setMessage("Season saved.");
    setSaving(false);

    if (result.seasonId) {
      router.push(`/admin/seasons/${result.seasonId}`);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5"
    >
      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Season Details</h2>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Year
          </label>

          <input
            name="year"
            type="number"
            required
            defaultValue={season?.year ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Name
          </label>

          <input
            name="name"
            required
            defaultValue={season?.name ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Location
          </label>

          <input
            name="location"
            defaultValue={season?.location ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
              Start Date
            </label>

            <input
              name="start_date"
              type="date"
              defaultValue={season?.start_date ?? ""}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
              End Date
            </label>

            <input
              name="end_date"
              type="date"
              defaultValue={season?.end_date ?? ""}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Status
          </label>

          <select
            name="status"
            defaultValue={season?.status ?? "upcoming"}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          >
            <option value="upcoming">upcoming</option>
            <option value="active">active</option>
            <option value="complete">complete</option>
          </select>
        </div>
      </section>

      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Champions</h2>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Team Champion Name
          </label>

          <input
            name="team_champion_name"
            defaultValue={season?.team_champion_name ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Individual Champion Name
          </label>

          <input
            name="individual_champion_name"
            defaultValue={season?.individual_champion_name ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>
</section>

<section className="space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5">
  <h2 className="text-2xl font-black">Tournament Points</h2>

  <div>
    <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
      Total Team Points Available
    </label>

    <input
      name="total_team_points_available"
      type="number"
      step="0.5"
      defaultValue={season?.total_team_points_available ?? ""}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
    />

    <p className="mt-2 text-xs text-danvers-muted">
      Total number of team points available across the entire Danvers Cup.
    </p>
  </div>

  <div>
    <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
      Team Points Needed To Win
    </label>

    <input
      name="team_points_needed_to_win"
      type="number"
      step="0.5"
      defaultValue={season?.team_points_needed_to_win ?? ""}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
    />

    <p className="mt-2 text-xs text-danvers-muted">
      Number of points required to clinch the Cup. Usually half the available
      points plus 0.5 (example: 20 points available = 10.5 needed to win).
    </p>
  </div>
</section>

<button
  type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Season"}
      </button>

      {message ? (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}