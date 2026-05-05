"use client";

import FuturesOrderList from "./FuturesOrderList";

type OrderHistoryTabProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
};

export default function OrderHistoryTab({
  contestSeasonId = null,
  activityVersion,
}: OrderHistoryTabProps) {
  return (
    <FuturesOrderList
      contestSeasonId={contestSeasonId}
      activityVersion={activityVersion}
      mode="orders"
    />
  );
}
