import { supabase } from "@/lib/supabase";

export default async function Home() {
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
    <main className="min-h-screen overflow-hidden px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6 shadow-2xl shadow-black/50 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-danvers-green/20 blur-3xl" />
          <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex rounded-full border border-danvers-gold/40 bg-danvers-gold/10 px-4 py-2">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-gold">
                Danvers Cup
              </p>
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-none tracking-tight sm:text-7xl">
              {season?.name ?? "Danvers Cup"}
            </h1>

            <p className="mt-4 text-lg font-medium text-danvers-muted sm:text-xl">
              {season?.location ?? "Myrtle Beach, South Carolina"}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Dates
                </p>
                <p className="mt-2 text-xl font-bold text-danvers-gold">
                  Oct. 22–26
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Field
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  8 Players
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                  Format
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  3 Rounds
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-3xl border border-danvers-gold/30 bg-gradient-to-r from-danvers-green/25 to-danvers-gold/10 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-danvers-gold">
                Countdown
              </p>
              <p className="mt-2 text-3xl font-black sm:text-4xl">
                Myrtle Beach Awaits
              </p>
              <p className="mt-2 text-sm leading-6 text-danvers-muted">
                Three rounds. Two teams. One long weekend for the cup.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-danvers-green/30 bg-danvers-surface/80 p-5 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-danvers-gold">
              Defending Champion
            </p>
            <h2 className="mt-4 text-2xl font-black">Coming Soon</h2>
            <p className="mt-2 text-sm text-danvers-muted">
              The reigning individual champion will be featured here.
            </p>
          </div>

          <div className="rounded-3xl border border-danvers-green/30 bg-danvers-surface/80 p-5 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-danvers-gold">
              Team Champion
            </p>
            <h2 className="mt-4 text-2xl font-black">Coming Soon</h2>
            <p className="mt-2 text-sm text-danvers-muted">
              The defending team champions will be archived here.
            </p>
          </div>

          <div className="rounded-3xl border border-danvers-green/30 bg-danvers-surface/80 p-5 shadow-xl shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-danvers-gold">
              2026 Cup
            </p>
            <h2 className="mt-4 text-2xl font-black">Myrtle Beach</h2>
            <p className="mt-2 text-sm text-danvers-muted">
              Caledonia. King&apos;s North. Prestwick. A three-day test.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Schedule
            </p>
            <h2 className="mt-2 text-3xl font-black">2026 Rounds</h2>
          </div>

          <div className="grid gap-4">
            {rounds?.map((round) => (
              <article
                key={round.id}
                className="group overflow-hidden rounded-3xl border border-danvers-green/30 bg-gradient-to-br from-danvers-surface to-black/40 shadow-xl shadow-black/20"
              >
                <div className="h-1 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

                <div className="p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
                  <div>
                    <div className="inline-flex rounded-full bg-danvers-green/20 px-3 py-1">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                        Round {round.round_number}
                      </p>
                    </div>

                    <h3 className="mt-4 text-2xl font-black">
                      {round.name}
                    </h3>

                    <p className="mt-2 text-sm font-medium text-danvers-muted">
                      {round.courses?.name}
                    </p>

                    <p className="mt-1 text-sm text-danvers-muted">
                      {round.courses?.city}, {round.courses?.state}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-left sm:mt-0 sm:min-w-40 sm:text-right">
                    <p className="text-sm font-bold text-white">
                      {round.round_date}
                    </p>
                    <p className="mt-1 text-lg font-black text-danvers-gold">
                      {round.tee_time}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-danvers-gold/25 bg-gradient-to-br from-danvers-green/20 via-danvers-surface to-black p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            History
          </p>
          <h2 className="mt-3 text-3xl font-black">History Lives Here</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-danvers-muted">
            Past champions, record books, player profiles, photo albums, and
            trip recaps will live here as the Danvers Cup archive grows.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {["Champions", "Records", "Photos", "Recaps"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-bold">{item}</p>
                <p className="mt-1 text-xs text-danvers-muted">
                  Coming soon
                </p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}