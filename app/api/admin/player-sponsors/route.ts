import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/requireAdminApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const authError = await requireAdminApi(request);
  if (authError) return authError;

  let body: {
    action?: string;
    playerId?: string;
    sponsorId?: string;
    sponsorIds?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const playerId = body?.playerId;

  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json(
      { error: "Missing player ID." },
      { status: 400 }
    );
  }

  if (body.action === "add") {
    const sponsorId = body.sponsorId;

    if (!sponsorId || typeof sponsorId !== "string") {
      return NextResponse.json(
        { error: "Missing sponsor ID." },
        { status: 400 }
      );
    }

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("player_sponsors")
      .select("display_order")
      .eq("player_id", playerId);

    if (lookupError) {
      return NextResponse.json(
        { error: lookupError.message },
        { status: 500 }
      );
    }

    const nextOrder =
      Math.max(-1, ...(existing ?? []).map((row) => row.display_order ?? 0)) + 1;

    const { error } = await supabaseAdmin
      .from("player_sponsors")
      .insert({
        player_id: playerId,
        sponsor_id: sponsorId,
        display_order: nextOrder,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "23505" ? 409 : 400 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "remove") {
    if (!body.sponsorId || typeof body.sponsorId !== "string") {
      return NextResponse.json(
        { error: "Missing sponsor ID." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("player_sponsors")
      .delete()
      .eq("player_id", playerId)
      .eq("sponsor_id", body.sponsorId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  if (body.action === "reorder") {
    const sponsorIds = body.sponsorIds;

    if (
      !Array.isArray(sponsorIds) ||
      sponsorIds.some((id) => typeof id !== "string") ||
      new Set(sponsorIds).size !== sponsorIds.length
    ) {
      return NextResponse.json(
        { error: "Invalid sponsor order." },
        { status: 400 }
      );
    }

    const { data: assignments, error: lookupError } = await supabaseAdmin
      .from("player_sponsors")
      .select("sponsor_id")
      .eq("player_id", playerId);

    if (lookupError) {
      return NextResponse.json(
        { error: lookupError.message },
        { status: 500 }
      );
    }

    const existingIds = (assignments ?? []).map((row) => row.sponsor_id);

    if (
      existingIds.length !== sponsorIds.length ||
      existingIds.some((id) => !sponsorIds.includes(id))
    ) {
      return NextResponse.json(
        { error: "Sponsor assignments have changed. Refresh and try again." },
        { status: 409 }
      );
    }

    for (let index = 0; index < sponsorIds.length; index++) {
      const { error } = await supabaseAdmin
        .from("player_sponsors")
        .update({ display_order: index })
        .eq("player_id", playerId)
        .eq("sponsor_id", sponsorIds[index]);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Invalid action." },
    { status: 400 }
  );
}
