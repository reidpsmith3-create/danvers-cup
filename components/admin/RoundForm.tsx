"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Course = {
  id: string;
  name: string;
};

type Round = {
  id: string;
  round_number: number;
  name: string;
  course_id: string | null;
  round_date: string | null;
  tee_time: string | null;
  status: string;
};

export default function RoundForm({
  round,
  courses,
}: {
  round: Round;
  courses: Course[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/rounds/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roundId: round.id,
        roundNumber: formData.get("round_number"),
        name: formData.get("name"),
        courseId: formData.get("course_id"),
        roundDate: formData.get("round_date"),
        teeTime: formData.get("tee_time"),
        status: formData.get("status"),
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      setMessage(result.error ?? "Something went wrong saving the round.");
      setSaving(false);
      return;
    }

    setMessage("Round updated.");
    setSaving(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="mt-5 grid gap-4 rounded-3xl border border-white/10 bg-black/20 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Round Number
          </label>

          <input
            name="round_number"
            type="number"
            defaultValue={round.round_number}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Status
          </label>

          <select
            name="status"
            defaultValue={round.status}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          >
            <option value="scheduled">scheduled</option>
            <option value="live">live</option>
            <option value="complete">complete</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
          Round Name
        </label>

        <input
          name="name"
          defaultValue={round.name}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
          Course
        </label>

        <select
          name="course_id"
          defaultValue={round.course_id ?? ""}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        >
          <option value="">Course TBD</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Round Date
          </label>

          <input
            name="round_date"
            type="date"
            defaultValue={round.round_date ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Tee Time
          </label>

          <input
            name="tee_time"
            type="time"
            defaultValue={round.tee_time?.slice(0, 5) ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Round"}
      </button>

      {message ? (
        <p className="text-sm font-semibold text-danvers-muted">{message}</p>
      ) : null}
    </form>
  );
}