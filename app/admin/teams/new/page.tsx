import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function NewTeamPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["upcoming", "active"])
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/teams"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Teams
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">New Team</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Create a season-specific team for {season?.year ?? "the current season"}.
          </p>
        </div>

        <form
          action="/api/admin/teams/create"
          method="POST"
          className="mt-6 space-y-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5"
        >
          <input type="hidden" name="seasonId" value={season?.id ?? ""} />

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
              Team Name
            </label>

            <input
              name="name"
              required
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
              defaultValue="#1f7a4d"
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
          >
            Create Team
          </button>
        </form>
      </section>
    </main>
  );
}