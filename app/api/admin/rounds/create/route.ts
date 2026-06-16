import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const seasonId = String(body.seasonId ?? "");
  const roundNumber = Number(body.roundNumber);
  const name = String(body.name ?? "").trim();
  const status = String(body.status ?? "scheduled");

  if (!seasonId) {
    return NextResponse.json({ error: "Missing season ID." }, { status: 400 });
  }

  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    return NextResponse.json(
      { error: "Round number must be a valid whole number." },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json({ error: "Round name is required." }, { status: 400 });
  }

  if (!["scheduled", "live", "complete"].includes(status)) {
    return NextResponse.json({ error: "Invalid round status." }, { status: 400 });
  }

  const { error } = await supabase.from("rounds").insert({
    season_id: seasonId,
    round_number: roundNumber,
    name,
    course_id: String(body.courseId ?? "").trim() || null,
    round_date: String(body.roundDate ?? "").trim() || null,
    tee_time: String(body.teeTime ?? "").trim() || null,
    status,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}