"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Course = {
  id: string;
  name: string;
};

export default function RoundCreateForm({
  seasonId,
  courses,
}: {
  seasonId: string;
  courses: Course[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/rounds/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seasonId,
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
      setMessage(result.error ?? "Something went wrong creating the round.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/admin/rounds");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Round Number
          </label>
          <input
            name="round_number"
            type="number"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Status
          </label>
          <select
            name="status"
            defaultValue="scheduled"
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
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
          Course
        </label>
        <select
          name="course_id"
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
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Creating..." : "Create Round"}
      </button>

      {message ? (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}