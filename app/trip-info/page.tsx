import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getIcon(title: string) {
  const lower = title.toLowerCase();

  if (lower.includes("snapshot")) return "📌";
  if (lower.includes("arrival")) return "✈️";
  if (lower.includes("house")) return "🏠";
  if (lower.includes("van") || lower.includes("transport")) return "🚐";
  if (lower.includes("food") || lower.includes("grocer")) return "🍔";
  if (lower.includes("note") || lower.includes("misc")) return "📝";

  return "ℹ️";
}

function getSnapshotItems(body: string | null) {
  if (!body) return [];

  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function InfoCard({ section }: { section: any }) {
  const icon = getIcon(`${section.eyebrow ?? ""} ${section.title}`);
  const isSnapshot = section.title?.toLowerCase().includes("snapshot");
  const snapshotItems = getSnapshotItems(section.body);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-danvers-border bg-danvers-surface">
      {section.image_url ? (
        <div
          className="h-52 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.78)), url(${section.image_url})`,
          }}
        />
      ) : null}

      <div className="p-6">
        {section.eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
            {section.eyebrow}
          </p>
        ) : null}

        <h2 className="mt-2 flex items-center gap-3 text-3xl font-black">
          <span>{icon}</span>
          <span>{section.title}</span>
        </h2>

        {isSnapshot && snapshotItems.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {snapshotItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold text-danvers-muted"
              >
                {item}
              </div>
            ))}
          </div>
        ) : section.body ? (
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-danvers-muted">
            {section.body}
          </p>
        ) : null}

        {(section.primary_button_label && section.primary_button_url) ||
        (section.secondary_button_label && section.secondary_button_url) ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {section.primary_button_label && section.primary_button_url ? (
              <a
                href={section.primary_button_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
              >
                {section.primary_button_label}
              </a>
            ) : null}

            {section.secondary_button_label && section.secondary_button_url ? (
              <a
                href={section.secondary_button_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-danvers-gold/30 bg-black/30 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
              >
                {section.secondary_button_label}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
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

  const heroImage =
    (sections as any[] | null)?.find((section) => section.image_url)
      ?.image_url ?? null;

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <section
          className="overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black bg-cover bg-center p-6 shadow-2xl shadow-black/50"
          style={
            heroImage
              ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.92)), url(${heroImage})`,
                }
              : undefined
          }
        >
          <p className="text-xs font-black uppercase tracking-[0.45em] text-danvers-gold">
            Danvers Cup {season?.year ?? ""}
          </p>

          <h1 className="mt-4 text-5xl font-black">Trip Information</h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
            Everything you need for Myrtle Beach — house details,
            transportation, arrival times, food plans, and trip notes.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Location", season?.location ?? "Myrtle Beach"],
              ["Dates", "Oct 22–26"],
              ["Rounds", "3"],
              ["Players", "8"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 text-center backdrop-blur"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                  {label}
                </p>
                <p className="mt-2 text-lg font-black text-danvers-gold">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4">
          {sections?.length ? (
            sections.map((section) => (
              <InfoCard key={section.id} section={section} />
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