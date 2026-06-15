export type CompetitionStatus =
  | "not_started"
  | "in_progress"
  | "ready"
  | "calculated";

export function getCompetitionStatus({
  scoreCount,
  resultCount,
}: {
  scoreCount: number;
  resultCount: number;
}): CompetitionStatus {
  if (resultCount > 0) {
    return "calculated";
  }

  if (scoreCount === 0) {
    return "not_started";
  }

  return "ready";
}

export function getCompetitionStatusLabel(status: CompetitionStatus) {
  if (status === "calculated") return "Calculated";
  if (status === "ready") return "Ready to Calculate";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}