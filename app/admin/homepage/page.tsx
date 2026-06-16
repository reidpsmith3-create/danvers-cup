import Link from "next/link";
import HomepageSettingsForm from "@/components/admin/HomepageSettingsForm";
import { supabase } from "@/lib/supabase";

export default async function AdminHomepagePage() {
  const { data: settings } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", "main")
    .single();

  const { data: defendingSeason } = await supabase
    .from("seasons")
    .select("*")
    .lt("year", 2026)
    .eq("status", "complete")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!settings) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link
            href="/admin"
            className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
          >
            ← Admin
          </Link>

          <h1 className="mt-6 text-4xl font-black">Homepage Editor</h1>

          <p className="mt-4 text-sm text-danvers-muted">
            Homepage settings were not found. Run the homepage_settings SQL
            first.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Admin
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6 shadow-xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Homepage Editor</h1>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Edit homepage copy, images, and defending champion display.
            Schedule data still comes from rounds and courses.
          </p>
        </div>

        <div className="mt-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5">
          <HomepageSettingsForm
            settings={settings}
            defendingSeason={defendingSeason}
          />
        </div>
      </section>
    </main>
  );
}