import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Season = {
  id: string;
  year: number;
  name: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

export default async function AdminSeasonsPage() {
  const { data } = await supabase
    .from("seasons")
    .select("id, year, name, location, start_date, end_date, status")
    .order("year", { ascending: false });

  const seasons = (data as Season[] | null) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Admin
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6 shadow-xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Seasons</h1>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Create and manage yearly Danvers Cup seasons.
          </p>

          <Link
            href="/admin/seasons/new"
            className="mt-5 inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
          >
            New Season
          </Link>
        </div>

        <section className="mt-6 grid gap-4">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/admin/seasons/${season.id}`}
              className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5 transition hover:border-danvers-gold"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-gold">
                    {season.status}
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {season.year} · {season.name}
                  </h2>

                  <p className="mt-2 text-sm text-danvers-muted">
                    {season.location ?? "Location TBD"}
                  </p>
                </div>

                <div className="text-right text-sm text-danvers-muted">
                  <p>{season.start_date ?? "Start TBD"}</p>
                  <p>{season.end_date ?? "End TBD"}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}