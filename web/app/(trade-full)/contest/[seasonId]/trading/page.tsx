"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import OrderBook from "@/components/trade/OrderBook";
import RecentTrades from "@/components/trade/RecentTrades";
import CoinList from "@/components/trade/CoinList";
import ContestFuturesActivitySection from "@/components/contest/trading/ContestFuturesActivitySection";
import ContestFuturesOrderPanel from "@/components/contest/trading/ContestFuturesOrderPanel";
import { useContestFuturesTradingSession } from "@/hooks/useContestFuturesTradingSession";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { cn } from "@/lib/utils/cs";
import { formatAssetNumber } from "@/lib/utils/number";
import { getContestFuturesWalletStatusLabel } from "@/lib/utils/futures";
import type { ContestFuturesWalletStatus } from "@/types/futures";
import Tabs from "@/components/ui/Tabs";

const getStatusTone = (status: ContestFuturesWalletStatus["status"]) => {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === "ACTIVE") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (normalizedStatus === "EXPIRED") return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
};

const TradingMetric = ({ label, value, accentClassName = "text-white" }: { label: string; value: string; accentClassName?: string }) => (
  <div className="min-w-[100px] border-l border-white/5 px-3 text-right">
    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</p>
    <p className={cn("mt-0.5 text-xs font-black tabular-nums", accentClassName)}>{value}</p>
  </div>
);

