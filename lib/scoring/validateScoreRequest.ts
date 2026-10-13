import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export async function validateScoreRequest(
  roundId: unknown,
  holeNumber: unknown,
  playerIds: unknown
): Promise<ValidationResult> {
  if (
    typeof roundId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(roundId)
  ) {
    return { valid: false, error: "Invalid round." };
  }

  if (
    !Number.isInteger(holeNumber) ||
    typeof holeNumber !== "number"
  ) {
    return { valid: false, error: "Invalid hole number." };
  }

  if (
    !Array.isArray(playerIds) ||
    playerIds.length === 0 ||
    playerIds.length > 24 ||
    !playerIds.every(
      (id) => typeof id === "string" && id.length > 0
    ) ||
    new Set(playerIds).size !== playerIds.length
  ) {
    return { valid: false, error: "Invalid player selection." };
  }

  const { data: round, error: roundError } = await supabaseAdmin
    .from("rounds")
    .select("id, season_id, hole_count, nine_type, status")
    .eq("id", roundId)
    .single();

  if (roundError || !round) {
    return { valid: false, error: "Round not found." };
  }

  const holeCount = Number(round.hole_count ?? 18);
  const nineType = round.nine_type;

  const allowedHoles =
    holeCount === 9
      ? nineType === "back"
        ? Array.from({ length: 9 }, (_, i) => i + 10)
        : Array.from({ length: 9 }, (_, i) => i + 1)
      : Array.from({ length: 18 }, (_, i) => i + 1);

  if (!allowedHoles.includes(holeNumber)) {
    return { valid: false, error: "Hole is not part of this round." };
  }

  const { data: seasonPlayers, error: playersError } =
    await supabaseAdmin
      .from("season_players")
      .select("player_id")
      .eq("season_id", round.season_id)
      .in("player_id", playerIds);

  if (playersError || seasonPlayers?.length !== playerIds.length) {
    return {
      valid: false,
      error: "One or more players are not in this season.",
    };
  }

  return { valid: true };
}
