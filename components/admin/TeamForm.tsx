"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Team = {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
};

type Player = {
  id: string;
  full_name: string;
  photo_url: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function TeamForm({
  team,
  players,
  selectedPlayerIds,
}: {
  team: Team;
  players: Player[];
  selectedPlayerIds: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadLogo(file: File) {
    const extension = file.name.split(".").pop();
    const path = `teams/${team.id}-${Date.now()}.${extension}`;

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
      const logo = formData.get("logo") as File | null;
      const rosterPlayerIds = formData
        .getAll("roster_player_ids")
        .map((value) => String(value));

      let logoUrl = team.logo_url ?? "";

      if (logo && logo.size > 0) {
        logoUrl = await uploadLogo(logo);
      }

      const response = await fetch("/api/admin/teams/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          name: formData.get("name"),
          color: formData.get("color"),
          logoUrl,
          rosterPlayerIds,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setMessage(result.error ?? "Something went wrong saving the team.");
        setSaving(false);
        return;
      }

      setMessage("Team updated.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading the team logo."
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
        <h2 className="text-2xl font-black">Team Logo</h2>

        {team.logo_url ? (
          <div className="mt-4 h-40 w-40 overflow-hidden rounded-[2rem] border border-danvers-gold/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team.logo_url}
              alt={team.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <input
          name="logo"
          type="file"
          accept="image/*"
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-danvers-gold file:px-4 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-[0.15em] file:text-black"
        />
      </section>

      <section className="space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Team Details</h2>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Team Name
          </label>

          <input
            name="name"
            defaultValue={team.name}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
            Team Color
          </label>

          <input
            name="color"
            type="color"
            defaultValue={team.color ?? "#1f7a4d"}
            className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Roster</h2>

        <p className="mt-2 text-sm leading-6 text-danvers-muted">
          Select the players assigned to this team for the current season.
        </p>

        <div className="mt-5 grid gap-3">
          {players.map((player) => (
            <label
              key={player.id}
              className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <input
                name="roster_player_ids"
                type="checkbox"
                value={player.id}
                defaultChecked={selectedPlayerIds.includes(player.id)}
                className="h-5 w-5 accent-danvers-gold"
              />

              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-danvers-gold/30 bg-danvers-green/20 text-sm font-black text-danvers-gold">
                {player.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.photo_url}
                    alt={player.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(player.full_name)
                )}
              </div>

              <span className="font-bold text-white">{player.full_name}</span>
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Team"}
      </button>

      {message ? (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}