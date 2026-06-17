import Link from "next/link";
import FinalizeSeasonButton from "@/components/admin/FinalizeSeasonButton";
import { getCurrentSeason } from "@/lib/currentSeason";

const adminLinks = [
  {
    href: "/admin/homepage",
    title: "Homepage",
    description: "Edit homepage text, labels, dashboard copy, and feature cards.",
  },
  {
  href: "/admin/seasons",
  title: "Seasons",
  description: "Create and manage yearly Danvers Cup seasons.",
},
  {
    href: "/admin/site-health",
    title: "Site Health",
    description: "Check whether the current season is ready for the trip.",
  },
    {
    href: "/admin/players",
    title: "Players",
    description:
      "Manage player bios, photos, handicaps, and Danvers Cup profiles.",
  },
  {
  href: "/admin/teams",
  title: "Teams",
  description: "Manage yearly teams, logos, colors, and roster assignments.",
},
  {
    href: "/admin/rounds",
    title: "Rounds",
    description: "Set the current round as scheduled, live, or complete.",
  },
  {
  href: "/admin/groups",
  title: "Groups / Pairings",
  description:
    "Create round groups, assign players to foursomes, and set scorekeepers.",
},
    {
    href: "/admin/schedule-events",
    title: "Trip Events",
    description: "Add non-golf schedule items like dinners, arrival, and pairings night.",
  },
  {
  href: "/admin/trip-info",
  title: "Trip Info",
  description:
    "Manage lodging details, packing lists, course notes, restaurants, FAQs, and other trip information.",
},
    {
    href: "/admin/courses",
    title: "Courses",
    description: "Manage course names, locations, websites, and logos.",
  },
  {
    href: "/admin/competitions",
    title: "Competitions",
    description: "Create events, formats, scoring settings, and calculators.",
  },
  {
    href: "/admin/matches",
    title: "Matches",
    description: "Build matchups and score match-play holes.",
  },
  {
    href: "/admin/results",
    title: "Official Results",
    description: "Enter, review, and delete official standings results.",
  },
  {
    href: "/score-entry",
    title: "Score Entry",
    description: "Enter raw hole-by-hole gross scores.",
  },
];

export default async function AdminPage() {
  const season = await getCurrentSeason();

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Admin
          </p>
          <h1 className="mt-4 text-5xl font-black">Commissioner Tools</h1>
          <p className="mt-3 text-danvers-muted">
            Manage homepage content, competitions, matches, scoring, and
            official results.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6 transition hover:border-danvers-green"
            >
              <h2 className="text-2xl font-black">{link.title}</h2>
              <p className="mt-3 text-sm leading-6 text-danvers-muted">
                {link.description}
              </p>
            </Link>
          ))}
        </section>

        {season ? (
          <section className="mt-8">
            <FinalizeSeasonButton seasonId={season.id} />
          </section>
        ) : null}
      </section>
    </main>
  );
}