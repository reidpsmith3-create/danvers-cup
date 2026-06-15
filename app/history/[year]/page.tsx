import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HistorySeasonPageProps = {
  params: {
    year: string;
  };
};

export default async function HistorySeasonPage({
  params,
}: HistorySeasonPageProps) {
  const year = Number(params.year);

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", year)
    .single();

  if (!season) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Season not found</h1>
          <Link href="/history" className="mt-4 block text-danvers-muted">
            Back to history
          </Link>
        </section>
      </main>
    );
  }

  const { data: seasonResult } = await supabase
    .from("season_results")
    .select(
      "*, teams(name), players(full_name)"
    )
    .eq("season_id", season.id)
    .maybeSingle();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("season_id", season.id)
    .order("created_at", { ascending: true });

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: results } =
    competitionIds.length > 0
      ? await supabase
          .from("competition_results")
          .select(
            "id, competition_id, team_id, player_id, points, result_label, teams(name), players(full_name)"
          )
          .in("competition_id", competitionIds)
          .eq("is_official", true)
      : { data: [] };

  const resultRows = (results as any[]) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link href="/history" className="text-sm font-bold text-danvers-muted">
          ← Back to History
        </Link>

        <div className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Danvers Cup Archive
          </p>

          <h1 className="mt-4 text-5xl font-black">{season.year}</h1>

          <p className="mt-3 text-danvers-muted">
            {season.location ?? "Location TBD"}
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-danvers-muted">
              Team Champion
            </p>
            <h2 className="mt-3 text-3xl font-black">
              {seasonResult?.teams?.name ?? "Pending"}
            </h2>
            <p className="mt-2 text-danvers-muted">
              {seasonResult?.team_champion_points ?? "—"} points
            </p>
          </div>

          <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-danvers-muted">
              Individual Champion
            </p>
            <h2 className="mt-3 text-3xl font-black">
              {seasonResult?.players?.full_name ?? "Pending"}
            </h2>
            <p className="mt-2 text-danvers-muted">
              {seasonResult?.individual_champion_points ?? "—"} points
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-3xl font-black">Competition Results</h2>

          <div className="mt-5 grid gap-4">
            {competitions?.length ? (
              competitions.map((competition) => {
                const competitionResults = resultRows.filter(
                  (result) => result.competition_id === competition.id
                );

                return (
                  <div
                    key={competition.id}
                    className="rounded-2xl border border-danvers-border bg-black/20 p-4"
                  >
                    <h3 className="text-xl font-black">{competition.name}</h3>

                    <div className="mt-3 grid gap-2">
                      {competitionResults.length ? (
                        competitionResults.slice(0, 6).map((result) => (
                          <p
                            key={result.id}
                            className="text-sm text-danvers-muted"
                          >
                            {result.teams?.name ??
                              result.players?.full_name ??
                              "Result"}{" "}
                            · {result.points} point(s)
                          </p>
                        ))
                      ) : (
                        <p className="text-sm text-danvers-muted">
                          No official results.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-danvers-muted">
                No competitions found for this season.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}