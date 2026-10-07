import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";

export async function GET() {
  const season = await getCurrentSeason();

  const { data: rounds, error } = await supabase
    .from("rounds")
    .select("id, season_id, round_number, name, status, round_date")
    .eq("season_id", season?.id)
    .order("round_number", { ascending: true });

  let supabaseHost = "unknown";

  try {
    supabaseHost = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    ).hostname;
  } catch {}

  return NextResponse.json({
    supabaseHost,
    season: season
      ? {
          id: season.id,
          year: season.year,
          status: season.status,
        }
      : null,
    roundCount: rounds?.length ?? 0,
    rounds:
      rounds?.map((round) => ({
        id: round.id,
        roundNumber: round.round_number,
        name: round.name,
        status: round.status,
      })) ?? [],
    error: error?.message ?? null,
  });
}
