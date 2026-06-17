import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MatchPageProps = {
  params: {
    id: string;
  };
};

function getMatchStatus(
  holes: any[],
  sideAName: string,
  sideBName: string
) {
  const teamAWins = holes.filter(
    (hole) => hole.winning_side === "team_a"
  ).length;

  const teamBWins = holes.filter(
    (hole) => hole.winning_side === "team_b"
  ).length;

  const margin = Math.abs(teamAWins - teamBWins);

  if (margin === 0) {
    return "All Square";
  }

  return teamAWins > teamBWins
    ? `${sideAName} ${margin} Up`
    : `${sideBName} ${margin} Up`;
}
function playerNames(ids: string[], players: any[]) {
  const names = ids
    .map((id) => players.find((player) => player.id === id)?.full_name)
    .filter(Boolean);

  return names.length ? names.join(" / ") : null;
}
function scoreType(
  score: number | null | undefined,
  par: number | null
) {
  if (!score || !par) return "par";

  const diff = score - par;

  if (diff <= -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 1) return "bogey";
  if (diff >= 2) return "double";

  return "par";
}

function ScoreBadge({
  score,
  par,
}: {
  score: number | null | undefined;
  par: number | null;
}) {
  if (score === null || score === undefined) {
    return <>—</>;
  }

  const type = scoreType(score, par);

  if (type === "eagle") {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-danvers-gold" />
        <span className="absolute inset-[4px] rounded-full border border-danvers-gold" />
        <span className="relative font-black text-danvers-gold">
          {score}
        </span>
      </span>
    );
  }

  if (type === "birdie") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-danvers-gold font-black text-danvers-gold">
        {score}
      </span>
    );
  }

  if (type === "double") {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <span className="absolute inset-0 border border-danvers-muted" />
        <span className="absolute inset-[4px] border border-danvers-muted" />
        <span className="relative font-black">
          {score}
        </span>
      </span>
    );
  }

  if (type === "bogey") {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center border border-danvers-muted font-black">
        {score}
      </span>
    );
  }

  return <span className="font-black">{score}</span>;
}
export default async function MatchPage({ params }: MatchPageProps) {
const { data: match } = await supabase
  .from("matches")
  .select("*, competitions(id, name, season_id, settings, rounds(course_id))")
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
  const competitionSettings = match.competitions?.settings ?? {};
const holeCount = Number(competitionSettings.holeCount ?? 18);
const nineType = competitionSettings.nineType ?? null;

const holeLabel =
  holeCount === 9
    ? nineType === "back"
      ? "Back 9"
      : "Front 9"
    : "18 Holes";
const holeNumbers =
  holeCount === 9 && nineType === "back"
    ? Array.from({ length: 9 }, (_, index) => index + 10)
    : Array.from({ length: holeCount }, (_, index) => index + 1);

const { data: courseHoles } = match.competitions?.rounds?.course_id
  ? await supabase
      .from("course_holes")
      .select("hole_number, par, yardage, handicap_number")
      .eq("course_id", match.competitions.rounds.course_id)
      .in("hole_number", holeNumbers)
      .order("hole_number", { ascending: true })
  : { data: [] };

const holeInfoRows = (courseHoles as any[]) ?? [];

const holeInfoByNumber = new Map(
  holeInfoRows.map((hole) => [hole.hole_number, hole])
);

const scoreByHoleNumber = new Map(
  holeRows.map((hole) => [hole.hole_number, hole])
);

const scorecardHoles = holeNumbers.map((holeNumber) => ({
  holeNumber,
  par: holeInfoByNumber.get(holeNumber)?.par ?? null,
  yardage: holeInfoByNumber.get(holeNumber)?.yardage ?? null,
  handicapNumber: holeInfoByNumber.get(holeNumber)?.handicap_number ?? null,
  score: scoreByHoleNumber.get(holeNumber) ?? null,
}));

const parTotal = scorecardHoles.reduce(
  (total, hole) => total + Number(hole.par ?? 0),
  0
);

const sideATotal = scorecardHoles.reduce(
  (total, hole) => total + Number(hole.score?.team_a_score ?? 0),
  0
);

const sideBTotal = scorecardHoles.reduce(
  (total, hole) => total + Number(hole.score?.team_b_score ?? 0),
  0
);
const { data: seasonPlayers } = await supabase
  .from("season_players")
  .select("player_id, players(id, full_name)")
  .eq("season_id", match.competitions?.season_id);

const players =
  seasonPlayers?.map((row: any) => ({
    id: row.player_id,
    full_name: row.players?.full_name ?? "Unknown Player",
  })) ?? [];

const sideAPlayers =
  playerNames(match.team_a_player_ids ?? [], players) ??
  match.team_a_name ??
  "Side A";

const sideBPlayers =
  playerNames(match.team_b_player_ids ?? [], players) ??
  match.team_b_name ??
  "Side B";
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
  {sideAPlayers} vs {sideBPlayers}
</h1>

<p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-danvers-brass">
  {match.team_a_name ?? "Team A"} vs {match.team_b_name ?? "Team B"}
</p>

          <p className="mt-3 text-danvers-muted">
            {holeLabel} · {holeRows.length} holes scored
          </p>

          <div className="mt-6 rounded-2xl border border-danvers-border bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
              Match Status
            </p>
            <p className="mt-2 text-3xl font-black">
              {getMatchStatus(
  holeRows,
  sideAPlayers,
  sideBPlayers
)}
            </p>
          </div>
        </div>

<section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
  <h2 className="text-3xl font-black">Scorecard</h2>

  <div className="mt-5 overflow-x-auto rounded-2xl border border-danvers-border bg-black/20">
    <table className="w-full min-w-[900px] text-sm">
      <thead>
        <tr className="border-b border-danvers-border text-left text-xs uppercase tracking-[0.2em] text-danvers-muted">
          <th className="p-3">Hole</th>
          {scorecardHoles.map((hole) => (
            <th key={hole.holeNumber} className="p-3 text-center">
              {hole.holeNumber}
            </th>
          ))}
          <th className="p-3 text-center">Total</th>
        </tr>
      </thead>

      <tbody>
        <tr className="border-b border-danvers-border text-danvers-muted">
          <td className="p-3 font-black">Par</td>
          {scorecardHoles.map((hole) => (
            <td key={hole.holeNumber} className="p-3 text-center font-black">
              {hole.par ?? "—"}
            </td>
          ))}
          <td className="p-3 text-center font-black">
            {parTotal || "—"}
          </td>
        </tr>

        <tr className="border-b border-danvers-border">
          <td className="p-3 font-black">{sideAPlayers}</td>
          {scorecardHoles.map((hole) => (
            <td
              key={hole.holeNumber}
              className={`p-3 text-center font-black ${
                hole.score?.winning_side === "team_a"
                  ? "text-danvers-gold"
                  : "text-danvers-muted"
              }`}
            >
              <ScoreBadge
  score={hole.score?.team_a_score}
  par={hole.par}
/>
            </td>
          ))}
          <td className="p-3 text-center font-black">
            {sideATotal || "—"}
          </td>
        </tr>

        <tr>
          <td className="p-3 font-black">{sideBPlayers}</td>
          {scorecardHoles.map((hole) => (
            <td
              key={hole.holeNumber}
              className={`p-3 text-center font-black ${
                hole.score?.winning_side === "team_b"
                  ? "text-danvers-gold"
                  : "text-danvers-muted"
              }`}
            >
              <ScoreBadge
  score={hole.score?.team_b_score}
  par={hole.par}
/>
            </td>
          ))}
          <td className="p-3 text-center font-black">
            {sideBTotal || "—"}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
      </section>
    </main>
  );
}