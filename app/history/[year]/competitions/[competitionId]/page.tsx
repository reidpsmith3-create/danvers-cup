import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompetitionArchivePageProps = {
  params: {
    year: string;
    competitionId: string;
  };
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(date: string | null) {
  if (!date) return null;

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CompetitionArchivePage({
  params,
}: CompetitionArchivePageProps) {
  const year = Number(params.year);

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", year)
    .single();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*, rounds(name, round_date, courses(name, city, state))")
    .eq("id", params.competitionId)
    .single();

  const { data: results } = await supabase
    .from("competition_results")
    .select("id, team_id, player_id, points, result_label, teams(name), players(full_name)")
    .eq("competition_id", params.competitionId)
    .eq("is_official", true)
    .order("points", { ascending: false });

  if (!season || !competition) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Competition not found</h1>
          <Link href={`/history/${year}`} className="mt-4 block text-danvers-muted">
            Back to season
          </Link>
        </section>
      </main>
    );
  }

  const round = getSingleRelation(competition.rounds);
  const course = getSingleRelation(round?.courses);
  const resultRows = (results as any[]) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href={`/history/${season.year}`}
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to {season.year}
        </Link>

        <section className="mt-5 rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
            Competition Archive
          </p>

          <h1 className="mt-4 text-5xl font-black">{competition.name}</h1>

          <p className="mt-4 text-sm text-danvers-muted">
            {formatDate(round?.round_date)} · {course?.name ?? "Course TBD"}
          </p>

          <p className="mt-2 text-sm text-danvers-muted">
            {course?.city}, {course?.state}
          </p>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Official Results
          </p>

          <h2 className="mt-2 text-3xl font-black">Final Results</h2>

          <div className="mt-6 grid gap-3">
            {resultRows.length ? (
              resultRows.map((result) => {
                const name =
                  getSingleRelation(result.teams)?.name ??
                  getSingleRelation(result.players)?.full_name ??
                  "Result";

                return (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
                  >
                    <div>
                      <p className="font-black">{name}</p>
                      <p className="mt-1 text-xs text-danvers-muted">
                        {result.result_label ?? "Official result"}
                      </p>
                    </div>

                    <p className="font-black text-danvers-gold">
                      {result.points} pts
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-danvers-muted">
                No official results found for this competition.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}