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

type MatchupCard = {
  label: string;
  sideA: string;
  sideB: string;
  result: string;
  winner: "A" | "B" | "Halved" | null;
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

function playerNames(ids: string[], players: any[]) {
  return ids
    .map((id) => players.find((player) => player.id === id)?.full_name)
    .filter(Boolean)
    .join(" / ");
}

function getMatchStatus(holes: any[]) {
  const teamAWins = holes.filter((hole) => hole.winning_side === "team_a").length;
  const teamBWins = holes.filter((hole) => hole.winning_side === "team_b").length;
  const completed = holes.length;
  const remaining = Math.max(18 - completed, 0);
  const margin = Math.abs(teamAWins - teamBWins);

  if (completed === 0) {
    return {
      result: "Not scored yet",
      winner: null as "A" | "B" | "Halved" | null,
    };
  }

  if (margin === 0 && completed >= 18) {
    return {
      result: "Halved",
      winner: "Halved" as const,
    };
  }

  if (margin === 0) {
    return {
      result: `All square through ${completed}`,
      winner: null as "A" | "B" | "Halved" | null,
    };
  }

  const leader = teamAWins > teamBWins ? "A" : "B";
  const leaderLabel = leader === "A" ? "Side A" : "Side B";

  if (margin > remaining || completed >= 18) {
    return {
      result:
        completed >= 18
          ? `${leaderLabel} wins ${margin} up`
          : `${leaderLabel} wins ${margin}&${remaining}`,
      winner: leader as "A" | "B",
    };
  }

  return {
    result: `${leaderLabel} ${margin} up through ${completed}`,
    winner: leader as "A" | "B",
  };
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
    .select("*, rounds(id, name, round_date, courses(id, name, city, state))")
    .eq("id", params.competitionId)
    .single();

  const { data: results } = await supabase
    .from("competition_results")
    .select(
      "id, team_id, player_id, points, result_label, teams(name), players(full_name)"
    )
    .eq("competition_id", params.competitionId)
    .eq("is_official", true)
    .order("points", { ascending: false });

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition_id", params.competitionId)
    .order("created_at", { ascending: true });

  const matchIds = matches?.map((match) => match.id) ?? [];

  const { data: matchHoles } =
    matchIds.length > 0
      ? await supabase
          .from("match_holes")
          .select("*")
          .in("match_id", matchIds)
          .order("hole_number", { ascending: true })
      : { data: [] };

  const { data: seasonPlayers } = season
    ? await supabase
        .from("season_players")
        .select("player_id, players(id, full_name)")
        .eq("season_id", season.id)
    : { data: [] };

  if (!season || !competition) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Competition not found</h1>
          <Link
            href={`/history/${year}`}
            className="mt-4 block text-danvers-muted"
          >
            Back to season
          </Link>
        </section>
      </main>
    );
  }

  const round = getSingleRelation(competition.rounds);
  const course = getSingleRelation(round?.courses);
  const resultRows = (results as any[]) ?? [];
  const players =
    seasonPlayers?.map((row: any) => ({
      id: row.player_id,
      full_name: row.players?.full_name ?? "Unknown Player",
    })) ?? [];

  const dbMatchups: MatchupCard[] =
    matches?.map((match: any) => {
      const holesForMatch =
        (matchHoles as any[])?.filter((hole) => hole.match_id === match.id) ??
        [];

const status = getMatchStatus(holesForMatch);

const winner =
  match.winning_side === "team_a"
    ? "A"
    : match.winning_side === "team_b"
      ? "B"
      : match.winning_side === "halved"
        ? "Halved"
        : status.winner;

return {
  label:
    match.match_type === "singles" ||
    ((match.team_a_player_ids?.length ?? 0) === 1 &&
      (match.team_b_player_ids?.length ?? 0) === 1)
      ? "Singles"
      : "Team Match",
  sideA:
    playerNames(match.team_a_player_ids ?? [], players) ||
    match.team_a_name ||
    "Side A",
  sideB:
    playerNames(match.team_b_player_ids ?? [], players) ||
    match.team_b_name ||
    "Side B",
  result: match.final_result || status.result,
  winner,
};
    }) ?? [];

const matchups = dbMatchups;

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href={
            round?.id
              ? `/history/${season.year}/rounds/${round.id}`
              : `/history/${season.year}`
          }
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to Round
        </Link>

        <section className="mt-5 rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
            Competition Archive
          </p>

          <h1 className="mt-4 text-5xl font-black">{competition.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-danvers-muted">
  <span>{formatDate(round?.round_date)}</span>
  <span>·</span>

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
</div>

<p className="mt-2 text-sm text-danvers-muted">
  📍 {course?.city}, {course?.state}
</p>
        </section>

        {matchups.length ? (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Matchups
            </p>

            <h2 className="mt-2 text-3xl font-black">Matches Played</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {matchups.map((matchup, index) => (
                <div
                  key={`${matchup.sideA}-${matchup.sideB}-${index}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/25"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
                      {matchup.label}
                    </p>

                    <p className="text-xs font-black text-danvers-gold">
                      Match {index + 1}
                    </p>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
                    <div
                      className={`p-4 ${
                        matchup.winner === "A"
                          ? "bg-danvers-gold/10"
                          : "bg-transparent"
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danvers-muted">
                        Side A
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {matchup.sideA}
                      </p>
                    </div>

                    <div className="flex items-center border-x border-white/10 px-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-danvers-muted">
                        vs
                      </p>
                    </div>

                    <div
                      className={`p-4 text-right ${
                        matchup.winner === "B"
                          ? "bg-danvers-gold/10"
                          : "bg-transparent"
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danvers-muted">
                        Side B
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {matchup.sideB}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                      {matchup.result}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

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