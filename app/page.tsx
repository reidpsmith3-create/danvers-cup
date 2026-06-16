import Link from "next/link";
import { supabase } from "@/lib/supabase";

function formatRoundDate(date?: string | null) {
  if (!date) return "Date TBD";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTeeTime(time?: string | null) {
  if (!time) return "Time TBD";

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString ?? "0");

  if (!Number.isFinite(hour)) return time;

  return new Date(2026, 0, 1, hour, minute).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
export default async function Home() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const { data: defendingSeason } = await supabase
    .from("seasons")
    .select("*")
    .lt("year", 2026)
    .eq("status", "complete")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", "main")
    .single();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, round_number, name, round_date, tee_time, status, courses(name, city, state)")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

      const { data: fieldPlayers } = await supabase
    .from("season_players")
    .select("players(id, full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const nextRound =
    rounds?.find((round) => round.status === "live") ??
    rounds?.find((round) => round.status === "scheduled") ??
    rounds?.[0];

  const liveRound = rounds?.find((round) => round.status === "live");

  const heroStyle = settings?.hero_image_url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.92)), url(${settings.hero_image_url})`,
      }
    : undefined;

  const nextRoundStyle = settings?.next_round_image_url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.88)), url(${settings.next_round_image_url})`,
      }
    : undefined;

  const historyStyle = settings?.history_image_url
    ? {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.88)), url(${settings.history_image_url})`,
      }
    : undefined;

  return (
    <main className="min-h-screen overflow-hidden px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <section
          className="relative overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black bg-cover bg-center p-6 shadow-2xl shadow-black/50"
          style={heroStyle}
        >
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-danvers-green/25 blur-3xl" />
          <div className="absolute -bottom-28 left-4 h-72 w-72 rounded-full bg-danvers-gold/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-danvers-gold/40 bg-black/40 shadow-lg shadow-black/30">
                <span className="text-3xl font-black text-danvers-gold">
                  D
                </span>
              </div>

              <div className="rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                  2026
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {settings?.eyebrow ?? "The Danvers Cup"}
              </p>

              <h1 className="mt-4 text-6xl font-extrabold leading-none tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
                {settings?.title ?? season?.name ?? "Danvers Cup"}
              </h1>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {settings?.location ??
                  season?.location ??
                  "Myrtle Beach, South Carolina"}
              </p>

              <p className="mt-2 text-sm font-medium text-white/75 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {settings?.dates ?? "October 22–26, 2026"}
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/45 p-5 backdrop-blur">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    liveRound ? "bg-green-400" : "bg-danvers-gold"
                  }`}
                />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-muted">
                  Status
                </p>
              </div>

              <div className="mt-4 flex items-end justify-between gap-5">
                <div>
                  <h2 className="text-3xl font-black">
                    {liveRound
                      ? settings?.live_title ?? "Live Now"
                      : settings?.scheduled_title ?? "Scheduled"}
                  </h2>
                  <p className="mt-1 text-sm text-danvers-muted">
                    {liveRound
                      ? settings?.live_subtitle ??
                        `${liveRound.name} is underway`
                      : settings?.scheduled_subtitle ?? "Myrtle Beach awaits"}
                  </p>
                </div>

                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-danvers-green/60 bg-black/50">
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">0%</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                      Complete
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {nextRound &&
          (() => {
            const course = getSingleRelation(nextRound.courses);

            return (
          <section className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              {settings?.next_up_label ?? "Next Up"}
            </p>

            <Link
              href="/schedule"
              className="block overflow-hidden rounded-3xl border border-danvers-green/30 bg-gradient-to-br from-danvers-surface to-black/50 bg-cover bg-center shadow-xl shadow-black/20"
              style={nextRoundStyle}
            >
              <div className="h-1 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

              <div className="min-h-[260px] p-5 flex flex-col justify-end">
                <div className="inline-flex rounded-full bg-danvers-green/20 px-3 py-1">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                    Round {nextRound.round_number}
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">{nextRound.name}</h2>
                    <p className="mt-2 text-sm font-medium text-danvers-muted">
                      {course?.name}
                    </p>
                    <p className="mt-1 text-sm text-danvers-muted">
                      {course?.city}, {course?.state}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {formatRoundDate(nextRound.round_date)}
                    </p>
                    <p className="mt-1 text-lg font-black text-danvers-gold">
                      {formatTeeTime(nextRound.tee_time)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </section>
            );
          })()}

        <section className="mt-6 grid grid-cols-4 gap-3">
          {[
            { label: "Schedule", href: "/schedule", icon: "📅" },
            { label: "Live", href: "/live", icon: "📡" },
            { label: "Standings", href: "/standings", icon: "🏆" },
            { label: "History", href: "/history", icon: "🏛️" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-danvers-surface/80 p-3 text-center shadow-lg shadow-black/20"
            >
              <div className="text-2xl">{item.icon}</div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                {item.label}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-4">
          <div className="rounded-3xl border border-danvers-green/30 bg-gradient-to-br from-danvers-green/20 to-black/40 p-5 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-gold">
                  2026 Snapshot
                </p>
                <h2 className="mt-3 text-2xl font-black">
                  Three Days. Eight Players. One Cup.
                </h2>
              </div>

              <div className="rounded-full border border-danvers-gold/30 bg-danvers-gold/10 px-3 py-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-gold">
                  Pre-Cup
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">3</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Courses
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">8</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Players
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                <p className="text-2xl font-black text-white">1</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-danvers-muted">
                  Cup
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {["Caledonia", "King's North", "Prestwick"].map((course, index) => (
                <div
                  key={course}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danvers-gold">
                      Round {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {course}
                    </p>
                  </div>

                  <span className="text-sm text-danvers-muted">→</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-10 rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-surface to-black/50 p-6 shadow-xl shadow-black/20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
                The Field
              </p>
              <h2 className="mt-2 text-3xl font-black">2026 Players</h2>
            </div>

            <Link
              href="/players"
              className="text-xs font-bold uppercase tracking-[0.18em] text-danvers-gold"
            >
              View All
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fieldPlayers?.map((row) => {
              const player = Array.isArray(row.players)
                ? row.players[0]
                : row.players;

              const name = player?.full_name ?? "Player TBD";
              const initials = name
                .split(" ")
                .map((part: string) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Link
                  key={player?.id ?? name}
                  href={player?.id ? `/players/${player.id}` : "/players"}
                  className="rounded-3xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danvers-gold/30 bg-danvers-gold/10 text-sm font-black text-danvers-gold">
                    {initials}
                  </div>

                  <p className="mt-4 text-sm font-black text-white">
                    {name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {defendingSeason && (
          <section className="mt-10 rounded-[2rem] border border-danvers-green/30 bg-gradient-to-br from-danvers-green/20 to-black/50 p-6 shadow-xl shadow-black/20">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Defending Champions
            </p>

            <h2 className="mt-3 text-3xl font-black">The Teams to Beat</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                  Team Champions
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  {defendingSeason.team_champion_name || "TBD"}
                </h3>

                <p className="mt-2 text-sm text-danvers-muted">
                  {defendingSeason.year} Danvers Cup Champions
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold">
                  Individual Champion
                </p>

                <h3 className="mt-3 text-2xl font-black">
                  {defendingSeason.individual_champion_name || "TBD"}
                </h3>

                <p className="mt-2 text-sm text-danvers-muted">
                  {defendingSeason.year} Individual Champion
                </p>
              </div>
            </div>
          </section>
        )}
        <section
          className="mt-10 rounded-[2rem] border border-danvers-gold/25 bg-gradient-to-br from-danvers-green/20 via-danvers-surface to-black bg-cover bg-center p-6"
          style={historyStyle}
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            History
          </p>
          <h2 className="mt-3 text-3xl font-black">
            {settings?.history_title ?? "History Lives Here"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-danvers-muted">
            {settings?.history_body ??
              "Champions, records, photos, and trip recaps will build the Danvers Cup archive year by year."}
          </p>

          <Link
            href="/history"
            className="mt-6 inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
          >
            {settings?.history_button_label ?? "View History"}
          </Link>
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/admin"
            className="text-xs font-bold uppercase tracking-[0.25em] text-danvers-muted hover:text-danvers-text"
          >
            Admin
          </Link>
        </div>
      </section>
    </main>
  );
}