"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TripInfoSection = {
  id: string;
  eyebrow: string | null;
  title: string;
  body: string | null;
  sort_order: number;
  is_visible: boolean;
};

export default function TripInfoForm({
  seasonId,
  section,
}: {
  seasonId: string;
  section?: TripInfoSection;
}) {
  const router = useRouter();

  const [eyebrow, setEyebrow] = useState(section?.eyebrow ?? "");
  const [title, setTitle] = useState(section?.title ?? "");
  const [body, setBody] = useState(section?.body ?? "");
  const [sortOrder, setSortOrder] = useState(String(section?.sort_order ?? 0));
  const [isVisible, setIsVisible] = useState(section?.is_visible ?? true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveSection() {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/trip-info/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sectionId: section?.id ?? null,
        seasonId,
        eyebrow,
        title,
        body,
        sortOrder,
        isVisible,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setMessage("Saved.");
    setIsSaving(false);

    if (!section?.id) {
      setEyebrow("");
      setTitle("");
      setBody("");
      setSortOrder("0");
      setIsVisible(true);
    }

    router.refresh();
  }

  return (
    <section className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">
        {section ? "Edit Section" : "Add Section"}
      </h2>

      <div className="mt-5 grid gap-4">
        <input
          value={eyebrow}
          onChange={(event) => setEyebrow(event.target.value)}
          placeholder="Eyebrow"
          className="rounded-2xl border border-danvers-border bg-black/30 p-4"
        />

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="rounded-2xl border border-danvers-border bg-black/30 p-4"
        />

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Body"
          rows={7}
          className="rounded-2xl border border-danvers-border bg-black/30 p-4"
        />

        <input
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          placeholder="Sort order"
          inputMode="numeric"
          className="rounded-2xl border border-danvers-border bg-black/30 p-4"
        />

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
          />
          Visible
        </label>

        <button
          type="button"
          onClick={saveSection}
          disabled={isSaving}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Section"}
        </button>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>
    </section>
  );
}