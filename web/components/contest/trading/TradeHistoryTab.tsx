"use client";

import ContestFuturesOrderList from "./ContestFuturesOrderList";

type TradeHistoryTabProps = {
  contestSeasonId: number;
  activityVersion: number;
};

const TRADE_HISTORY_PAGE_SIZE = 10;

export default function TradeHistoryTab({
  contestSeasonId,
  activityVersion,
}: TradeHistoryTabProps) {
  return (
    <ContestFuturesOrderList
      contestSeasonId={contestSeasonId}
      activityVersion={activityVersion}
      mode="trades"
      pageSize={TRADE_HISTORY_PAGE_SIZE}
    />
  );
}
