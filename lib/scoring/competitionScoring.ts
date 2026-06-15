export type CompetitionFormat =
  | "match"
  | "stroke"
  | "stableford"
  | "best_ball"
  | "wolf"
  | "skins"
  | "custom";

export type CompetitionScoringRule = {
  format: CompetitionFormat;
  label: string;
  description: string;
  usesMatches: boolean;
  usesRawScores: boolean;
  supportsTeamPoints: boolean;
  supportsIndividualPoints: boolean;
  hasCalculator: boolean;
};

export const COMPETITION_SCORING_RULES: CompetitionScoringRule[] = [
  {
    format: "match",
    label: "Match Play",
    description:
      "Head-to-head match. For singles, use one player per side. For team match play, the app uses the best score from each side on each hole.",
    usesMatches: true,
    usesRawScores: true,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: true,
  },
  {
    format: "stroke",
    label: "Stroke Play",
    description:
      "Lowest total score wins. Can award team points, individual points, or both after the round or competition closes.",
    usesMatches: false,
    usesRawScores: true,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: true,
  },
  {
    format: "stableford",
    label: "Stableford",
    description:
      "Players earn points per hole based on score relative to par. Highest point total wins.",
    usesMatches: false,
    usesRawScores: true,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: true,
  },
  {
    format: "best_ball",
    label: "Best Ball",
    description:
      "Team score for each hole is the best score among that side's players. Best ball holes are calculated first, then match results award official points.",
    usesMatches: true,
    usesRawScores: true,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: true,
  },
  {
    format: "wolf",
    label: "Wolf",
    description:
      "Rotating hole-by-hole game. Points depend on partner choices, solo holes, and hole results. Calculator coming later.",
    usesMatches: false,
    usesRawScores: true,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: false,
  },
  {
    format: "skins",
    label: "Skins",
    description:
      "Hole-by-hole contest where a player or side wins a skin outright, with carryovers if tied. Calculator coming later.",
    usesMatches: false,
    usesRawScores: true,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: false,
  },
  {
    format: "custom",
    label: "Custom",
    description:
      "Admin-defined result. The app stores the competition and official points, but does not auto-calculate results.",
    usesMatches: false,
    usesRawScores: false,
    supportsTeamPoints: true,
    supportsIndividualPoints: true,
    hasCalculator: false,
  },
];

export function getCompetitionScoringRule(format: string) {
  return (
    COMPETITION_SCORING_RULES.find((rule) => rule.format === format) ??
    COMPETITION_SCORING_RULES.find((rule) => rule.format === "custom")!
  );
}