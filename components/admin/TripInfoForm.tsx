"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TripInfoSection = {
  id: string;
  eyebrow: string | null;
  title: string;
  body: string | null;
  image_url: string | null;
  primary_button_label: string | null;
  primary_button_url: string | null;
  secondary_button_label: string | null;
  secondary_button_url: string | null;
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
  const [imageUrl, setImageUrl] = useState(section?.image_url ?? "");
  const [primaryButtonLabel, setPrimaryButtonLabel] = useState(
    section?.primary_button_label ?? ""
  );
  const [primaryButtonUrl, setPrimaryButtonUrl] = useState(
    section?.primary_button_url ?? ""
  );
  const [secondaryButtonLabel, setSecondaryButtonLabel] = useState(
    section?.secondary_button_label ?? ""
  );
  const [secondaryButtonUrl, setSecondaryButtonUrl] = useState(
    section?.secondary_button_url ?? ""
  );
  const [sortOrder, setSortOrder] = useState(String(section?.sort_order ?? 0));
  const [isVisible, setIsVisible] = useState(section?.is_visible ?? true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function uploadImage(file: File) {
    const extension = file.name.split(".").pop();
    const path = `trip-info/${section?.id ?? "new"}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveSection(formData: FormData) {
    setIsSaving(true);
    setMessage("");

    try {
      const image = formData.get("image") as File | null;
      let finalImageUrl = imageUrl;

      if (image && image.size > 0) {
        finalImageUrl = await uploadImage(image);
        setImageUrl(finalImageUrl);
      }

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
          imageUrl: finalImageUrl,
          primaryButtonLabel,
          primaryButtonUrl,
          secondaryButtonLabel,
          secondaryButtonUrl,
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
        setImageUrl("");
        setPrimaryButtonLabel("");
        setPrimaryButtonUrl("");
        setSecondaryButtonLabel("");
        setSecondaryButtonUrl("");
        setSortOrder("0");
        setIsVisible(true);
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        saveSection(new FormData(event.currentTarget));
      }}
      className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6"
    >
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
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Image URL"
          className="rounded-2xl border border-danvers-border bg-black/30 p-4"
        />

        {imageUrl ? (
          <div className="overflow-hidden rounded-[2rem] border border-danvers-gold/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title || "Trip info image"}
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}

        <input
          name="image"
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-danvers-border bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-danvers-gold file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.15em] file:text-black"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={primaryButtonLabel}
            onChange={(event) => setPrimaryButtonLabel(event.target.value)}
            placeholder="Primary button label"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4"
          />

          <input
            value={primaryButtonUrl}
            onChange={(event) => setPrimaryButtonUrl(event.target.value)}
            placeholder="Primary button URL"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={secondaryButtonLabel}
            onChange={(event) => setSecondaryButtonLabel(event.target.value)}
            placeholder="Secondary button label"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4"
          />

          <input
            value={secondaryButtonUrl}
            onChange={(event) => setSecondaryButtonUrl(event.target.value)}
            placeholder="Secondary button URL"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4"
          />
        </div>

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
          type="submit"
          disabled={isSaving}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Section"}
        </button>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>
    </form>
  );
}