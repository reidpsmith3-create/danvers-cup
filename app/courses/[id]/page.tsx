import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CoursePageProps = {
  params: {
    id: string;
  };
};

function getTotal(rows: any[], key: "par" | "yardage") {
  return rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
}
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

export default async function CoursePage({ params }: CoursePageProps) {
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!course) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black">Course not found</h1>
          <Link href="/schedule" className="mt-4 block text-danvers-muted">
            Back to schedule
          </Link>
        </section>
      </main>
    );
  }

  const { data: holes } = await supabase
    .from("course_holes")
    .select("*")
    .eq("course_id", course.id)
    .order("hole_number", { ascending: true });

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, round_number, name, round_date, tee_time, seasons(year)")
    .eq("course_id", course.id)
    .order("round_date", { ascending: false });

  const holeRows = (holes as any[]) ?? [];
  const frontNine = holeRows.filter((hole) => hole.hole_number <= 9);
  const backNine = holeRows.filter((hole) => hole.hole_number >= 10);

  const totalPar = getTotal(holeRows, "par");
  const totalYardage = getTotal(holeRows, "yardage");

  const heroStyle = course.hero_image_url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.92)), url(${course.hero_image_url})`,
      }
    : undefined;
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  [course.name, course.city, course.state].filter(Boolean).join(", ")
)}`;
  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/schedule"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to Schedule
        </Link>

        <section
          className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black bg-cover bg-center p-6 shadow-2xl shadow-black/50"
          style={heroStyle}
        >
          <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
            Course Profile
          </p>

          <h1 className="mt-4 text-5xl font-black">{course.name}</h1>

          <p className="mt-4 text-sm font-bold text-danvers-muted">
            📍 {course.city ?? "City TBD"}, {course.state ?? "State TBD"}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                Par
              </p>
              <p className="mt-2 text-2xl font-black text-danvers-gold">
                {totalPar || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                Yards
              </p>
              <p className="mt-2 text-2xl font-black text-danvers-gold">
                {totalYardage ? totalYardage.toLocaleString() : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                Holes
              </p>
              <p className="mt-2 text-2xl font-black text-danvers-gold">
                {holeRows.length || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
  {course.website_url ? (
    <a
      href={course.website_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
    >
      Visit Website
    </a>
  ) : null}

  <a
    href={mapsUrl}
    target="_blank"
    rel="noreferrer"
    className="inline-flex rounded-full border border-danvers-gold/30 bg-black/40 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
  >
    Open in Maps
  </a>
</div>
        </section>

        {rounds?.length ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
              Danvers Cup Schedule
            </p>

            <h2 className="mt-2 text-3xl font-black">Scheduled Rounds</h2>

            <div className="mt-5 grid gap-3">
              {rounds.map((round: any) => (
                <div
                  key={round.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                 <p className="text-xs font-black uppercase tracking-[0.2em] text-danvers-gold">
  {round.seasons?.year ?? "Season"} · Round {round.round_number}
</p>

<p className="mt-1 text-lg font-black">{round.name}</p>

<p className="mt-2 text-sm text-danvers-muted">
  {formatDate(round.round_date)}
</p>

<p className="mt-1 text-sm font-black text-danvers-gold">
  {formatTime(round.tee_time)}
</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {course.notes ? (
          <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
              Notes
            </p>

            <h2 className="mt-2 text-3xl font-black">Course Notes</h2>

            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-danvers-muted">
              {course.notes}
            </p>
          </section>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
            Scorecard
          </p>

          <h2 className="mt-2 text-3xl font-black">Course Card</h2>

          {holeRows.length ? (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-danvers-border bg-black/20">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-danvers-border text-left text-xs uppercase tracking-[0.2em] text-danvers-muted">
                    <th className="p-3">Hole</th>
                    {holeRows.map((hole) => (
                      <th key={hole.id} className="p-3 text-center">
                        {hole.hole_number}
                      </th>
                    ))}
                    <th className="p-3 text-center">Total</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-danvers-border">
                    <td className="p-3 font-black">Par</td>
                    {holeRows.map((hole) => (
                      <td key={hole.id} className="p-3 text-center font-black">
                        {hole.par ?? "—"}
                      </td>
                    ))}
                    <td className="p-3 text-center font-black">
                      {totalPar || "—"}
                    </td>
                  </tr>

                  <tr className="border-b border-danvers-border text-danvers-muted">
                    <td className="p-3 font-black">Yards</td>
                    {holeRows.map((hole) => (
                      <td key={hole.id} className="p-3 text-center font-black">
                        {hole.yardage ?? "—"}
                      </td>
                    ))}
                    <td className="p-3 text-center font-black">
                      {totalYardage ? totalYardage.toLocaleString() : "—"}
                    </td>
                  </tr>

                  <tr className="text-danvers-muted">
                    <td className="p-3 font-black">HCP</td>
                    {holeRows.map((hole) => (
                      <td key={hole.id} className="p-3 text-center font-black">
                        {hole.handicap_number ?? "—"}
                      </td>
                    ))}
                    <td className="p-3 text-center font-black">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-5 text-sm text-danvers-muted">
              No hole data has been added for this course yet.
            </p>
          )}

          {frontNine.length || backNine.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                  Front
                </p>
                <p className="mt-2 text-xl font-black text-danvers-gold">
                  Par {getTotal(frontNine, "par") || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                  Back
                </p>
                <p className="mt-2 text-xl font-black text-danvers-gold">
                  Par {getTotal(backNine, "par") || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                  Total
                </p>
                <p className="mt-2 text-xl font-black text-danvers-gold">
                  Par {totalPar || "—"}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}