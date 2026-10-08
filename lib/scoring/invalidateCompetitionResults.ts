import { supabase } from "@/lib/supabase";

/**
 * Withdraw previously published results after match scoring changes.
 * Match and hole records are preserved.
 *
 * Results are stored per competition, so the entire competition must
 * be re-finalized after a scoring correction.
 */
export async function invalidateCompetitionResults(
  competitionId: string
): Promise<void> {
  const { error } = await supabase
    .from("competition_results")
    .delete()
    .eq("competition_id", competitionId);

  if (error) {
    throw new Error(
      `Could not invalidate competition results: ${error.message}`
    );
  }
}
