"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Course = {
  id?: string;
  name: string | null;
  city: string | null;
  state: string | null;
  website_url: string | null;
  logo_url: string | null;
};

export default function CourseForm({ course }: { course?: Course }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadLogo(file: File) {
    const extension = file.name.split(".").pop();
    const path = `courses/${course?.id ?? "new"}-${Date.now()}.${extension}`;

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

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage("");

    try {
      const logo = formData.get("logo") as File | null;
      let logoUrl = course?.logo_url ?? "";

      if (logo && logo.size > 0) {
        logoUrl = await uploadLogo(logo);
      }

      const response = await fetch("/api/admin/courses/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: course?.id ?? null,
          name: formData.get("name"),
          city: formData.get("city"),
          state: formData.get("state"),
          websiteUrl: formData.get("website_url"),
          logoUrl,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setMessage(result.error ?? "Something went wrong saving the course.");
        setSaving(false);
        return;
      }

      const result = await response.json();
      setMessage("Course saved.");
      setSaving(false);

      if (result.courseId) {
        router.push(`/admin/courses/${result.courseId}`);
        router.refresh();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong uploading the course logo."
      );
      setSaving(false);
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
      <section className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
        <h2 className="text-2xl font-black">Course Logo</h2>

        {course?.logo_url ? (
          <div className="mt-4 h-40 w-40 overflow-hidden rounded-[2rem] border border-danvers-gold/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.logo_url}
              alt={course.name ?? "Course logo"}
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
        <h2 className="text-2xl font-black">Course Details</h2>

        <input
          name="name"
          required
          placeholder="Course name"
          defaultValue={course?.name ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />

        <input
          name="city"
          placeholder="City"
          defaultValue={course?.city ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />

        <input
          name="state"
          placeholder="State"
          defaultValue={course?.state ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />

        <input
          name="website_url"
          placeholder="Website URL"
          defaultValue={course?.website_url ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-danvers-gold"
        />
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Course"}
      </button>

      {message ? (
        <p className="text-center text-sm font-semibold text-danvers-muted">
          {message}
        </p>
      ) : null}
    </form>
  );
}