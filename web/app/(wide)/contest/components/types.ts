export type ContestListTab = "available" | "approved" | "rejected" | "past";

export type ContestMetricTone = "neutral" | "positive" | "negative";

export type ContestListCardType =
  | "apply"
  | "wait"
  | "approved"
  | "reject"
  | "past";

export type OngoingContest = {
  id: number;
  title: string;
  period: string;
  participants?: number | null;
  myRank?: number | null;
  myYield?: number | null;
  statusText?: string;
  targetDateAt?: string;
  primaryLabel?: string;
  primaryValue?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  secondaryTone?: ContestMetricTone;
  tertiaryLabel?: string;
  tertiaryValue?: string;
};

export type ContestListItem = {
  id: number;
  cardType: ContestListCardType;
  title: string;
  period: string;
  participants?: number | null;
  reward?: string;
  rejectReason?: string;
  myRank?: number | null;
  myYield?: number | null;
  accentLabel?: string;
  summaryLeft?: string;
  summaryRight?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  metricPrimaryLabel?: string;
  metricPrimaryValue?: string;
  metricSecondaryLabel?: string;
  metricSecondaryValue?: string;
  metricSecondaryTone?: ContestMetricTone;
};
