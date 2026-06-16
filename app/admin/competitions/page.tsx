import CompetitionForm from "@/components/admin/CompetitionForm";
import DeleteAdminItemButton from "@/components/admin/DeleteAdminItemButton";
import { supabase } from "@/lib/supabase";
import CalculateBestBallButton from "@/components/admin/CalculateBestBallButton";
import CalculateMatchButton from "@/components/admin/CalculateMatchButton";
import CalculateStablefordButton from "@/components/admin/CalculateStablefordButton";
import CalculateStrokeButton from "@/components/admin/CalculateStrokeButton";
import { getCompetitionScoringRule } from "@/lib/scoring/competitionScoring";
import { getCompetitionActions } from "@/lib/scoring/getCompetitionActions";
import { getCurrentSeason } from "@/lib/currentSeason";
import Link from "next/link";
import {
  getCompetitionStatus,
  getCompetitionStatusLabel,
} from "@/lib/scoring/getCompetitionStatus";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCompetitionsPage() {
  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*, rounds(round_number, name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });
      const { data: scores } = await supabase
    .from("scores")
    .select("round_id");

  const { data: results } = await supabase
    .from("competition_results")
    .select("competition_id")
    .eq("is_official", true);

  if (!season) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <h1 className="text-4xl font-black">Season not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>
          <h1 className="mt-4 text-5xl font-black">Competitions</h1>
          <p className="mt-3 text-danvers-muted">
            Create the events that drive team points, individual points, live
            scoring, and official standings.
          </p>
        </div>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-2xl font-black">Current Competitions</h2>

          <div className="mt-5 grid gap-3">
            {competitions?.length ? (
              competitions.map((competition: any) => {
const scoringRule = getCompetitionScoringRule(competition.format);
const actions = getCompetitionActions(competition.format);

const scoreCount =
  scores?.filter((score: any) => score.round_id === competition.round_id)
    .length ?? 0;

const resultCount =
  results?.filter(
    (result: any) => result.competition_id === competition.id
  ).length ?? 0;

const status = getCompetitionStatus({
  scoreCount,
  resultCount,
});

  return (
    <div
      key={competition.id}
      className="rounded-2xl border border-danvers-border bg-black/20 p-4"
    >
      <div className="flex items-start justify-between gap-4">
  <p className="font-black">{competition.name}</p>

  <span className="rounded-full border border-danvers-border px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-danvers-muted">
    {getCompetitionStatusLabel(status)}
  </span>
  <div className="mt-2 flex flex-wrap gap-2">
  {competition.is_active ? (
    <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs font-bold text-green-400">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-zinc-600/20 px-2 py-1 text-xs font-bold text-zinc-400">
      Inactive
    </span>
  )}

  {competition.is_visible ? (
    <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-bold text-blue-400">
      Visible
    </span>
  ) : (
    <span className="rounded-full bg-yellow-600/20 px-2 py-1 text-xs font-bold text-yellow-400">
      Hidden
    </span>
  )}
</div>
</div>

      <p className="mt-1 text-sm text-danvers-muted">
        Round {competition.rounds?.round_number ?? "—"} ·{" "}
        {scoringRule.label} · {competition.scoring_basis}
      </p>

      <p className="mt-1 text-xs text-danvers-muted">
  Team points: {competition.counts_for_team_points ? "Yes" : "No"} ·
  Individual points:{" "}
  {competition.counts_for_individual_points ? "Yes" : "No"} ·
  Handicap: {competition.handicap_percent}% · Calculator:{" "}
  {scoringRule.hasCalculator ? "Yes" : "Manual"} · Scores: {scoreCount} ·
  Results: {resultCount}
</p>
      <div className="mt-3 rounded-xl border border-danvers-border bg-black/20 p-3">
  <p className="text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
    Required Actions
  </p>
  <div className="mt-2 flex flex-wrap gap-2">
    {actions.map((action) => (
      <span
        key={action}
        className="rounded-full border border-danvers-border px-3 py-1 text-xs font-bold text-danvers-muted"
      >
        {action}
      </span>
    ))}
  </div>
</div>

      {competition.format === "stroke" ? (
        <CalculateStrokeButton competitionId={competition.id} />
      ) : null}

      {competition.format === "match" ? (
        <CalculateMatchButton competitionId={competition.id} />
      ) : null}

      {competition.format === "best_ball" ? (
        <CalculateBestBallButton competitionId={competition.id} />
      ) : null}

      {competition.format === "stableford" ? (
        <CalculateStablefordButton competitionId={competition.id} />
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/competitions/${competition.id}`}
          className="rounded-2xl border border-danvers-border px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-danvers-gold"
        >
          Edit Competition
        </Link>

        <DeleteAdminItemButton
          label="competition"
          endpoint="/api/admin/competitions/delete"
          payload={{ competitionId: competition.id }}
        />
      </div>
    </div>
  );
})
            ) : (
              <p className="text-danvers-muted">No competitions yet.</p>
            )}
          </div>
        </section>

        <CompetitionForm seasonId={season.id} rounds={(rounds as any[]) ?? []} />
      </section>
    </main>
  );
}