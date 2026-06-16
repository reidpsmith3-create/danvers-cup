import Link from "next/link";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em] ${
        ok
          ? "bg-green-600/20 text-green-300"
          : "bg-red-600/20 text-red-300"
      }`}
    >
      {ok ? "Ready" : "Needs Work"}
    </span>
  );
}

function HealthRow({
  label,
  detail,
  ok,
  href,
}: {
  label: string;
  detail: string;
  ok: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-danvers-gold"
    >
      <div>
        <p className="font-black">{label}</p>
        <p className="mt-1 text-sm text-danvers-muted">{detail}</p>
      </div>

      <StatusBadge ok={ok} />
    </Link>
  );
}

export default async function AdminSiteHealthPage() {
  const season = await getCurrentSeason();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, course_id, round_date, tee_time")
    .eq("season_id", season?.id);

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", season?.id);

  const teamIds = teams?.map((team) => team.id) ?? [];

  const { data: teamMembers } =
    teamIds.length > 0
      ? await supabase
          .from("team_members")
          .select("team_id, player_id")
          .in("team_id", teamIds)
      : { data: [] };

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("id, handicap")
    .eq("season_id", season?.id);

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id")
    .eq("season_id", season?.id);

  const { data: scheduleEvents } = await supabase
    .from("schedule_events")
    .select("id")
    .eq("season_id", season?.id)
    .eq("is_visible", true);

  const roundsCount = rounds?.length ?? 0;
  const completeRoundsCount =
    rounds?.filter(
      (round) => round.course_id && round.round_date && round.tee_time
    ).length ?? 0;

  const teamsCount = teams?.length ?? 0;
  const rosteredPlayerIds = new Set(
    ((teamMembers as { player_id: string }[] | null) ?? []).map(
      (member) => member.player_id
    )
  );

  const playersCount = seasonPlayers?.length ?? 0;
  const missingHandicaps =
    seasonPlayers?.filter((player) => player.handicap === null).length ?? 0;

  const checks = [
    {
      label: "Current Season",
      detail: season
        ? `${season.year} · ${season.name}`
        : "No active/upcoming season found.",
      ok: Boolean(season),
      href: "/admin/seasons",
    },
    {
      label: "Rounds",
      detail: `${completeRoundsCount} of ${roundsCount} rounds have course, date, and tee time.`,
      ok: roundsCount > 0 && completeRoundsCount === roundsCount,
      href: "/admin/rounds",
    },
    {
      label: "Teams",
      detail: `${teamsCount} teams created for the current season.`,
      ok: teamsCount >= 2,
      href: "/admin/teams",
    },
    {
      label: "Rosters",
      detail: `${rosteredPlayerIds.size} of ${playersCount} players assigned to teams.`,
      ok: playersCount > 0 && rosteredPlayerIds.size === playersCount,
      href: "/admin/teams",
    },
    {
      label: "Player Handicaps",
      detail: `${missingHandicaps} players missing handicaps.`,
      ok: playersCount > 0 && missingHandicaps === 0,
      href: "/admin/players",
    },
    {
      label: "Competitions",
      detail: `${competitions?.length ?? 0} competitions configured.`,
      ok: (competitions?.length ?? 0) > 0,
      href: "/admin/competitions",
    },
    {
      label: "Trip Events",
      detail: `${scheduleEvents?.length ?? 0} visible non-golf events added.`,
      ok: (scheduleEvents?.length ?? 0) > 0,
      href: "/admin/schedule-events",
    },
  ];

  const readyCount = checks.filter((check) => check.ok).length;

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

          <h1 className="mt-2 text-4xl font-black">Site Health</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            {readyCount} of {checks.length} setup checks are ready.
          </p>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-danvers-green"
              style={{
                width: `${Math.round((readyCount / checks.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        <section className="mt-6 grid gap-3">
          {checks.map((check) => (
            <HealthRow
              key={check.label}
              label={check.label}
              detail={check.detail}
              ok={check.ok}
              href={check.href}
            />
          ))}
        </section>
      </section>
    </main>
  );
}