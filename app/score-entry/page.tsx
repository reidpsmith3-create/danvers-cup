import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ScoreEntryForm from "@/components/score-entry/ScoreEntryForm";
import { getCurrentRound } from "@/lib/rounds/getCurrentRound";
import { getCurrentSeason } from "@/lib/currentSeason";

type ScoreEntryPageProps = {
  searchParams?: {
    round?: string;
  };
};

export default async function ScoreEntryPage({
  searchParams,
}: ScoreEntryPageProps) {
  const requestedRoundNumber = searchParams?.round
  ? Number(searchParams.round)
  : null;

  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, courses(name)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const liveRound = rounds?.find((item) => item.status === "live");

const round = requestedRoundNumber
  ? rounds?.find((item) => item.round_number === requestedRoundNumber) ??
    liveRound ??
    rounds?.[0]
  : liveRound ?? rounds?.[0];

  const { data: players } = await supabase
    .from("season_players")
    .select("player_id, players(full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const scorePlayers =
    players?.map((row: any) => ({
      playerId: row.player_id,
      playerName: row.players?.full_name ?? "Unknown Player",
    })) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Scorekeeper
          </p>

          <h1 className="mt-4 text-5xl font-black">Score Entry</h1>

          <p className="mt-3 text-danvers-muted">
            {round?.name ?? "Round 1"} · {round?.courses?.name ?? "Course TBD"}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {rounds?.map((roundOption) => {
              const isActive =
                roundOption.round_number === round?.round_number;

              return (
                <Link
                  key={roundOption.id}
                  href={`/score-entry?round=${roundOption.round_number}`}
                  className={`rounded-2xl px-4 py-3 text-center text-sm font-black ${
                    isActive
                      ? "bg-danvers-green text-white"
                      : "border border-danvers-border bg-black/20 text-danvers-muted"
                  }`}
                >
                  Round {roundOption.round_number}
                </Link>
              );
            })}
          </div>
        </div>

        {round ? (
          <ScoreEntryForm roundId={round.id} players={scorePlayers} />
        ) : (
          <p className="mt-6 text-danvers-muted">No round found.</p>
        )}
      </section>
    </main>
  );
}