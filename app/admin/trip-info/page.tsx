import TripInfoForm from "@/components/admin/TripInfoForm";
import DeleteAdminItemButton from "@/components/admin/DeleteAdminItemButton";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTripInfoPage() {
  const season = await getCurrentSeason();

  const { data: sections } = await supabase
    .from("trip_info_sections")
    .select("*")
    .eq("season_id", season?.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>

          <h1 className="mt-4 text-5xl font-black">Trip Info</h1>

          <p className="mt-3 text-danvers-muted">
            Add, edit, reorder, and hide trip information sections.
          </p>
        </section>

        <section className="mt-8 grid gap-6">
          {sections?.map((section: any) => (
            <div
              key={section.id}
              className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-5"
            >
              <TripInfoForm
                seasonId={season?.id ?? ""}
                section={section}
              />

              <div className="mt-4">
                <DeleteAdminItemButton
                  label="trip info section"
                  endpoint="/api/admin/trip-info/delete"
                  payload={{
                    sectionId: section.id,
                  }}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
          <h2 className="text-xl font-black">Add Section</h2>

          <div className="mt-4">
            <TripInfoForm seasonId={season?.id ?? ""} />
          </div>
        </section>
      </section>
    </main>
  );
}