import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function InfoCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string | null;
  title: string;
  body: string | null;
}) {
  return (
    <section className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-2 text-3xl font-black">{title}</h2>

      {body ? (
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-danvers-muted">
          {body}
        </p>
      ) : null}
    </section>
  );
}

export default async function TripInfoPage() {
  const season = await getCurrentSeason();

  const { data: sections } = await supabase
    .from("trip_info_sections")
    .select("*")
    .eq("season_id", season?.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-danvers-gold">
            Danvers Cup {season?.year ?? ""}
          </p>

          <h1 className="mt-4 text-5xl font-black">Trip Information</h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
            Everything you need for Myrtle Beach — house details,
            transportation, arrival times, food plans, and trip notes.
          </p>
        </section>

        <section className="mt-8 grid gap-4">
          {sections?.length ? (
            sections.map((section) => (
              <InfoCard
                key={section.id}
                eyebrow={section.eyebrow}
                title={section.title}
                body={section.body}
              />
            ))
          ) : (
            <section className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
              <h2 className="text-3xl font-black">No trip info yet</h2>
              <p className="mt-3 text-sm text-danvers-muted">
                Trip information will appear here once it has been added by the
                admin.
              </p>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}