"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ScheduleEvent = {
  id?: string;
  season_id: string;
  title: string | null;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  event_type: string | null;
  is_visible: boolean | null;
};

export default function ScheduleEventForm({
  seasonId,
  event,
}: {
  seasonId: string;
  event?: ScheduleEvent;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/schedule-events/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: event?.id ?? null,
        seasonId,
        title: formData.get("title"),
        description: formData.get("description"),
        eventDate: formData.get("event_date"),
        eventTime: formData.get("event_time"),
        location: formData.get("location"),
        eventType: formData.get("event_type"),
        isVisible: formData.get("is_visible") === "on",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong saving the event.");
      setSaving(false);
      return;
    }

    setMessage("Event saved.");
    setSaving(false);

    if (result.eventId) {
      router.push(`/admin/schedule-events/${result.eventId}`);
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={(eventSubmit) => {
        eventSubmit.preventDefault();
        handleSubmit(new FormData(eventSubmit.currentTarget));
      }}
      className="space-y-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5"
    >
      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Event Details</h2>

        <input
          name="title"
          required
          placeholder="Dinner at..."
          defaultValue={event?.title ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />

        <textarea
          name="description"
          placeholder="Optional notes"
          defaultValue={event?.description ?? ""}
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-danvers-gold"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <input
            name="event_date"
            type="date"
            defaultValue={event?.event_date ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />

          <input
            name="event_time"
            type="time"
            defaultValue={event?.event_time?.slice(0, 5) ?? ""}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <input
          name="location"
          placeholder="Location"
          defaultValue={event?.location ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />

        <select
          name="event_type"
          defaultValue={event?.event_type ?? "social"}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        >
          <option value="arrival">Arrival</option>
          <option value="meal">Meal</option>
          <option value="social">Social</option>
          <option value="travel">Travel</option>
          <option value="pairings">Pairings</option>
          <option value="other">Other</option>
        </select>

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            name="is_visible"
            type="checkbox"
            defaultChecked={event?.is_visible ?? true}
            className="h-5 w-5 accent-danvers-gold"
          />
          Visible on public schedule
        </label>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Event"}
      </button>

      {message ? (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}