import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  const body = await request.json();
  const sectionId = body.sectionId;

  if (!sectionId) {
    return NextResponse.json(
      { error: "Missing section." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("trip_info_sections")
    .delete()
    .eq("id", sectionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}