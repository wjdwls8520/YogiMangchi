"use client";

import ContestFuturesOrderList from "./ContestFuturesOrderList";

type OrderHistoryTabProps = {
  contestSeasonId: number;
  activityVersion: number;
};

const ORDER_HISTORY_PAGE_SIZE = 10;

export default function OrderHistoryTab({
  contestSeasonId,
  activityVersion,
}: OrderHistoryTabProps) {
  return (
    <ContestFuturesOrderList
      contestSeasonId={contestSeasonId}
      activityVersion={activityVersion}
      mode="orders"
      pageSize={ORDER_HISTORY_PAGE_SIZE}
    />
  );
}
