import Link from "next/link";
import RoundCreateForm from "@/components/admin/RoundCreateForm";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  name: string;
};

export default async function NewRoundPage() {
  const season = await getCurrentSeason();

  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", { ascending: true });

  const courses = (coursesData as Course[] | null) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/rounds"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Rounds
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">New Round</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Add a round for {season?.year ?? "the current season"}.
          </p>
        </div>

        <div className="mt-6">
          <RoundCreateForm seasonId={season?.id ?? ""} courses={courses} />
        </div>
      </section>
    </main>
  );
}