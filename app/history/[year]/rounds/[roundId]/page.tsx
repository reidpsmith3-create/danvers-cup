import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoundArchivePageProps = {
  params: {
    year: string;
    roundId: string;
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

function formatTime(time: string | null) {
  if (!time) return null;

  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function buildStandings(results: any[], type: "team" | "player") {
  const standingsMap = new Map<string, number>();

  results
    .filter((result) => {
      if (type === "team") return result.team_id;
      return result.player_id;
    })
    .forEach((result) => {
      const name =
        type === "team"
          ? getSingleRelation(result.teams)?.name ?? "Unknown Team"
          : getSingleRelation(result.players)?.full_name ?? "Unknown Player";

      const current = standingsMap.get(name) ?? 0;
      standingsMap.set(name, current + Number(result.points ?? 0));
    });

  return Array.from(standingsMap.entries()).sort((a, b) => b[1] - a[1]);
}
function get2024RoundStory(roundName: string) {
  const stories: Record<string, string> = {
    "Ak-Chin Southern Dunes":
      "The inaugural Danvers Cup opened at Ak-Chin Southern Dunes, setting the tone for the first official season archive.",
    "TPC Scottsdale Morning":
      "The first Stadium Course session brought the Cup into its centerpiece venue, with team and individual races beginning to take shape.",
    "TPC Scottsdale Afternoon":
      "The afternoon session at TPC Scottsdale became the current home of the full imported 2024 results while competition-level cleanup remains pending.",
    "Final Competition":
      "The closing competition decided the first Danvers Cup champions and finalized the inaugural team and individual standings.",
    "We-Ko-Pa Saguaro":
      "A desert exhibition round. It belongs in the story of the trip, but it does not count toward official Danvers Cup standings.",
  };

  return stories[roundName] ?? null;
}

export default async function RoundArchivePage({ params }: RoundArchivePageProps) {
  const year = Number(params.year);

  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", year)
    .single();

  const { data: round } = await supabase
    .from("rounds")
    .select(
  "id, season_id, course_id, round_number, name, round_date, tee_time, status, courses(id, name, city, state, website_url, logo_url)"
)
    .eq("id", params.roundId)
    .single();

  if (!season || !round) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Round not found</h1>
          <Link href={`/history/${year}`} className="mt-4 block text-danvers-muted">
            Back to season
          </Link>
        </section>
      </main>
    );
  }

  const course = getSingleRelation(round.courses);

  const { data: competitions } = await supabase
    .from("competitions")
    .select(
      "id, name, format, scoring_basis, handicap_percent, counts_for_individual_points, counts_for_team_points, is_visible, created_at"
    )
    .eq("round_id", round.id)
    .order("created_at", { ascending: true });

  const competitionRows = (competitions as any[]) ?? [];
  const competitionIds = competitionRows.map((competition) => competition.id);

const { data: results } =
  competitionIds.length > 0
    ? await supabase
        .from("competition_results")
        .select(
          "id, competition_id, team_id, player_id, points, result_label, teams(name), players(full_name)"
        )
        .in("competition_id", competitionIds)
        .eq("is_official", true)
        .order("points", { ascending: false })
    : { data: [] };

const { data: completedCompetitionsThroughRound } = await supabase
  .from("competitions")
  .select("id, rounds!inner(round_number)")
  .eq("season_id", season.id)
  .lte("rounds.round_number", round.round_number);

const completedCompetitionIds =
  (completedCompetitionsThroughRound as any[] | null)?.map(
    (competition) => competition.id
  ) ?? [];

const { data: cumulativeResults } =
  completedCompetitionIds.length > 0
    ? await supabase
        .from("competition_results")
        .select(
          "id, competition_id, team_id, player_id, points, result_label, teams(name), players(full_name)"
        )
        .in("competition_id", completedCompetitionIds)
        .eq("is_official", true)
    : { data: [] };

  const resultRows = (results as any[]) ?? [];

const teamResults = resultRows.filter((result) => result.team_id);
const playerResults = resultRows.filter((result) => result.player_id);

const cumulativeRows = (cumulativeResults as any[]) ?? [];
const teamStandingsAfterRound = buildStandings(cumulativeRows, "team");
const individualStandingsAfterRound = buildStandings(cumulativeRows, "player");

const story = get2024RoundStory(round.name);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href={`/history/${season.year}`}
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to {season.year}
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black shadow-2xl shadow-black/40">
          <div className="h-1 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

          <div className="p-6">
            <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
              {round.status === "exhibition" ? "Exhibition Round" : "Round Archive"}
            </p>

            <h1 className="mt-4 text-5xl font-black leading-none">
              {round.name}
            </h1>

            <p className="mt-4 text-sm text-danvers-muted">
              {formatDate(round.round_date)}
              {formatTime(round.tee_time) ? ` · ${formatTime(round.tee_time)}` : ""}
            </p>

            <div className="mt-2 text-sm text-danvers-muted">
  {course?.id ? (
    <Link
      href={`/courses/${course.id}`}
      className="font-black text-danvers-gold hover:underline"
    >
      {course.name}
    </Link>
  ) : (
    <span>Course TBD</span>
  )}

  {course?.city || course?.state ? (
    <span>
      {" "}
      · 📍 {course?.city ?? ""}
      {course?.city && course?.state ? ", " : ""}
      {course?.state ?? ""}
    </span>
  ) : null}
</div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  Season
                </p>
                <p className="mt-2 text-2xl font-black">{season.year}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  Competitions
                </p>
                <p className="mt-2 text-2xl font-black">
                  {competitionRows.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  Status
                </p>
                <p className="mt-2 text-2xl font-black capitalize">
                  {round.status}
                </p>
              </div>
            </div>
          </div>
        </section>

        {story ? (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Round Story
            </p>

            <h2 className="mt-2 text-3xl font-black">The Setting</h2>

            <p className="mt-4 text-sm leading-7 text-danvers-muted">
              {story}
            </p>
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Competitions
          </p>

          <h2 className="mt-2 text-3xl font-black">Round Competitions</h2>

          <div className="mt-6 grid gap-3">
            {competitionRows.length ? (
              competitionRows.map((competition) => (
                <Link
                  key={competition.id}
                  href={`/history/${season.year}/competitions/${competition.id}`}
                  className="block rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-danvers-gold"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{competition.name}</h3>

                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-danvers-muted">
                        {competition.format} · {competition.scoring_basis}
                      </p>
                    </div>

                    <p className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                      View →
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-danvers-muted">
                No official competitions found for this round.
              </p>
            )}
          </div>
        </section>
<section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
  <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
    Standings After This Round
  </p>

  <h2 className="mt-2 text-3xl font-black">
    Through {round.name}
  </h2>

  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <div>
      <h3 className="text-xl font-black">Team Standings</h3>

      <div className="mt-4 grid gap-3">
        {teamStandingsAfterRound.length ? (
          teamStandingsAfterRound.map(([name, points], index) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <p className="font-black">
                {index + 1}. {name}
              </p>

              <p className="font-black text-danvers-gold">
                {points} pts
              </p>
            </div>
          ))
        ) : (
          <p className="text-danvers-muted">
            No team standings available yet.
          </p>
        )}
      </div>
    </div>

    <div>
      <h3 className="text-xl font-black">Individual Standings</h3>

      <div className="mt-4 grid gap-3">
        {individualStandingsAfterRound.length ? (
          individualStandingsAfterRound.map(([name, points], index) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <p className="font-black">
                {index + 1}. {name}
              </p>

              <p className="font-black text-danvers-gold">
                {points} pts
              </p>
            </div>
          ))
        ) : (
          <p className="text-danvers-muted">
            No individual standings available yet.
          </p>
        )}
      </div>
    </div>
  </div>
</section>
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <h2 className="text-3xl font-black">Team Results</h2>

            <div className="mt-5 grid gap-3">
              {teamResults.length ? (
                teamResults.map((result) => {
                  const name =
                    getSingleRelation(result.teams)?.name ?? "Unknown Team";

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
                  No team results found for this round.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <h2 className="text-3xl font-black">Individual Results</h2>

            <div className="mt-5 grid gap-3">
              {playerResults.length ? (
                playerResults.map((result) => {
                  const name =
                    getSingleRelation(result.players)?.full_name ??
                    "Unknown Player";

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
                  No individual results found for this round.
                </p>
              )}
            </div>
          </div>
        </section>

        {round.status === "exhibition" ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-gold/30 bg-danvers-gold/10 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Exhibition Note
            </p>

            <p className="mt-3 text-sm leading-6 text-danvers-muted">
              This round is part of the 2024 trip archive, but it does not count
              toward official team or individual Danvers Cup standings.
            </p>
          </section>
        ) : null}
      </section>
    </main>
  );
}