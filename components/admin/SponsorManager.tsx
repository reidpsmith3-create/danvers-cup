"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
};

type SponsorManagerProps = {
  sponsors: Sponsor[];
};

export default function SponsorManager({
  sponsors,
}: SponsorManagerProps) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditingId(null);
    setName("");
    setLogoUrl("");
    setWebsiteUrl("");
    setMessage("");
  }

  function editSponsor(sponsor: Sponsor) {
    setEditingId(sponsor.id);
    setName(sponsor.name);
    setLogoUrl(sponsor.logo_url);
    setWebsiteUrl(sponsor.website_url ?? "");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadLogo(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "sponsors");

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Logo upload failed.");
    }

    return String(result.url);
  }

  async function saveSponsor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      const file = formData.get("logo") as File | null;

      let finalLogoUrl = logoUrl.trim();

      if (file && file.size > 0) {
        finalLogoUrl = await uploadLogo(file);
      }

      if (!finalLogoUrl) {
        throw new Error("Please upload a sponsor logo or enter a logo URL.");
      }

      const response = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          id: editingId,
          name,
          logoUrl: finalLogoUrl,
          websiteUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save sponsor.");
      }

      resetForm();
      setMessage("Sponsor saved successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save sponsor."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteSponsor(sponsor: Sponsor) {
    if (busy) return;

    if (!window.confirm(`Delete sponsor "${sponsor.name}"?`)) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/sponsors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          id: sponsor.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete sponsor.");
      }

      resetForm();
      setMessage("Sponsor deleted.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete sponsor."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={saveSponsor}
        className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">
            {editingId ? "Edit Sponsor" : "Add Sponsor"}
          </h2>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold uppercase tracking-widest text-danvers-gold"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="sponsor-name"
              className="text-xs font-bold uppercase tracking-widest text-danvers-gold"
            >
              Sponsor Name
            </label>

            <input
              id="sponsor-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-danvers-gold"
              placeholder="Sponsor name"
            />
          </div>

          <div>
            <label
              htmlFor="sponsor-logo"
              className="text-xs font-bold uppercase tracking-widest text-danvers-gold"
            >
              Upload Logo
            </label>

            <input
              id="sponsor-logo"
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-danvers-gold file:px-4 file:py-2 file:font-bold file:text-black"
            />

            <p className="mt-2 text-xs text-danvers-muted">
              JPG, PNG, WebP, or GIF. Maximum 5 MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="sponsor-logo-url"
              className="text-xs font-bold uppercase tracking-widest text-danvers-gold"
            >
              Or Enter Logo URL
            </label>

            <input
              id="sponsor-logo-url"
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-danvers-gold"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label
              htmlFor="sponsor-website"
              className="text-xs font-bold uppercase tracking-widest text-danvers-gold"
            >
              Sponsor Website (Optional)
            </label>

            <input
              id="sponsor-website"
              type="url"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-danvers-gold"
              placeholder="https://example.com"
            />
          </div>

          {logoUrl ? (
            <div className="rounded-2xl border border-white/10 bg-transparent p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Sponsor logo preview"
                className="h-24 w-full object-contain"
              />
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-50"
        >
          {busy
            ? "Saving..."
            : editingId
            ? "Update Sponsor"
            : "Add Sponsor"}
        </button>

        {message ? (
          <p className="mt-4 text-center text-sm text-danvers-muted">
            {message}
          </p>
        ) : null}
      </form>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">
          Existing Sponsors ({sponsors.length})
        </h2>

        {sponsors.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-danvers-surface/80 p-5 text-sm text-danvers-muted">
            No sponsors have been added yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5"
              >
                <div className="rounded-2xl bg-transparent p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.name}
                    className="h-28 w-full object-contain"
                  />
                </div>

                <h3 className="mt-4 text-xl font-black">
                  {sponsor.name}
                </h3>

                {sponsor.website_url ? (
                  <a
                    href={sponsor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block truncate text-sm text-danvers-gold underline"
                  >
                    {sponsor.website_url}
                  </a>
                ) : null}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => editSponsor(sponsor)}
                    disabled={busy}
                    className="flex-1 rounded-full border border-danvers-gold px-4 py-2 text-xs font-black uppercase tracking-widest text-danvers-gold disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSponsor(sponsor)}
                    disabled={busy}
                    className="flex-1 rounded-full border border-red-500/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-300 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
