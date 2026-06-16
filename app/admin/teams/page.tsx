import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TeamRow = {
  id: string;
  name: string;
  color: string | null;
  logo_url: string | null;
};

type TeamMemberRow = {
  team_id: string;
};

export default async function AdminTeamsPage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .in("status", ["upcoming", "active"])
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name, color, logo_url")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const teams = (teamsData as TeamRow[] | null) ?? [];

  const { data: membersData } =
    teams.length > 0
      ? await supabase
          .from("team_members")
          .select("team_id")
          .in(
            "team_id",
            teams.map((team) => team.id)
          )
      : { data: [] };

  const memberCounts = new Map<string, number>();

  ((membersData as TeamMemberRow[] | null) ?? []).forEach((member) => {
    memberCounts.set(
      member.team_id,
      (memberCounts.get(member.team_id) ?? 0) + 1
    );
  });

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

          <h1 className="mt-2 text-4xl font-black">Teams</h1>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Manage season-specific Danvers Cup teams, logos, colors, and
            rosters.
          </p>

          {season ? (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-danvers-muted">
                  Current Admin Season
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  {season.year} · {season.name}
                </p>
              </div>

              <Link
                href="/admin/teams/new"
                className="rounded-full bg-danvers-gold px-4 py-3 text-xs font-black uppercase tracking-[0.15em] text-black"
              >
                New Team
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm font-bold text-red-200">
                No upcoming or active season found.
              </p>
            </div>
          )}
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {teams.map((team) => {
            const teamColor = team.color || "#1f7a4d";

            return (
              <Link
                key={team.id}
                href={`/admin/teams/${team.id}`}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-danvers-surface/80 transition hover:border-danvers-gold"
              >
                <div
                  className="h-2"
                  style={{
                    background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
                  }}
                />

                <div className="p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border text-xl font-black text-danvers-gold"
                      style={{
                        borderColor: teamColor,
                        backgroundColor: `${teamColor}33`,
                      }}
                    >
                      {team.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        team.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl font-black">{team.name}</h2>

                      <p className="mt-1 text-sm text-danvers-muted">
                        {memberCounts.get(team.id) ?? 0} players
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </section>
    </main>
  );
}