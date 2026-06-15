import { supabase } from "@/lib/supabase";

export async function getCurrentRound(seasonId: string) {
  const { data: liveRound } = await supabase
    .from("rounds")
    .select("*, courses(name, city, state)")
    .eq("season_id", seasonId)
    .eq("status", "live")
    .maybeSingle();

  if (liveRound) {
    return liveRound;
  }

  const { data: firstRound } = await supabase
    .from("rounds")
    .select("*, courses(name, city, state)")
    .eq("season_id", seasonId)
    .order("round_number", { ascending: true })
    .limit(1)
    .single();

  return firstRound;
}