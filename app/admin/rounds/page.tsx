import RoundStatusButton from "@/components/admin/RoundStatusButton";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRoundsPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, courses(name)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>

          <h1 className="mt-4 text-5xl font-black">Rounds</h1>

          <p className="mt-3 text-danvers-muted">
            Set which round is scheduled, live, or complete.
          </p>
        </div>

        <section className="mt-8 grid gap-4">
          {rounds?.map((round) => (
            <div
              key={round.id}
              className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                    Round {round.round_number}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">{round.name}</h2>

                  <p className="mt-2 text-sm text-danvers-muted">
                    {round.courses?.name ?? "Course TBD"}
                  </p>

                  <p className="mt-1 text-sm text-danvers-muted">
                    {round.round_date} · {round.tee_time}
                  </p>
                </div>

                <div className="rounded-xl bg-black/30 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
                  {round.status}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <RoundStatusButton
                  roundId={round.id}
                  status="scheduled"
                  label="Set Scheduled"
                />
                <RoundStatusButton
                  roundId={round.id}
                  status="live"
                  label="Set Live"
                />
                <RoundStatusButton
                  roundId={round.id}
                  status="complete"
                  label="Set Complete"
                />
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}