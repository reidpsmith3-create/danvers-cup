import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCompetitionScoringRule } from "@/lib/scoring/competitionScoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompetitionPageProps = {
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
    ? `Team A ${margin} Up`
    : `Team B ${margin} Up`;
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { data: competition } = await supabase
    .from("competitions")
    .select("*, rounds(round_number, name, status, courses(name))")
    .eq("id", params.id)
    .single();

  if (!competition) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Competition not found</h1>
          <Link href="/competitions" className="mt-4 block text-danvers-muted">
            Back to competitions
          </Link>
        </section>
      </main>
    );
  }

  const scoringRule = getCompetitionScoringRule(competition.format);

  const { data: results } = await supabase
    .from("competition_results")
    .select("id, points, result_label, team_id, player_id, teams(name), players(full_name)")
    .eq("competition_id", competition.id)
    .eq("is_official", true)
    .order("points", { ascending: false });

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", competition.id)
    .order("created_at", { ascending: true });

  const matchIds = matches?.map((match) => match.id) ?? [];

  const { data: matchHoles } =
    matchIds.length > 0
      ? await supabase.from("match_holes").select("*").in("match_id", matchIds)
      : { data: [] };

  const resultRows = (results as any[]) ?? [];
  const teamResults = resultRows.filter((result) => result.team_id);
  const individualResults = resultRows.filter((result) => result.player_id);
  const matchRows = (matches as any[]) ?? [];
  const matchHoleRows = (matchHoles as any[]) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link href="/competitions" className="text-sm font-bold text-danvers-muted">
          ← Back to Competitions
        </Link>

        <div className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Round {competition.rounds?.round_number ?? "—"}
          </p>

          <h1 className="mt-4 text-5xl font-black">{competition.name}</h1>

          <p className="mt-3 text-danvers-muted">
            {competition.rounds?.courses?.name ?? "Course TBD"} ·{" "}
            {scoringRule.label} · {competition.scoring_basis}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Round Status
              </p>
              <p className="mt-2 text-2xl font-black">
                {competition.rounds?.status ?? "scheduled"}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Team Points
              </p>
              <p className="mt-2 text-2xl font-black">
                {competition.counts_for_team_points ? "Yes" : "No"}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Individual Points
              </p>
              <p className="mt-2 text-2xl font-black">
                {competition.counts_for_individual_points ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {teamResults.length ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
            <h2 className="text-3xl font-black">Team Results</h2>

            <div className="mt-5 grid gap-3">
              {teamResults.map((result, index) => (
                <div
                  key={result.id}
                  className="rounded-2xl border border-danvers-border bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">
                        {index + 1}. {result.teams?.name ?? "Team"}
                      </p>
                      <p className="mt-1 text-xs text-danvers-muted">
                        {result.result_label ?? "Official result"}
                      </p>
                    </div>

                    <p className="text-2xl font-black">{result.points}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {individualResults.length ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
            <h2 className="text-3xl font-black">Individual Results</h2>

            <div className="mt-5 grid gap-3">
              {individualResults.map((result, index) => (
                <div
                  key={result.id}
                  className="rounded-2xl border border-danvers-border bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">
                        {index + 1}. {result.players?.full_name ?? "Player"}
                      </p>
                      <p className="mt-1 text-xs text-danvers-muted">
                        {result.result_label ?? "Official result"}
                      </p>
                    </div>

                    <p className="text-2xl font-black">{result.points}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {matchRows.length ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
            <h2 className="text-3xl font-black">Matches</h2>

            <div className="mt-5 grid gap-3">
              {matchRows.map((match) => {
                const holes = matchHoleRows.filter(
                  (hole) => hole.match_id === match.id
                );

                return (
                  <Link
  key={match.id}
  href={`/matches/${match.id}`}
  className="block rounded-2xl border border-danvers-border bg-black/20 p-4 transition hover:border-danvers-green"
>
                    <p className="font-black">
                      {match.team_a_name} vs {match.team_b_name}
                    </p>
                    <p className="mt-1 text-sm text-danvers-muted">
                      {getMatchStatus(holes)} · {holes.length} holes scored
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}