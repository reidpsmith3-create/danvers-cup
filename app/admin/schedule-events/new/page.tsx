import Link from "next/link";
import ScheduleEventForm from "@/components/admin/ScheduleEventForm";
import { getCurrentSeason } from "@/lib/currentSeason";

export default async function NewScheduleEventPage() {
  const season = await getCurrentSeason();

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
          <h1 className="mt-2 text-4xl font-black">New Trip Event</h1>
        </div>

        <div className="mt-6">
          <ScheduleEventForm seasonId={season?.id ?? ""} />
        </div>
      </section>
    </main>
  );
}