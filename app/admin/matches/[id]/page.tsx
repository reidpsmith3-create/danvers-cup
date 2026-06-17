import Link from "next/link";
import MatchHoleForm from "@/components/admin/MatchHoleForm";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MatchDetailPageProps = {
  params: {
    id: string;
  };
};

function playerNames(ids: string[], players: any[]) {
  return ids
    .map((id) => players.find((player) => player.id === id)?.full_name)
    .filter(Boolean)
    .join(", ");
}

function getMatchStatus(holes: any[]) {
  const teamAWins = holes.filter(
    (hole) => hole.winning_side === "team_a"
  ).length;
  const teamBWins = holes.filter(
    (hole) => hole.winning_side === "team_b"
  ).length;

  const margin = Math.abs(teamAWins - teamBWins);

  if (margin === 0) return "All Square";

  return teamAWins > teamBWins
    ? `Team A ${margin} Up`
    : `Team B ${margin} Up`;
}

export default async function MatchDetailPage({
  params,
}: MatchDetailPageProps) {
  const { data: match } = await supabase
    .from("matches")
    .select("*, competitions(name, format, settings)")
    .eq("id", params.id)
    .single();

  const season = await getCurrentSeason();

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("player_id, players(id, full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const players =
    seasonPlayers?.map((row: any) => ({
      id: row.player_id,
      full_name: row.players?.full_name ?? "Unknown Player",
    })) ?? [];

  const { data: holes } = await supabase
    .from("match_holes")
    .select("*")
    .eq("match_id", params.id)
    .order("hole_number", { ascending: true });

const savedHoles = (holes as any[]) ?? [];

if (!match) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-black">Match not found</h1>
          <Link href="/admin/matches" className="mt-4 block text-danvers-muted">
            Back to matches
          </Link>
        </section>
      </main>
    );
  }
  const competitionSettings = match.competitions?.settings ?? {};
const holeCount = Number(competitionSettings.holeCount ?? 18);
const nineType = competitionSettings.nineType ?? null;

const holeNumbers =
  holeCount === 9 && nineType === "back"
    ? Array.from({ length: 9 }, (_, index) => index + 10)
    : Array.from({ length: holeCount }, (_, index) => index + 1);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
<div className="flex items-center justify-between gap-4">
  <Link
    href="/admin/matches"
    className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
  >
    ← Matches
  </Link>

  <Link
    href={`/matches/${match.id}`}
    className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted"
  >
    Public View
  </Link>
</div>

        <div className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
<p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
  Admin Match Scoring
</p>

          <h1 className="mt-4 text-5xl font-black">
            {match.team_a_name} vs {match.team_b_name}
          </h1>

          <p className="mt-3 text-danvers-muted">
            {match.competitions?.name ?? "Competition"} ·{" "}
            {match.competitions?.format ?? "match"}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Status
              </p>
              <p className="mt-2 text-2xl font-black">
                {getMatchStatus(savedHoles)}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Holes Scored
              </p>
              <p className="mt-2 text-2xl font-black">{savedHoles.length}</p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-black">
                {holeNumbers.length - savedHoles.length}
              </p>
            </div>
          </div>
        </div>

<section className="mt-8 grid gap-4 sm:grid-cols-2">
  <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
      Side A
    </p>
    <h2 className="mt-2 text-2xl font-black">{match.team_a_name}</h2>
    <p className="mt-3 leading-6 text-danvers-muted">
      {playerNames(match.team_a_player_ids ?? [], players)}
    </p>
    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
      {(match.team_a_player_ids ?? []).length} player(s)
    </p>
  </div>

  <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
    <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
      Side B
    </p>
    <h2 className="mt-2 text-2xl font-black">{match.team_b_name}</h2>
    <p className="mt-3 leading-6 text-danvers-muted">
      {playerNames(match.team_b_player_ids ?? [], players)}
    </p>
    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
      {(match.team_b_player_ids ?? []).length} player(s)
    </p>
  </div>
</section>

        <MatchHoleForm
  matchId={match.id}
  existingHoles={savedHoles}
  holeNumbers={holeNumbers}
/>
      </section>
    </main>
  );
}