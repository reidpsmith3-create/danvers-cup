import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCompetitionScoringRule } from "@/lib/scoring/competitionScoring";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(dateString: string | null) {
  if (!dateString) return "Date TBD";

  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeString: string | null) {
  if (!timeString) return "Time TBD";

  const [hourString, minuteString] = timeString.split(":");
  const date = new Date();
  date.setHours(Number(hourString), Number(minuteString), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

type ItineraryItem =
  | {
      id: string;
      kind: "round";
      date: string | null;
      time: string | null;
      round: any;
    }
  | {
      id: string;
      kind: "event";
      date: string | null;
      time: string | null;
      event: any;
    };

export default async function SchedulePage() {
  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, courses(name, city, state)")
    .eq("season_id", season?.id)
    .order("round_date", { ascending: true })
    .order("tee_time", { ascending: true });

  const { data: competitions } = await supabase
    .from("competitions")
    .select(
      "id, round_id, name, format, scoring_basis, counts_for_team_points, counts_for_individual_points"
    )
    .eq("season_id", season?.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: true });

  const { data: scheduleEvents } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("season_id", season?.id)
    .eq("is_visible", true)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  const competitionsByRoundId = ((competitions as any[]) ?? []).reduce(
    (acc, competition) => {
      if (!acc[competition.round_id]) {
        acc[competition.round_id] = [];
      }

      acc[competition.round_id].push(competition);

      return acc;
    },
    {} as Record<string, any[]>
  );

  const itineraryItems: ItineraryItem[] = [
    ...((rounds as any[]) ?? []).map((round) => ({
      id: `round-${round.id}`,
      kind: "round" as const,
      date: round.round_date,
      time: round.tee_time,
      round,
    })),
    ...((scheduleEvents as any[]) ?? []).map((event) => ({
      id: `event-${event.id}`,
      kind: "event" as const,
      date: event.event_date,
      time: event.event_time,
      event,
    })),
  ].sort((a, b) => {
    const aDate = `${a.date ?? "9999-12-31"}T${a.time ?? "23:59:59"}`;
    const bDate = `${b.date ?? "9999-12-31"}T${b.time ?? "23:59:59"}`;

    return aDate.localeCompare(bDate);
  });

  const groupedItems = itineraryItems.reduce((acc, item) => {
    const key = item.date ?? "Date TBD";

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            {season?.year ?? "Danvers Cup"}
          </p>

          <h1 className="mt-4 text-5xl font-black">Schedule</h1>

          <p className="mt-3 max-w-2xl text-danvers-muted">
            Golf rounds, arrival plans, dinners, pairings, and everything else
            on the trip itinerary.
          </p>
        </div>

        <section className="mt-8 grid gap-8">
          {Object.entries(groupedItems).map(([date, items]) => (
            <section key={date}>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
                  Itinerary
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {formatDate(date === "Date TBD" ? null : date)}
                </h2>
              </div>

              <div className="grid gap-4">
                {items.map((item) => {
                  if (item.kind === "round") {
                    const round = item.round;
                    const roundCompetitions =
                      competitionsByRoundId[round.id] ?? [];

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-3xl border border-danvers-border bg-danvers-surface"
                      >
                        <div className="h-1 bg-danvers-green" />

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                                  Golf · Round {round.round_number}
                                </p>

                                <span className="rounded-full border border-danvers-border px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-danvers-muted">
                                  {round.status}
                                </span>
                              </div>

                              <h3 className="mt-2 text-2xl font-black">
                                {round.name}
                              </h3>

                              <Link
  href={`/courses/${round.course_id}`}
  className="mt-3 block font-black text-danvers-gold hover:underline"
>
  {round.courses?.name}
</Link>

                             <p className="mt-2 text-sm font-bold text-danvers-muted">
  📍 {round.courses?.city}, {round.courses?.state}
</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                                Tee Time
                              </p>

                              <p className="mt-1 text-lg font-black text-danvers-text">
                                {formatTime(round.tee_time)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-2xl border border-danvers-border bg-black/20 p-4">
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-muted">
                              Competitions
                            </p>

                            <div className="mt-3 grid gap-3">
                              {roundCompetitions.length ? (
                                roundCompetitions.map((competition: any) => {
                                  const scoringRule =
                                    getCompetitionScoringRule(
                                      competition.format
                                    );

                                  return (
                                    <Link
                                      key={competition.id}
                                      href={`/competitions/${competition.id}`}
                                      className="rounded-2xl border border-danvers-border bg-black/20 p-4 transition hover:border-danvers-green"
                                    >
                                      <p className="font-black">
                                        {competition.name}
                                      </p>

                                      <p className="mt-1 text-sm text-danvers-muted">
                                        {scoringRule.label} ·{" "}
                                        {competition.scoring_basis}
                                      </p>

                                      <p className="mt-1 text-xs text-danvers-muted">
                                        Team points:{" "}
                                        {competition.counts_for_team_points
                                          ? "Yes"
                                          : "No"}{" "}
                                        · Individual points:{" "}
                                        {competition.counts_for_individual_points
                                          ? "Yes"
                                          : "No"}
                                      </p>
                                    </Link>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-danvers-muted">
                                  No competitions attached to this round yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  const event = item.event;

                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-danvers-border bg-danvers-surface p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                            {event.event_type}
                          </p>

                          <h3 className="mt-2 text-2xl font-black">
                            {event.title}
                          </h3>

                          {event.description ? (
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-danvers-muted">
                              {event.description}
                            </p>
                          ) : null}

                          <p className="mt-3 text-sm font-bold text-danvers-muted">
  📍 {event.location ?? "Location TBD"}
</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                            Time
                          </p>

                          <p className="mt-1 text-lg font-black text-danvers-text">
                            {formatTime(event.event_time)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {!itineraryItems.length ? (
            <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-6">
              <p className="text-danvers-muted">
                No schedule items have been added yet.
              </p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}