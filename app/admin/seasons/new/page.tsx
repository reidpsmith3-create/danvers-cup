import Link from "next/link";
import SeasonForm from "@/components/admin/SeasonForm";

export default function NewSeasonPage() {
  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/seasons"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Seasons
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">New Season</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Create a new yearly Danvers Cup season.
          </p>
        </div>

        <div className="mt-6">
          <SeasonForm />
        </div>
      </section>
    </main>
  );
}