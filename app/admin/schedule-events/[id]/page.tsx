import Link from "next/link";
import ScheduleEventForm from "@/components/admin/ScheduleEventForm";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";
import DeleteAdminItemButton from "@/components/admin/DeleteAdminItemButton";

type EditScheduleEventPageProps = {
  params: {
    id: string;
  };
};

export default async function EditScheduleEventPage({
  params,
}: EditScheduleEventPageProps) {
  const season = await getCurrentSeason();

  const { data: event } = await supabase
    .from("schedule_events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!event || !season) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link
            href="/admin/schedule-events"
            className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
          >
            ← Trip Events
          </Link>
          <h1 className="mt-6 text-4xl font-black">Event not found</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/schedule-events"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Trip Events
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-black">Edit Trip Event</h1>
          <p className="mt-3 text-sm text-danvers-muted">{event.title}</p>
        </div>

        <div className="mt-6">
          <ScheduleEventForm seasonId={season.id} event={event} />
        </div>

        <section className="mt-6 rounded-[2rem] border border-red-500/30 bg-red-500/10 p-5">
          <h2 className="text-2xl font-black text-red-200">Danger Zone</h2>

          <p className="mt-2 text-sm leading-6 text-red-100/80">
            Delete this trip event. This cannot be undone.
          </p>

          <div className="mt-4">
            <DeleteAdminItemButton
              label="trip event"
              endpoint="/api/admin/schedule-events/delete"
              payload={{ eventId: event.id }}
            />
          </div>
        </section>
      </section>
    </main>
  );
}