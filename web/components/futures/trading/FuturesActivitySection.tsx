"use client";

import { useMemo, useState } from "react";
import Tabs, { type TabOption } from "@/components/ui/Tabs";
import OpenPositionsTab from "./OpenPositionsTab";
import PendingOrdersTab from "./PendingOrdersTab";
import OrderHistoryTab from "./OrderHistoryTab";
import TradeHistoryTab from "./TradeHistoryTab";
import type {
  ContestFuturesLimitCloseOrderParams,
  FuturesLeverageInfo,
  FuturesLimitOrderResponse,
  FuturesMarketOrderResponse,
  FuturesPositionItem,
  FuturesPositionSide,
} from "@/types/futures";

export type FuturesActivitySectionProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
  openPositions: FuturesPositionItem[];
  closingPositionId: number | null;
  cancelingOrderId: number | null;
  isTradingEnabled: boolean;
  leverageInfoByKey: Record<string, FuturesLeverageInfo>;
  pendingCloseQuantityByPositionKey: Record<string, number>;
  updatingLeverageKey: string | null;
  onClosePosition: (params: {
    positionId: number;
    closeQuantity: number;
  }) => Promise<FuturesMarketOrderResponse>;
  onSubmitLimitCloseOrder: (
    params: ContestFuturesLimitCloseOrderParams
  ) => Promise<FuturesLimitOrderResponse>;
  onCancelLimitOrder: (orderId: number) => Promise<void>;
  onUpdatePositionLeverage: (
    symbol: string,
    positionSide: FuturesPositionSide,
    leverage: number
  ) => Promise<FuturesLeverageInfo>;
  mode?: "light" | "dark";
};

type ActivityTab = "pending" | "open" | "orders" | "trades";

export default function FuturesActivitySection({
  contestSeasonId = null,
  activityVersion,
  openPositions,
  closingPositionId,
  cancelingOrderId,
  isTradingEnabled,
  pendingCloseQuantityByPositionKey,
  onCancelLimitOrder,
  onClosePosition,
  onSubmitLimitCloseOrder,
  mode,
}: FuturesActivitySectionProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>("pending");

  const openPositionCountLabel = useMemo(
    () => `(${openPositions.length})`,
    [openPositions.length]
  );

  const tabOptions: TabOption[] = [
    { label: "미체결 주문", value: "pending" },
    { label: `포지션 ${openPositionCountLabel}`, value: "open" },
    { label: "주문내역", value: "orders" },
    { label: "체결내역", value: "trades" },
  ];

  return (
    <section className="flex h-full flex-col">
      <div className="shrink-0 px-4 py-2">
        <Tabs
          tabs={tabOptions}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as ActivityTab)}
          fullWidth={false}
          size="sm"
          variant="plain"
          mode={mode}
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === "pending" && (
          <PendingOrdersTab
            contestSeasonId={contestSeasonId}
            activityVersion={activityVersion}
            cancelingOrderId={cancelingOrderId}
            isTradingEnabled={isTradingEnabled}
            onCancelLimitOrder={onCancelLimitOrder}
            mode={mode}
          />
        )}

        {activeTab === "open" && (
          <OpenPositionsTab
            openPositions={openPositions}
            closingPositionId={closingPositionId}
            isTradingEnabled={isTradingEnabled}
            pendingCloseQuantityByPositionKey={pendingCloseQuantityByPositionKey}
            onClosePosition={onClosePosition}
            onSubmitLimitCloseOrder={onSubmitLimitCloseOrder}
            mode={mode}
          />
        )}

        {activeTab === "orders" && (
          <OrderHistoryTab
            contestSeasonId={contestSeasonId}
            activityVersion={activityVersion}
            mode={mode}
          />
        )}

        {activeTab === "trades" && (
          <TradeHistoryTab
            contestSeasonId={contestSeasonId}
            activityVersion={activityVersion}
            mode={mode}
          />
        )}
      </div>
    </section>
  );
}
