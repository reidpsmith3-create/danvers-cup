import Link from "next/link";
import { getCurrentSeason } from "@/lib/currentSeason";
import { supabase } from "@/lib/supabase";

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.15em] ${
        ok ? "bg-green-600/20 text-green-300" : "bg-red-600/20 text-red-300"
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

  const roundIds = rounds?.map((round) => round.id) ?? [];
  const courseIds = rounds?.map((round) => round.course_id).filter(Boolean) ?? [];
  const { data: tripInfoSections } = await supabase
  .from("trip_info_sections")
  .select("id")
  .eq("season_id", season?.id)
  .eq("is_visible", true);

  const { data: courseHoles } =
    courseIds.length > 0
      ? await supabase
          .from("course_holes")
          .select("course_id, hole_number")
          .in("course_id", courseIds)
      : { data: [] };

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
    .select("id, player_id, handicap")
    .eq("season_id", season?.id);

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, round_id")
    .eq("season_id", season?.id);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: matches } =
    competitionIds.length > 0
      ? await supabase
          .from("matches")
          .select("id, competition_id")
          .in("competition_id", competitionIds)
      : { data: [] };

  const { data: groups } =
    roundIds.length > 0
      ? await supabase
          .from("round_groups")
          .select("id, round_id")
          .in("round_id", roundIds)
      : { data: [] };

  const { data: liveRounds } = await supabase
  .from("rounds")
  .select("id")
  .eq("season_id", season?.id)
  .eq("status", "live");

const { data: scoreRows } =
  roundIds.length > 0
    ? await supabase
        .from("scores")
        .select("id, round_id")
        .in("round_id", roundIds)
        .limit(1)
    : { data: [] };

  const groupIds = groups?.map((group) => group.id) ?? [];

  const { data: groupPlayers } =
    groupIds.length > 0
      ? await supabase
          .from("group_players")
          .select("group_id, player_id")
          .in("group_id", groupIds)
      : { data: [] };

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

  const uniqueCourseIds = Array.from(new Set(courseIds));
  const coursesWith18Holes = uniqueCourseIds.filter((courseId) => {
    const holesForCourse =
      courseHoles?.filter((hole: any) => hole.course_id === courseId).length ??
      0;

    return holesForCourse >= 18;
  }).length;

  const teamsCount = teams?.length ?? 0;

  const rosteredPlayerIds = new Set(
    ((teamMembers as { player_id: string }[] | null) ?? []).map(
      (member) => member.player_id
    )
  );

  const playersCount = seasonPlayers?.length ?? 0;
  const missingHandicaps =
    seasonPlayers?.filter((player) => player.handicap === null).length ?? 0;

  const groupPlayerIds = new Set(
    ((groupPlayers as { player_id: string }[] | null) ?? []).map(
      (player) => player.player_id
    )
  );

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
      label: "Players",
      detail: `${playersCount} players assigned to the current season.`,
      ok: playersCount > 0,
      href: "/admin/players",
    },
    {
      label: "Player Handicaps",
      detail: `${missingHandicaps} players missing handicaps.`,
      ok: playersCount > 0 && missingHandicaps === 0,
      href: "/admin/players",
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
      label: "Rounds",
      detail: `${completeRoundsCount} of ${roundsCount} rounds have course, date, and tee time.`,
      ok: roundsCount > 0 && completeRoundsCount === roundsCount,
      href: "/admin/rounds",
    },
    {
      label: "Course Scorecards",
      detail: `${coursesWith18Holes} of ${uniqueCourseIds.length} courses have 18 holes loaded.`,
      ok: uniqueCourseIds.length > 0 && coursesWith18Holes === uniqueCourseIds.length,
      href: "/admin/courses",
    },
    {
      label: "Competitions",
      detail: `${competitions?.length ?? 0} competitions configured.`,
      ok: (competitions?.length ?? 0) > 0,
      href: "/admin/competitions",
    },
    {
      label: "Matches",
      detail: `${matches?.length ?? 0} matches created.`,
      ok: (matches?.length ?? 0) > 0,
      href: "/admin/matches",
    },
    {
      label: "Groups / Pairings",
      detail: `${groups?.length ?? 0} groups created. ${groupPlayerIds.size} of ${playersCount} players assigned to groups.`,
      ok:
        (groups?.length ?? 0) > 0 &&
        playersCount > 0 &&
        groupPlayerIds.size === playersCount,
      href: "/admin/groups",
    },
    {
  label: "Live Scoring",
  detail:
    (groups?.length ?? 0) > 0
      ? `${groups?.length ?? 0} groups available for score entry.`
      : "No groups available for score entry.",
  ok: (groups?.length ?? 0) > 0,
  href: "/score-entry",
},
{
  label: "Round Status",
  detail:
    (liveRounds?.length ?? 0) === 1
      ? "Exactly one live round selected."
      : `${liveRounds?.length ?? 0} rounds marked live.`,
  ok: (liveRounds?.length ?? 0) <= 1,
  href: "/admin/rounds",
},
    {
  label: "Trip Info",
  detail: `${tripInfoSections?.length ?? 0} visible trip info cards added.`,
  ok: (tripInfoSections?.length ?? 0) > 0,
  href: "/admin/trip-info",
},
    {
      label: "Trip Events",
      detail: `${scheduleEvents?.length ?? 0} visible non-golf events added.`,
      ok: (scheduleEvents?.length ?? 0) > 0,
      href: "/admin/schedule-events",
    },
  ];

  const readyCount = checks.filter((check) => check.ok).length;
  const percent = Math.round((readyCount / checks.length) * 100);

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
            Commissioner Readiness
          </p>

          <h1 className="mt-2 text-4xl font-black">Site Health</h1>

          <p className="mt-3 text-sm text-danvers-muted">
            {readyCount} of {checks.length} setup checks are ready.
          </p>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-danvers-green"
              style={{ width: `${percent}%` }}
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