type PlayerTotal = {
  playerId: string;
  total: number;
};

type TeamMember = {
  team_id: string;
  player_id: string;
};

export function calculateTeamAggregateResults({
  playerTotals,
  teamMembers,
  method,
  higherIsBetter = false,
}: {
  playerTotals: PlayerTotal[];
  teamMembers: TeamMember[];
  method: string;
  higherIsBetter?: boolean;
}) {
  const teamIds = Array.from(
    new Set(teamMembers.map((member) => member.team_id))
  );

  const takeCount =
    method === "best_1_total"
      ? 1
      : method === "best_2_total"
        ? 2
        : method === "best_3_total"
          ? 3
          : Infinity;

  return teamIds
    .map((teamId) => {
      const playerIds = teamMembers
        .filter((member) => member.team_id === teamId)
        .map((member) => member.player_id);

      const totals = playerTotals
        .filter((player) => playerIds.includes(player.playerId))
        .map((player) => player.total)
        .sort((a, b) => (higherIsBetter ? b - a : a - b));

      const selectedTotals =
        method === "all_players_total" ? totals : totals.slice(0, takeCount);

      const teamTotal = selectedTotals.reduce((sum, total) => sum + total, 0);

      return {
        teamId,
        teamTotal,
        countedPlayers: selectedTotals.length,
      };
    })
    .filter((team) => team.countedPlayers > 0)
    .sort((a, b) =>
      higherIsBetter ? b.teamTotal - a.teamTotal : a.teamTotal - b.teamTotal
    )
    .map((team, index) => ({
      ...team,
      place: index + 1,
    }));
}