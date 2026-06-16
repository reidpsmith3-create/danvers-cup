"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

type HomepageSettings = {
  id: string;
  eyebrow: string | null;
  title: string | null;
  location: string | null;
  dates: string | null;
  scheduled_title: string | null;
  scheduled_subtitle: string | null;
  live_title: string | null;
  live_subtitle: string | null;
  next_up_label: string | null;
  live_leaders_title: string | null;
  empty_leaders_title: string | null;
  empty_leaders_body: string | null;
  field_title: string | null;
  rounds_count: string | null;
  players_count: string | null;
  cup_count: string | null;
  history_title: string | null;
  history_body: string | null;
  history_button_label: string | null;
  hero_image_url: string | null;
  next_round_image_url: string | null;
  history_image_url: string | null;
};

type DefendingSeason = {
  id: string;
  year: number;
  team_champion_name: string | null;
  individual_champion_name: string | null;
};

export default function HomepageSettingsForm({
  settings,
  defendingSeason,
}: {
  settings: HomepageSettings;
  defendingSeason: DefendingSeason | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadImage(file: File, label: string) {
    const extension = file.name.split(".").pop();
    const path = `homepage/${label}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);

    return data.publicUrl;
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage("");

    try {
      const heroImage = formData.get("hero_image") as File | null;
      const nextRoundImage = formData.get("next_round_image") as File | null;
      const historyImage = formData.get("history_image") as File | null;

      const payload: Record<string, string> = {};

      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          payload[key] = value;
        }
      }

      payload.hero_image_url = settings.hero_image_url ?? "";
      payload.next_round_image_url = settings.next_round_image_url ?? "";
      payload.history_image_url = settings.history_image_url ?? "";

      if (heroImage && heroImage.size > 0) {
        payload.hero_image_url = await uploadImage(heroImage, "hero");
      }

      if (nextRoundImage && nextRoundImage.size > 0) {
        payload.next_round_image_url = await uploadImage(
          nextRoundImage,
          "next-round"
        );
      }

      if (historyImage && historyImage.size > 0) {
        payload.history_image_url = await uploadImage(historyImage, "history");
      }

      const response = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setMessage("Something went wrong saving the homepage.");
        setSaving(false);
        return;
      }

      setMessage("Homepage updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading an image."
      );
    }

    setSaving(false);
  }

  const fields = [
    ["eyebrow", "Eyebrow"],
    ["title", "Homepage Title"],
    ["location", "Location"],
    ["dates", "Dates"],
    ["scheduled_title", "Scheduled Status Title"],
    ["scheduled_subtitle", "Scheduled Status Subtitle"],
    ["live_title", "Live Status Title"],
    ["live_subtitle", "Live Status Subtitle"],
    ["next_up_label", "Next Up Label"],
    ["live_leaders_title", "Live Leaders Title"],
    ["empty_leaders_title", "Empty Leaders Title"],
    ["empty_leaders_body", "Empty Leaders Body"],
    ["field_title", "Tournament Field Title"],
    ["rounds_count", "Rounds Count"],
    ["players_count", "Players Count"],
    ["cup_count", "Cup Count"],
    ["history_title", "History Title"],
    ["history_body", "History Body"],
    ["history_button_label", "History Button Label"],
  ] as const;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-6"
    >
      {defendingSeason ? (
        <section className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
          <h2 className="text-2xl font-black">
            Defending Champions
          </h2>

          <p className="mt-2 text-sm text-danvers-muted">
            Edit the champion names for the most recent completed season:{" "}
            {defendingSeason.year}.
          </p>

          <input
            type="hidden"
            name="defending_season_id"
            value={defendingSeason.id}
          />

          <div className="mt-5 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                Team Champion
              </label>

              <input
                name="team_champion_name"
                defaultValue={defendingSeason.team_champion_name ?? ""}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                Individual Champion
              </label>

              <input
                name="individual_champion_name"
                defaultValue={defendingSeason.individual_champion_name ?? ""}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Homepage Images</h2>
        <p className="mt-2 text-sm text-danvers-muted">
          Upload images for the homepage hero, next round card, and history
          card.
        </p>

        <div className="mt-5 space-y-5">
          {(
            [
              ["hero_image", "Hero Image", settings.hero_image_url],
              [
                "next_round_image",
                "Next Round Image",
                settings.next_round_image_url,
              ],
              ["history_image", "History Image", settings.history_image_url],
            ] as [string, string, string | null][]
          ).map(([name, label, currentUrl]) => (
            <div key={name}>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                {label}
              </label>

              {currentUrl ? (
                <div
                  className="mt-3 h-36 rounded-2xl border border-white/10 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.65)), url(${currentUrl})`,
                  }}
                />
              ) : null}

              <input
                name={name}
                type="file"
                accept="image/*"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-danvers-gold file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.15em] file:text-black"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        {fields.map(([name, label]) => (
          <div key={name}>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
              {label}
            </label>

            <input
              name={name}
              defaultValue={settings[name] ?? ""}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
            />
          </div>
        ))}
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Homepage"}
      </button>

      {message && (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      )}
    </form>
  );
}