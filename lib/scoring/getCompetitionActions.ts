export function getCompetitionActions(format: string) {
  if (format === "stroke") {
    return ["Calculate Stroke Results"];
  }

  if (format === "stableford") {
    return ["Calculate Stableford"];
  }

  if (format === "best_ball") {
    return ["Calculate Best Ball", "Calculate Match Results"];
  }

  if (format === "match") {
    return ["Calculate Match Results"];
  }

  return ["Manual results only"];
}