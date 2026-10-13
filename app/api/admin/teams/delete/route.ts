import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  const body = await request.json();

  const teamId = String(body.teamId ?? "");

  if (!teamId) {
    return NextResponse.json({ error: "Missing team ID." }, { status: 400 });
  }

  const { error: membersError } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  const { error: teamError } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (teamError) {
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}