import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MatchPageProps = {
  params: {
    id: string;
  };
};

function getMatchStatus(holes: any[]) {
  const teamAWins = holes.filter((hole) => hole.winning_side === "team_a").length;
  const teamBWins = holes.filter((hole) => hole.winning_side === "team_b").length;
  const margin = Math.abs(teamAWins - teamBWins);

  if (margin === 0) return "All Square";

  return teamAWins > teamBWins
    ? `${margin} Up`
    : `${margin} Down`;
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { data: match } = await supabase
    .from("matches")
    .select("*, competitions(id, name)")
    .eq("id", params.id)
    .single();

  if (!match) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <h1 className="text-4xl font-black">Match not found</h1>
      </main>
    );
  }

  const { data: holes } = await supabase
    .from("match_holes")
    .select("*")
    .eq("match_id", match.id)
    .order("hole_number", { ascending: true });

  const holeRows = (holes as any[]) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href={`/competitions/${match.competitions?.id}`}
          className="text-sm font-bold text-danvers-muted"
        >
          ← Back to Competition
        </Link>

        <div className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            {match.competitions?.name ?? "Match"}
          </p>

          <h1 className="mt-4 text-5xl font-black">
            {match.team_a_name} vs {match.team_b_name}
          </h1>

          <p className="mt-3 text-danvers-muted">
            {holeRows.length} holes scored
          </p>

          <div className="mt-6 rounded-2xl border border-danvers-border bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
              Match Status
            </p>
            <p className="mt-2 text-3xl font-black">
              {getMatchStatus(holeRows)}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
          <h2 className="text-3xl font-black">Hole Results</h2>

          <div className="mt-5 grid gap-3">
            {holeRows.length ? (
              holeRows.map((hole) => (
                <div
                  key={hole.id}
                  className="rounded-2xl border border-danvers-border bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">Hole {hole.hole_number}</p>
                      <p className="mt-1 text-sm text-danvers-muted">
                        {hole.winning_side === "team_a"
                          ? match.team_a_name
                          : hole.winning_side === "team_b"
                            ? match.team_b_name
                            : "Halved"}
                      </p>
                    </div>

                    <p className="text-2xl font-black">
                      {hole.team_a_score ?? "—"} - {hole.team_b_score ?? "—"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-danvers-border bg-black/20 p-4 text-danvers-muted">
                No holes scored yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}