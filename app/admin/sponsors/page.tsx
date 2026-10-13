import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import SponsorManager from "@/components/admin/SponsorManager";

export const dynamic = "force-dynamic";

type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
};

export default async function AdminSponsorsPage() {
  const { data, error } = await supabaseAdmin
    .from("sponsors")
    .select("id, name, logo_url, website_url")
    .order("name", { ascending: true });

  const sponsors = (data ?? []) as Sponsor[];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
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

          <h1 className="mt-2 text-4xl font-black">Sponsors</h1>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Create sponsors, upload logos, and manage sponsor websites.
            Sponsors can be assigned to multiple players.
          </p>
        </div>

        {error ? (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
            Unable to load sponsors: {error.message}
          </p>
        ) : (
          <div className="mt-6">
            <SponsorManager sponsors={sponsors} />
          </div>
        )}
      </section>
    </main>
  );
}
