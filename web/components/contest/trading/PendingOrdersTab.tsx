"use client";

import ContestFuturesOrderList from "./ContestFuturesOrderList";

type PendingOrdersTabProps = {
  contestSeasonId: number;
  activityVersion: number;
  cancelingOrderId: number | null;
  isTradingEnabled: boolean;
  onCancelLimitOrder: (orderId: number) => Promise<void>;
};

const PENDING_ORDER_PAGE_SIZE = 5;

export default function PendingOrdersTab({
  contestSeasonId,
  activityVersion,
  cancelingOrderId,
  isTradingEnabled,
  onCancelLimitOrder,
}: PendingOrdersTabProps) {
  return (
    <ContestFuturesOrderList
      contestSeasonId={contestSeasonId}
      activityVersion={activityVersion}
      mode="pending"
      pageSize={PENDING_ORDER_PAGE_SIZE}
      cancelingOrderId={cancelingOrderId}
      isTradingEnabled={isTradingEnabled}
      onCancelLimitOrder={onCancelLimitOrder}
    />
  );
}
