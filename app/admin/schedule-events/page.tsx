import Link from "next/link";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

type ScheduleEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  event_type: string;
  is_visible: boolean;
};

export default async function AdminScheduleEventsPage() {
  const season = await getCurrentSeason();

  const { data } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("season_id", season?.id)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  const events = (data as ScheduleEvent[] | null) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Admin
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Trip Events</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            Add non-golf schedule items for {season?.year ?? "the current trip"}.
          </p>

          <Link
            href="/admin/schedule-events/new"
            className="mt-5 inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
          >
            New Event
          </Link>
        </div>

        <section className="mt-6 grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/admin/schedule-events/${event.id}`}
              className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5 transition hover:border-danvers-gold"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-gold">
                    {event.event_type}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">{event.title}</h2>

                  <p className="mt-2 text-sm text-danvers-muted">
                    {event.location ?? "Location TBD"}
                  </p>

                  <p className="mt-1 text-sm text-danvers-muted">
                    {event.event_date ?? "Date TBD"} ·{" "}
                    {event.event_time ?? "Time TBD"}
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-danvers-muted">
                  {event.is_visible ? "Visible" : "Hidden"}
                </span>
              </div>
            </Link>
          ))}

          {!events.length ? (
            <div className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
              <p className="text-danvers-muted">No trip events yet.</p>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}