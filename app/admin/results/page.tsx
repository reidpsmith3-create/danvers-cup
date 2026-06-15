import ResultsForm from "@/components/admin/ResultsForm";
import DeleteResultButton from "@/components/admin/DeleteResultButton";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminResultsPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

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

  const { data: results } = await supabase
    .from("competition_results")
    .select(
      "id, points, result_label, is_official, team_id, player_id, competitions(name), teams(name), players(full_name)"
    )
    .eq("is_official", true)
    .order("created_at", { ascending: false });

  const groupedResults = ((results as any[]) ?? []).reduce((acc, result) => {
    const competitionName = result.competitions?.name ?? "Competition";

    if (!acc[competitionName]) {
      acc[competitionName] = [];
    }

    acc[competitionName].push(result);

    return acc;
  }, {} as Record<string, any[]>);

  return (
    <main className="min-h-screen px-5 pb-32 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>
          <h1 className="mt-4 text-5xl font-black">Official Results</h1>
          <p className="mt-3 text-danvers-muted">
            Enter official team and individual points after competitions are
            finalized.
          </p>
        </div>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-2xl font-black">Official Results Entered</h2>

          <div className="mt-5 grid gap-6">
            {Object.entries(groupedResults).length ? (
              (Object.entries(groupedResults) as [string, any[]][]).map(
  ([competitionName, rows]) => (
                <details
  key={competitionName}
  className="rounded-3xl border border-danvers-border bg-black/20 p-4"
>
  <summary className="cursor-pointer list-none">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h3 className="text-xl font-black">{competitionName}</h3>
        <p className="mt-1 text-sm text-danvers-muted">
          {rows.length} official result(s)
        </p>
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
                          {result.teams?.name ??
                            result.players?.full_name ??
                            "Unknown"}{" "}
                          · {result.points} point(s)
                        </p>

                        <p className="mt-1 text-xs text-danvers-muted">
                          {result.result_label ?? "No label"}
                        </p>

                        <DeleteResultButton resultId={result.id} />
                      </div>
                    ))}
                  </div>
                </details>
                )
)
            ) : (
              <p className="text-danvers-muted">
                No official results entered yet.
              </p>
            )}
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
      </section>
    </main>
  );
}