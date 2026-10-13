import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  const body = await request.json();

  if (!body.competitionId) {
    return NextResponse.json({ error: "Missing competition ID." }, { status: 400 });
  }

  const { error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", body.competitionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}