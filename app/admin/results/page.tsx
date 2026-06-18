import ResultsForm from "@/components/admin/ResultsForm";
import DeleteResultButton from "@/components/admin/DeleteResultButton";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";
import FinalizeCompetitionResultsButton from "@/components/admin/FinalizeCompetitionResultsButton";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

export default async function AdminResultsPage() {
  const season = await getCurrentSeason();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: matches } =
    competitionIds.length > 0
      ? await supabase
          .from("matches")
          .select("id, competition_id")
          .in("competition_id", competitionIds)
      : { data: [] };

  const competitionsWithMatches = new Set(
    ((matches as any[]) ?? []).map((match) => match.competition_id)
  );

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("season_id", season?.id)
    .order("name", { ascending: true });

  const { data: players } = await supabase
    .from("season_players")
    .select("player_id, players(id, full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const { data: results } =
    competitionIds.length > 0
      ? await supabase
          .from("competition_results")
          .select(
            "id, competition_id, points, result_label, is_official, team_id, player_id, competitions(name), teams(name), players(full_name)"
          )
          .in("competition_id", competitionIds)
          .eq("is_official", true)
          .order("created_at", { ascending: false })
      : { data: [] };

  const resultRows = ((results as any[]) ?? []).map((result) => ({
    ...result,
    competitionName: result.competitions?.name ?? "Competition",
    entityName:
      result.teams?.name ?? result.players?.full_name ?? "Unknown Entry",
    entityType: result.team_id ? "Team" : "Individual",
    pointsNumber: Number(result.points ?? 0),
  }));

  const teamPointTotal = resultRows
    .filter((result) => result.team_id)
    .reduce((total, result) => total + result.pointsNumber, 0);

  const individualPointTotal = resultRows
    .filter((result) => result.player_id)
    .reduce((total, result) => total + result.pointsNumber, 0);

  const groupedResults = resultRows.reduce((acc, result) => {
    if (!acc[result.competitionName]) {
      acc[result.competitionName] = [];
    }

    acc[result.competitionName].push(result);

    return acc;
  }, {} as Record<string, any[]>);

  return (
    <main className="min-h-screen px-5 pb-32 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>
          <h1 className="mt-4 text-5xl font-black">Official Results</h1>
          <p className="mt-3 text-danvers-muted">
            Enter, audit, and verify official team and individual points.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                Official Rows
              </p>
              <p className="mt-2 text-3xl font-black">{resultRows.length}</p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                Team Points
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatPoints(teamPointTotal)}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-danvers-muted">
                Individual Points
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatPoints(individualPointTotal)}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-2xl font-black">Results Audit</h2>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-danvers-border bg-black/20">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-danvers-border text-left text-xs uppercase tracking-[0.18em] text-danvers-muted">
                  <th className="p-3">Competition</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Entry</th>
                  <th className="p-3">Result</th>
                  <th className="p-3 text-right">Points</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {resultRows.length ? (
                  resultRows.map((result) => (
                    <tr
                      key={result.id}
                      className="border-b border-danvers-border last:border-b-0"
                    >
                      <td className="p-3 font-bold">
                        {result.competitionName}
                      </td>
                      <td className="p-3 text-danvers-muted">
                        {result.entityType}
                      </td>
                      <td className="p-3 font-black">{result.entityName}</td>
                      <td className="p-3 text-danvers-muted">
                        {result.result_label ?? "No label"}
                      </td>
                      <td className="p-3 text-right font-black text-danvers-gold">
                        {formatPoints(result.pointsNumber)}
                      </td>
                      <td className="p-3 text-right">
                        <DeleteResultButton resultId={result.id} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-danvers-muted" colSpan={6}>
                      No official results entered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-2xl font-black">Results by Competition</h2>

          <div className="mt-5 grid gap-6">
            {Object.entries(groupedResults).length ? (
              (Object.entries(groupedResults) as [string, any[]][]).map(
                ([competitionName, rows]) => {
                  const competitionId = rows[0].competition_id;
                  const hasMatches = competitionsWithMatches.has(competitionId);
const competitionTeamPoints = rows
  .filter((row) => row.team_id)
  .reduce((total, row) => total + Number(row.pointsNumber ?? 0), 0);

const competitionIndividualPoints = rows
  .filter((row) => row.player_id)
  .reduce((total, row) => total + Number(row.pointsNumber ?? 0), 0);
                  return (
                    <details
                      key={competitionName}
                      className="rounded-3xl border border-danvers-border bg-black/20 p-4"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-black">
                              {competitionName}
                            </h3>

                            <p className="mt-1 text-sm text-danvers-muted">
  {rows.length} official result(s) · Team pts{" "}
  {formatPoints(competitionTeamPoints)} · Individual pts{" "}
  {formatPoints(competitionIndividualPoints)}
</p>

                            {hasMatches ? (
                              <FinalizeCompetitionResultsButton
                                competitionId={competitionId}
                              />
                            ) : null}
                          </div>

                          <span className="text-sm font-black text-danvers-muted">
                            Expand
                          </span>
                        </div>
                      </summary>

                      <div className="mt-4 grid gap-3">
                        {rows.map((result: any) => (
                          <div
                            key={result.id}
                            className="rounded-2xl border border-danvers-border bg-black/20 p-4"
                          >
                            <p className="font-black">
                              {result.entityName} ·{" "}
                              {formatPoints(result.pointsNumber)} point(s)
                            </p>

                            <p className="mt-1 text-xs text-danvers-muted">
                              {result.result_label ?? "No label"}
                            </p>

                            <DeleteResultButton resultId={result.id} />
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                }
              )
            ) : (
              <p className="text-danvers-muted">
                No official results entered yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-2xl font-black">Finalize Match Competitions</h2>

          <p className="mt-2 text-sm leading-6 text-danvers-muted">
            Use this after match holes have been scored. It will calculate
            official team and individual points from saved match results.
          </p>

          <div className="mt-5 grid gap-3">
            {((competitions as any[]) ?? [])
              .filter((competition) => competitionsWithMatches.has(competition.id))
              .map((competition) => (
                <div
                  key={competition.id}
                  className="rounded-3xl border border-danvers-border bg-black/20 p-5"
                >
                  <h3 className="text-xl font-black">{competition.name}</h3>

                  <p className="mt-1 text-sm text-danvers-muted">
                    Match-based competition
                  </p>

                  <FinalizeCompetitionResultsButton
                    competitionId={competition.id}
                  />
                </div>
              ))}
          </div>
        </section>

        <ResultsForm
          competitions={(competitions as any[]) ?? []}
          teams={(teams as any[]) ?? []}
          players={
            players?.map((row: any) => ({
              id: row.player_id,
              full_name: row.players?.full_name ?? "Unknown Player",
            })) ?? []
          }
        />
        <Link
  href="/admin"
  className="mt-6 block rounded-[2rem] border border-danvers-border bg-black/20 p-5 text-center text-sm font-black uppercase tracking-[0.18em] text-danvers-muted"
>
  Back to Admin
</Link>
      </section>
    </main>
  );
}