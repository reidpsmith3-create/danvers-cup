import { supabase } from "@/lib/supabase";

export default async function SchedulePage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, courses(name, city, state)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            2026
          </p>

          <h1 className="mt-4 text-5xl font-black">Schedule</h1>

          <p className="mt-3 max-w-2xl text-danvers-muted">
            Three rounds across Myrtle Beach. One cup on the line.
          </p>
        </div>

        <section className="mt-8 grid gap-4">
          {rounds?.map((round) => (
            <article
              key={round.id}
              className="overflow-hidden rounded-3xl border border-danvers-border bg-danvers-surface"
            >
              <div className="h-1 bg-danvers-green" />

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                      Round {round.round_number}
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      {round.name}
                    </h2>

                    <p className="mt-3 text-danvers-muted">
                      {round.courses?.name}
                    </p>

                    <p className="text-sm text-danvers-muted">
                      {round.courses?.city}, {round.courses?.state}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      {round.round_date}
                    </p>

                    <p className="mt-1 text-lg font-black text-danvers-text">
                      {round.tee_time}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}