export default function ContestTradingPage() {
  const params = useParams<{ seasonId: string }>();
  const contestSeasonId = Number(params.seasonId);

  useEffect(() => {
    document.body.classList.add("bg-[#0B0E11]");
    return () => document.body.classList.remove("bg-[#0B0E11]");
  }, []);

  useBinanceWebSocket("futures");

  const [isCoinListCollapsed, setIsCoinListCollapsed] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("orderbook");

  const {
    activityVersion,
    cancelingOrderId,
    cancelLimitOrder,
    closingPositionId,
    isLoadingLeverage,
    isRefreshingBase,
    isTradingEnabled,
    isSubmittingOpenOrder,
    isUpdatingLeverage,
    leverageErrorMessage,
    leverageInfo,
    leverageInfoByKey,
    openPositions,
    pageErrorMessage,
    pendingCloseQuantityByPositionKey,
    pendingOpenOrderLockedAmount,
    refreshBaseData,
    seasonInfo,
    submitCloseOrder,
    submitLimitCloseOrder,
    submitLimitOpenOrder,
    submitOpenOrder,
    updatePositionLeverage,
    updatingLeverageKey,
    walletStatus,
    selectedPositionSide,
    setSelectedPositionSide,
  } = useContestFuturesTradingSession(contestSeasonId);

  const holdingSymbols = openPositions.map((position) => position.symbol);
  const availableBalance = Math.max(0, walletStatus.currentMoney);
  const marginInUse = Math.max(0, walletStatus.marginInUse);
  const lockedOrderAmount = Math.max(0, pendingOpenOrderLockedAmount);
  const accountBasisAmount = availableBalance + marginInUse + lockedOrderAmount;
  const walletStatusLabel = getContestFuturesWalletStatusLabel(walletStatus.status);
  const seasonTitle = seasonInfo?.seasonTitle ?? `Season #${contestSeasonId}`;

  if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
    return <div className="flex h-screen items-center justify-center text-white">유효하지 않은 시즌입니다.</div>;
  }

  return (
    <div className="dark grid h-screen w-full grid-rows-[48px_1fr] bg-[#0B0E11] text-gray-200 overflow-hidden">
      {/* 1. Header (Fixed Height) */}
      <header className="flex items-center justify-between border-b border-white/5 bg-[#161A1E] px-4 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/contest" className="text-white/40 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="truncate text-sm font-black text-white">{seasonTitle}</h1>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black uppercase", getStatusTone(walletStatus.status))}>
              {walletStatusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <TradingMetric label="총 자산" value={formatAssetNumber(accountBasisAmount)} />
          <TradingMetric label="주문 가능" value={formatAssetNumber(availableBalance)} accentClassName="text-emerald-400" />
          <TradingMetric label="증거금" value={formatAssetNumber(marginInUse)} />
          <div className="ml-4 border-l border-white/5 pl-4">
            <button onClick={() => void refreshBaseData()} disabled={isRefreshingBase} className="p-2 text-white/40 hover:text-white transition-colors">
              <RefreshCcw className={cn("h-4 w-4", isRefreshingBase && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area (Remaining Height) */}
      <div className="grid grid-cols-[auto_1fr] h-full min-h-0 overflow-hidden relative">
        {/* Left Sidebar (Coin List) */}
        <aside className={cn("h-full border-r border-white/5 bg-[#161A1E] transition-all duration-300", isCoinListCollapsed ? "w-0 overflow-hidden" : "w-64 overflow-hidden flex flex-col")}>
          <div className="flex-1 overflow-auto">
             <CoinList mode="contest" availableMarketTypes={["futures"]} holdingSymbols={holdingSymbols} isParticipated={true} />
          </div>
        </aside>

        {/* Toggle Button for Side Bar */}
        <button 
          onClick={() => setIsCoinListCollapsed(!isCoinListCollapsed)} 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex h-10 w-4 items-center justify-center rounded-r-md border border-l-0 border-white/10 bg-[#161A1E] text-white/20 hover:text-white"
          style={{ left: isCoinListCollapsed ? '0' : '256px' }}
        >
          {isCoinListCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* The Grid Dashboard */}
        <div className="grid grid-cols-[1fr_300px_320px] 2xl:grid-cols-[1fr_320px_360px] grid-rows-[minmax(250px,1fr)_300px] h-full min-h-0 min-w-0 overflow-hidden">
          
          {/* Chart Area (Row 1, Col 1) */}
          <section className="col-start-1 col-end-2 row-start-1 row-end-2 flex flex-col min-h-0 bg-[#0B0E11] border-r border-white/5 overflow-hidden">
             <CoinHeader className="bg-[#161A1E] border-b border-white/5 shrink-0" />
             <div className="flex-1 min-h-0 relative">
                <MainCandleChart 
                  className="absolute inset-0 h-full w-full border-none p-2" 
                  chartAreaClassName="h-full flex-1 min-h-0"
                  marketTypeOverride="futures"
                />
             </div>
          </section>

          {/* OrderBook & Recent Trades (Row 1, Col 2) */}
          <aside className="col-start-2 col-end-3 row-start-1 row-end-2 flex flex-col border-r border-white/5 bg-[#161A1E] min-h-0 min-w-0 overflow-hidden">
            <div className="shrink-0 p-2 border-b border-white/5">
              <Tabs
                activeTab={activeInfoTab}
                onChange={setActiveInfoTab}
                tabs={[
                  { label: "호가창", value: "orderbook" },
                  { label: "실시간 거래", value: "trades" },
                ]}
                fullWidth={true}
                size="sm"
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
               {activeInfoTab === "orderbook" ? (
                 <OrderBook className="!h-full flex-1 min-h-0 w-full border-none !bg-transparent" />
               ) : (
                 <RecentTrades className="!h-full flex-1 min-h-0 w-full border-none !bg-transparent" />
               )}
            </div>
          </aside>

          {/* Activity (Positions) Area (Row 2, Col 1-2) */}
          <section className="col-start-1 col-end-3 row-start-2 row-end-3 bg-[#161A1E] border-t-4 border-[#0B0E11] border-r border-white/5 min-h-0 overflow-hidden">
             <ContestFuturesActivitySection
                contestSeasonId={contestSeasonId}
                activityVersion={activityVersion}
                openPositions={openPositions}
                closingPositionId={closingPositionId}
                cancelingOrderId={cancelingOrderId}
                isTradingEnabled={isTradingEnabled && !pageErrorMessage}
                leverageInfoByKey={leverageInfoByKey}
                pendingCloseQuantityByPositionKey={pendingCloseQuantityByPositionKey}
                updatingLeverageKey={updatingLeverageKey}
                onCancelLimitOrder={cancelLimitOrder}
                onClosePosition={submitCloseOrder}
                onSubmitLimitCloseOrder={submitLimitCloseOrder}
                onUpdatePositionLeverage={updatePositionLeverage}
             />
          </section>

          {/* Order Panel (Row 1-2, Col 3) */}
          <aside className="col-start-3 col-end-4 row-start-1 row-end-3 bg-[#161A1E] min-h-0 min-w-0 overflow-y-auto">
            <ContestFuturesOrderPanel
              walletStatus={walletStatus}
              leverageInfo={leverageInfo}
              leverageInfoByKey={leverageInfoByKey}
              leverageErrorMessage={leverageErrorMessage}
              isLoadingLeverage={isLoadingLeverage}
              isUpdatingLeverage={isUpdatingLeverage}
              updatingLeverageKey={updatingLeverageKey}
              isSubmitting={isSubmittingOpenOrder}
              isTradingEnabled={isTradingEnabled && !pageErrorMessage}
              positionSide={selectedPositionSide}
              openPositions={openPositions}
              closingPositionId={closingPositionId}
              pendingCloseQuantityByPositionKey={pendingCloseQuantityByPositionKey}
              onPositionSideChange={setSelectedPositionSide}
              onUpdatePositionLeverage={updatePositionLeverage}
              onSubmitLimitOpenOrder={submitLimitOpenOrder}
              onSubmitOpenOrder={submitOpenOrder}
              onClosePosition={submitCloseOrder}
              onSubmitLimitCloseOrder={submitLimitCloseOrder}
            />
          </aside>
        </div>
      </div>

      {/* Error Toast Overlay */}
      {pageErrorMessage && (
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-950/90 p-4 text-red-200 shadow-2xl backdrop-blur">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold">{pageErrorMessage}</p>
        </div>
      )}
    </div>
  );
}
