import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const teamId = String(body.teamId ?? "");

  if (!teamId) {
    return NextResponse.json({ error: "Missing team ID." }, { status: 400 });
  }

const rosterPlayerIds = Array.isArray(body.rosterPlayerIds)
  ? body.rosterPlayerIds.map((id: unknown) => String(id))
  : [];
  const { data: team, error: teamLookupError } = await supabase
    .from("teams")
    .select("season_id")
    .eq("id", teamId)
    .single();

  if (teamLookupError || !team) {
    return NextResponse.json(
      { error: teamLookupError?.message ?? "Team not found." },
      { status: 500 }
    );
  }

  const { data: seasonTeams, error: seasonTeamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("season_id", team.season_id);

  if (seasonTeamsError) {
    return NextResponse.json(
      { error: seasonTeamsError.message },
      { status: 500 }
    );
  }

  const seasonTeamIds = seasonTeams?.map((seasonTeam) => seasonTeam.id) ?? [];

  const { error: teamError } = await supabase
    .from("teams")
    .update({
      name: String(body.name ?? ""),
      color: String(body.color ?? ""),
      logo_url: String(body.logoUrl ?? ""),
    })
    .eq("id", teamId);

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  if (seasonTeamIds.length > 0 && rosterPlayerIds.length > 0) {
    const { error: removeFromOtherTeamsError } = await supabase
      .from("team_members")
      .delete()
      .in("team_id", seasonTeamIds)
      .in("player_id", rosterPlayerIds);

    if (removeFromOtherTeamsError) {
      return NextResponse.json(
        { error: removeFromOtherTeamsError.message },
        { status: 500 }
      );
    }
  }

  const { error: deleteCurrentTeamError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId);

  if (deleteCurrentTeamError) {
    return NextResponse.json(
      { error: deleteCurrentTeamError.message },
      { status: 500 }
    );
  }

  if (rosterPlayerIds.length > 0) {
    const { error: insertError } = await supabase.from("team_members").insert(
      rosterPlayerIds.map((playerId: string) => ({
        team_id: teamId,
        player_id: playerId,
      }))
    );

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}