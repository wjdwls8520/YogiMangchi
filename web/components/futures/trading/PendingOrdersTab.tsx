"use client";

import FuturesOrderList from "./FuturesOrderList";

type PendingOrdersTabProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
  cancelingOrderId: number | null;
  isTradingEnabled: boolean;
  onCancelLimitOrder: (orderId: number) => Promise<void>;
};

const PENDING_ORDER_PAGE_SIZE = 5;

export default function PendingOrdersTab({
  contestSeasonId = null,
  activityVersion,
  cancelingOrderId,
  isTradingEnabled,
  onCancelLimitOrder,
}: PendingOrdersTabProps) {
  return (
    <FuturesOrderList
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
