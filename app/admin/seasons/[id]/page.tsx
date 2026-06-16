import Link from "next/link";
import SeasonForm from "@/components/admin/SeasonForm";
import { supabase } from "@/lib/supabase";

type EditSeasonPageProps = {
  params: {
    id: string;
  };
};

export default async function EditSeasonPage({ params }: EditSeasonPageProps) {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!season) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link
            href="/admin/seasons"
            className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
          >
            ← Seasons
          </Link>

          <h1 className="mt-6 text-4xl font-black">Season not found</h1>
        </section>
      </main>
    );
  }

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

          <h1 className="mt-2 text-4xl font-black">Edit Season</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Update season settings for {season.year}.
          </p>
        </div>

        <div className="mt-6">
          <SeasonForm season={season} />
        </div>
      </section>
    </main>
  );
}