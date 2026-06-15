import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HistoryPage() {
  const { data: seasons } = await supabase
    .from("seasons")
    .select("*")
    .order("year", { ascending: false });

  const { data: seasonResults } = await supabase
    .from("season_results")
    .select(
      "id, season_id, team_champion_points, individual_champion_points, is_final, finalized_at, seasons(year), teams(name), players(full_name)"
    )
    .order("finalized_at", { ascending: false });

  const resultBySeasonId = new Map(
    ((seasonResults as any[]) ?? []).map((result) => [
      result.season_id,
      result,
    ])
  );

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Danvers Cup
          </p>

          <h1 className="mt-4 text-5xl font-black">History</h1>

          <p className="mt-3 text-danvers-muted">
            Champions, season archives, and Danvers Cup records.
          </p>
        </div>

        <section className="mt-8">
          <h2 className="text-3xl font-black">Champions</h2>

          <div className="mt-5 grid gap-4">
            {seasonResults?.length ? (
              seasonResults.map((result: any) => (
                <div
                  key={result.id}
                  className="rounded-3xl border border-danvers-border bg-danvers-surface p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                    {result.seasons?.year ?? "Season"}
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-danvers-muted">
                        Team Champion
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {result.teams?.name ?? "Pending"}
                      </h3>
                      <p className="mt-1 text-sm text-danvers-muted">
                        {result.team_champion_points ?? "—"} points
                      </p>
                    </div>

                    <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-danvers-muted">
                        Individual Champion
                      </p>
                      <h3 className="mt-2 text-2xl font-black">
                        {result.players?.full_name ?? "Pending"}
                      </h3>
                      <p className="mt-1 text-sm text-danvers-muted">
                        {result.individual_champion_points ?? "—"} points
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
                <h3 className="text-2xl font-black">
                  No finalized seasons yet
                </h3>
                <p className="mt-2 text-danvers-muted">
                  Finalized champions will appear here after the season is
                  locked from the admin page.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-black">Season Archive</h2>

          <div className="mt-5 grid gap-4">
            {seasons?.length ? (
              seasons.map((season: any) => {
                const result = resultBySeasonId.get(season.id);

                return (
                  <Link
  key={season.id}
  href={`/history/${season.year}`}
  className="block rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                          Season
                        </p>

                        <h3 className="mt-2 text-3xl font-black">
                          {season.year}
                        </h3>

                        <p className="mt-1 text-sm text-danvers-muted">
                          {season.location ?? "Location TBD"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-danvers-muted">
                          {result?.is_final ? "Final" : season.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
                <h3 className="text-2xl font-black">No seasons found</h3>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}