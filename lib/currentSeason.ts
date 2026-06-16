import { supabase } from "@/lib/supabase";

export async function getCurrentSeason() {
  const { data: activeSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "active")
    .maybeSingle();

  if (activeSeason) {
    return activeSeason;
  }

  const { data: upcomingSeason } = await supabase
    .from("seasons")
    .select("*")
    .eq("status", "upcoming")
    .order("year", { ascending: true })
    .limit(1)
    .maybeSingle();

  return upcomingSeason;
}