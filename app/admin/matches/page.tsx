import MatchForm from "@/components/admin/MatchForm";
import { supabase } from "@/lib/supabase";
import DeleteAdminItemButton from "@/components/admin/DeleteAdminItemButton";
import Link from "next/link";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function playerNames(ids: string[], players: any[]) {
  return ids
    .map((id) => players.find((player) => player.id === id)?.full_name)
    .filter(Boolean)
    .join(", ");
}

export default async function AdminMatchesPage() {
  const season = await getCurrentSeason();

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*, rounds(round_number, name)")
    .eq("season_id", season?.id)
    .in("format", ["match", "best_ball"])
    .order("created_at", { ascending: true });
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("season_id", season?.id)
    .order("name", { ascending: true });

  const teamIds = teams?.map((team) => team.id) ?? [];

  const { data: teamMembers } =
    teamIds.length > 0
      ? await supabase
          .from("team_members")
          .select("team_id, player_id")
          .in("team_id", teamIds)
      : { data: [] };
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

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: matches } =
    competitionIds.length > 0
      ? await supabase
          .from("matches")
          .select("*")
          .in("competition_id", competitionIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  const competitionById = new Map(
    ((competitions as any[]) ?? []).map((competition) => [
      competition.id,
      competition,
    ])
  );

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>

          <h1 className="mt-4 text-5xl font-black">Matches</h1>

          <p className="mt-3 text-danvers-muted">
            Create pairings and matchups for match play, best ball, singles, and
            other head-to-head formats.
          </p>
        </div>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <h2 className="text-2xl font-black">Current Matches</h2>

          <div className="mt-5 grid gap-3">
            {matches?.length ? (
              matches.map((match: any) => {
                const competition = competitionById.get(match.competition_id);

                return (
<div
  key={match.id}
  className="rounded-3xl border border-danvers-border bg-black/20 p-5"
>
                    <p className="text-sm font-bold text-danvers-muted">
  Round {competition?.rounds?.round_number ?? "—"} ·{" "}
  {competition?.name ?? "Competition"}
</p>
<p className="mt-1 text-xs uppercase tracking-[0.2em] text-danvers-brass">
  {competition?.format ?? "match"}
</p>
                    <div className="mt-3 flex items-center gap-3">
 <div className="mb-3 inline-flex rounded-full bg-danvers-green/20 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-danvers-green">
  Ready For Scoring
</div>
  <Link
    href={`/admin/matches/${match.id}`}
    className="rounded-xl bg-danvers-green px-3 py-2 text-xs font-black text-white"
  >
    Open Match
  </Link>

  <DeleteAdminItemButton
    label="match"
    endpoint="/api/admin/matches/delete"
    payload={{ matchId: match.id }}
  />
</div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <div>
                        <p className="font-black">{match.team_a_name}</p>
<p className="mt-1 text-sm text-danvers-muted">
  {playerNames(match.team_a_player_ids ?? [], players)}
</p>

<p className="mt-1 text-xs text-danvers-brass">
  {match.team_a_player_ids?.length ?? 0} player(s)
</p>
                      </div>

                      <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
                        vs
                      </p>

                      <div className="sm:text-right">
                        <p className="font-black">{match.team_b_name}</p>
<p className="mt-1 text-sm text-danvers-muted">
  {playerNames(match.team_b_player_ids ?? [], players)}
</p>

<p className="mt-1 text-xs text-danvers-brass">
  {match.team_b_player_ids?.length ?? 0} player(s)
</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-danvers-border bg-black/20 p-5">
  <p className="text-lg font-black">No matches created yet.</p>
  <p className="mt-2 text-sm leading-6 text-danvers-muted">
    Create matchups below for match play or best ball competitions. Only
    competitions that use matches appear in the builder.
  </p>
</div>
            )}
          </div>
        </section>

        <MatchForm
          competitions={(competitions as any[]) ?? []}
          teams={(teams as any[]) ?? []}
          players={players}
          teamMembers={(teamMembers as any[]) ?? []}
        />
      </section>
    </main>
  );
}