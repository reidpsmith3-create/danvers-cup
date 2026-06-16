"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Player = {
  id: string;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
};

type SeasonPlayer = {
  id: string;
  handicap: number | null;
} | null;

export default function PlayerProfileForm({
  player,
  seasonPlayer,
}: {
  player: Player;
  seasonPlayer: SeasonPlayer;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadPhoto(file: File) {
    const extension = file.name.split(".").pop();
    const path = `players/${player.id}-${Date.now()}.${extension}`;

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
      const photo = formData.get("photo") as File | null;

      let photoUrl = player.photo_url ?? "";

      if (photo && photo.size > 0) {
        photoUrl = await uploadPhoto(photo);
      }

      const response = await fetch("/api/admin/players/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.id,
          seasonPlayerId: seasonPlayer?.id ?? null,
          full_name: formData.get("full_name"),
          bio: formData.get("bio"),
          handicap: formData.get("handicap"),
          photoUrl,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setMessage(result.error ?? "Something went wrong saving the player.");
        setSaving(false);
        return;
      }

      setMessage("Player updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading the player photo."
      );
    }

    setSaving(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
      className="space-y-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5"
    >
      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Player Photo</h2>

        {player.photo_url ? (
          <div className="mt-4 h-40 w-40 overflow-hidden rounded-[2rem] border border-danvers-gold/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={player.photo_url}
              alt={player.full_name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <input
          name="photo"
          type="file"
          accept="image/*"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-danvers-gold file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.15em] file:text-black"
        />
      </section>

      <section className="space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Full Name
          </label>

          <input
            name="full_name"
            defaultValue={player.full_name}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Handicap
          </label>

          <input
            name="handicap"
            type="number"
            step="0.1"
            defaultValue={seasonPlayer?.handicap ?? ""}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Bio
          </label>

          <textarea
            name="bio"
            defaultValue={player.bio ?? ""}
            rows={6}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-danvers-gold"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Player"}
      </button>

      {message ? (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}