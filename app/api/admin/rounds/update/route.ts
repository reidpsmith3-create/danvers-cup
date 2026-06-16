import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  const roundId = String(body.roundId ?? "");
  const roundNumber = Number(body.roundNumber);

  if (!roundId) {
    return NextResponse.json({ error: "Missing round ID." }, { status: 400 });
  }

  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    return NextResponse.json(
      { error: "Round number must be a valid whole number." },
      { status: 400 }
    );
  }

  const status = String(body.status ?? "scheduled");

  if (!["scheduled", "live", "complete"].includes(status)) {
    return NextResponse.json({ error: "Invalid round status." }, { status: 400 });
  }

  const update = {
    round_number: roundNumber,
    name: String(body.name ?? "").trim(),
    course_id: String(body.courseId ?? "").trim() || null,
    round_date: String(body.roundDate ?? "").trim() || null,
    tee_time: String(body.teeTime ?? "").trim() || null,
    status,
  };

  const { error } = await supabase
    .from("rounds")
    .update(update)
    .eq("id", roundId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}