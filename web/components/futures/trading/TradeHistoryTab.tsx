"use client";

import FuturesOrderList from "./FuturesOrderList";

type TradeHistoryTabProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
};

export default function TradeHistoryTab({
  contestSeasonId = null,
  activityVersion,
}: TradeHistoryTabProps) {
  return (
    <FuturesOrderList
      contestSeasonId={contestSeasonId}
      activityVersion={activityVersion}
      mode="trades"
    />
  );
}
