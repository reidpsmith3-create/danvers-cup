import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MatchPageProps = {
  params: {
    id: string;
  };
};

function playerNames(ids: string[], players: any[]) {
  const names = ids
    .map((id) => players.find((player) => player.id === id)?.full_name)
    .filter(Boolean);

  return names.length ? names.join(" / ") : null;
}

function getMatchScore(holes: any[]) {
  const teamAWins = holes.filter((hole) => hole.winning_side === "team_a").length;
  const teamBWins = holes.filter((hole) => hole.winning_side === "team_b").length;
  const margin = Math.abs(teamAWins - teamBWins);

  if (holes.length === 0 || margin === 0) {
    return {
      label: "All Square",
      shortLabel: "AS",
      leadingSide: null as "team_a" | "team_b" | null,
      margin: 0,
    };
  }

  return {
    label: teamAWins > teamBWins ? `Team A ${margin} Up` : `Team B ${margin} Up`,
    shortLabel: `${margin} UP`,
    leadingSide: teamAWins > teamBWins ? "team_a" as const : "team_b" as const,
    margin,
  };
}

function scoreType(score: number | null | undefined, par: number | null) {
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
    return <span className="text-danvers-muted">—</span>;
  }

  const type = scoreType(score, par);

  if (type === "eagle") {
    return (
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-danvers-gold" />
        <span className="absolute inset-[4px] rounded-full border border-danvers-gold" />
        <span className="relative font-black text-danvers-gold">{score}</span>
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
        <span className="relative font-black">{score}</span>
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
    .select(
      "*, competitions(id, name, season_id, settings, rounds(course_id)), team_a:teams!matches_team_a_id_fkey(id, name, color, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, color, logo_url)"
    )
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
    holeCount === 9 ? (nineType === "back" ? "Back 9" : "Front 9") : "18 Holes";

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

  const sideATeamName = match.team_a?.name ?? match.team_a_name ?? "Team A";
  const sideBTeamName = match.team_b?.name ?? match.team_b_name ?? "Team B";
  const sideAColor = match.team_a?.color ?? "#1f7a4d";
  const sideBColor = match.team_b?.color ?? "#c39b45";

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

  const matchScore = getMatchScore(holeRows);

  const sideAIsLeading = matchScore.leadingSide === "team_a";
  const sideBIsLeading = matchScore.leadingSide === "team_b";

  const leaderName =
    matchScore.leadingSide === "team_a"
      ? sideAPlayers
      : matchScore.leadingSide === "team_b"
        ? sideBPlayers
        : null;

  const leaderColor =
    matchScore.leadingSide === "team_a"
      ? sideAColor
      : matchScore.leadingSide === "team_b"
        ? sideBColor
        : "#c39b45";

  const heroStatus =
  match.final_result && match.winning_side
    ? match.winning_side === "halved"
      ? "Match Halved"
      : `${leaderName} wins ${match.final_result}`
    : matchScore.margin === 0
      ? "All Square"
      : `${leaderName} ${matchScore.margin} Up`;

  return (
    <main className="min-h-screen px-4 pb-24 pt-5 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link href="/live" className="text-sm font-bold text-danvers-muted">
          ← Back to Live
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-border bg-danvers-surface shadow-2xl shadow-black/40">
          <div className="bg-gradient-to-br from-danvers-green/40 via-black/20 to-black p-5">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
              {match.competitions?.name ?? "Match Play"}
            </p>

            <div className="mt-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-muted">
                Match Status
              </p>

              <h1
                className="mt-2 text-5xl font-black leading-none"
                style={{ color: leaderColor }}
              >
                {match.final_result ?? matchScore.shortLabel}
              </h1>

              <p className="mt-2 text-xl font-black">{heroStatus}</p>

<p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
  {match.final_result ? "Final" : `Thru ${holeRows.length}`} · {holeLabel}
</p>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div
                className={`rounded-3xl border p-4 ${
                  sideAIsLeading
                    ? "border-danvers-gold bg-danvers-gold/10"
                    : "border-danvers-border bg-black/20"
                }`}
                style={{ borderLeftWidth: "6px", borderLeftColor: sideAColor }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danvers-brass">
                  {sideATeamName}
                </p>
                <h2 className="mt-2 text-lg font-black leading-tight">
                  {sideAPlayers}
                </h2>
              </div>

              <div className="text-center text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
                VS
              </div>

              <div
                className={`rounded-3xl border p-4 text-right ${
                  sideBIsLeading
                    ? "border-danvers-gold bg-danvers-gold/10"
                    : "border-danvers-border bg-black/20"
                }`}
                style={{ borderRightWidth: "6px", borderRightColor: sideBColor }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danvers-brass">
                  {sideBTeamName}
                </p>
                <h2 className="mt-2 text-lg font-black leading-tight">
                  {sideBPlayers}
                </h2>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
            Hole Timeline
          </p>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {scorecardHoles.map((hole) => {
              const winner = hole.score?.winning_side;
              const color =
                winner === "team_a"
                  ? sideAColor
                  : winner === "team_b"
                    ? sideBColor
                    : winner === "halved"
                      ? "#c39b45"
                      : undefined;

              return (
                <div
                  key={hole.holeNumber}
                  className="flex min-w-14 flex-col items-center rounded-2xl border border-danvers-border bg-black/20 p-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-danvers-muted">
                    Hole
                  </p>
                  <p className="text-xl font-black">{hole.holeNumber}</p>

                  <div
                    className="mt-2 h-3 w-3 rounded-full border border-danvers-border"
                    style={{
                      backgroundColor: color ?? "transparent",
                      borderColor: color ?? undefined,
                    }}
                  />

                  <p className="mt-2 text-[10px] font-bold uppercase text-danvers-muted">
                    {winner === "team_a"
                      ? sideATeamName
                      : winner === "team_b"
                        ? sideBTeamName
                        : winner === "halved"
                          ? "Halved"
                          : "Open"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
                Hole-by-Hole
              </p>
              <h2 className="mt-2 text-3xl font-black">Scorecard</h2>
            </div>

            <p className="text-sm font-bold text-danvers-muted">
              {match.final_result ? "Match complete" : `${holeRows.length}/${holeCount} scored`}
            </p>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-danvers-border bg-black/20">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-danvers-border text-left text-xs uppercase tracking-[0.2em] text-danvers-muted">
                  <th className="sticky left-0 z-10 bg-danvers-surface p-3">
                    Hole
                  </th>
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
                  <td className="sticky left-0 z-10 bg-danvers-surface p-3 font-black">
                    Par
                  </td>
                  {scorecardHoles.map((hole) => (
                    <td key={hole.holeNumber} className="p-3 text-center font-black">
                      {hole.par ?? "—"}
                    </td>
                  ))}
                  <td className="p-3 text-center font-black">{parTotal || "—"}</td>
                </tr>

                <tr className="border-b border-danvers-border">
                  <td className="sticky left-0 z-10 bg-danvers-surface p-3 font-black">
                    {sideAPlayers}
                  </td>
                  {scorecardHoles.map((hole) => (
                    <td
                      key={hole.holeNumber}
                      className={`p-3 text-center font-black ${
                        hole.score?.winning_side === "team_a"
                          ? "text-danvers-gold"
                          : "text-danvers-muted"
                      }`}
                    >
                      <ScoreBadge score={hole.score?.team_a_score} par={hole.par} />
                    </td>
                  ))}
                  <td className="p-3 text-center font-black">
                    {sideATotal || "—"}
                  </td>
                </tr>

                <tr>
                  <td className="sticky left-0 z-10 bg-danvers-surface p-3 font-black">
                    {sideBPlayers}
                  </td>
                  {scorecardHoles.map((hole) => (
                    <td
                      key={hole.holeNumber}
                      className={`p-3 text-center font-black ${
                        hole.score?.winning_side === "team_b"
                          ? "text-danvers-gold"
                          : "text-danvers-muted"
                      }`}
                    >
                      <ScoreBadge score={hole.score?.team_b_score} par={hole.par} />
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