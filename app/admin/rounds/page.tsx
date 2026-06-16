import RoundForm from "@/components/admin/RoundForm";
import RoundStatusButton from "@/components/admin/RoundStatusButton";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Round = {
  id: string;
  season_id: string;
  course_id: string | null;
  round_number: number;
  name: string;
  round_date: string | null;
  tee_time: string | null;
  status: string;
  courses:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type Course = {
  id: string;
  name: string;
};

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function AdminRoundsPage() {
  const season = await getCurrentSeason();

  const { data: roundsData } = await supabase
    .from("rounds")
    .select("*, courses(name)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", { ascending: true });

  const rounds = (roundsData as Round[] | null) ?? [];
  const courses = (coursesData as Course[] | null) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>

          <h1 className="mt-4 text-5xl font-black">Rounds</h1>

          <p className="mt-3 text-danvers-muted">
            Manage round details for {season?.year ?? "the current season"}.
          </p>

          <Link
            href="/admin/rounds/new"
            className="mt-5 inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
          >
            New Round
          </Link>
        </div>

        <section className="mt-8 grid gap-4">
          {rounds.map((round) => {
            const course = getSingleRelation(round.courses);

            return (
              <div
                key={round.id}
                className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-brass">
                      Round {round.round_number}
                    </p>

                    <h2 className="mt-2 text-2xl font-black">{round.name}</h2>

                    <p className="mt-2 text-sm text-danvers-muted">
                      {course?.name ?? "Course TBD"}
                    </p>

                    <p className="mt-1 text-sm text-danvers-muted">
                      {round.round_date ?? "Date TBD"} ·{" "}
                      {round.tee_time ?? "Time TBD"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/30 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-danvers-muted">
                    {round.status}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <RoundStatusButton
                    roundId={round.id}
                    status="scheduled"
                    label="Set Scheduled"
                  />
                  <RoundStatusButton
                    roundId={round.id}
                    status="live"
                    label="Set Live"
                  />
                  <RoundStatusButton
                    roundId={round.id}
                    status="complete"
                    label="Set Complete"
                  />
                </div>

                <RoundForm round={round} courses={courses} />
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}