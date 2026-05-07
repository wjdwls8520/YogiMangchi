"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import OrderBook from "@/components/trade/OrderBook";
import RecentTrades from "@/components/trade/RecentTrades";
import CoinList from "@/components/trade/CoinList";
import OrderForm from "@/components/trade/OrderForm";
import UserOrderHistory from "@/components/trade/UserOrderHistory";

import FuturesActivitySection from "@/components/futures/trading/FuturesActivitySection";
import FuturesOrderPanel from "@/components/futures/trading/FuturesOrderPanel";
import { useFuturesTradingSession } from "@/hooks/useFuturesTradingSession";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { cn } from "@/lib/utils/cs";
import { formatAssetNumber } from "@/lib/utils/number";
import Tabs from "@/components/ui/Tabs";
import TradingLockedOverlay from "@/components/quest/TradingLockedOverlay";
import { useQuestStore } from "@/stores/useQuestStore";

type MarketMode = "spot" | "futures";

const TradingMetric = ({ label, value, accentClassName = "text-white" }: { label: string; value: string; accentClassName?: string }) => (
  <div className="min-w-[100px] border-l border-white/5 px-3 text-right">
    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</p>
    <p className={cn("mt-0.5 text-xs font-black tabular-nums", accentClassName)}>{value}</p>
  </div>
);

export default function IntegratedTradingPage() {
  const [marketMode, setMarketMode] = useState<MarketMode>("futures"); // 기본값을 선물로 설정 (현재 백엔드 준비 상태 반영)
  const [isCoinListCollapsed, setIsCoinListCollapsed] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("orderbook");

  useEffect(() => {
    document.body.classList.add("bg-[#0B0E11]");
    return () => document.body.classList.remove("bg-[#0B0E11]");
  }, []);

  // 선택된 모드에 따라 소켓 연결
  useBinanceWebSocket(marketMode);

  // 선물용 세션 훅 (Futures 모드일 때만 데이터가 유의미함)
  const futures = useFuturesTradingSession();
  
  // 퀘스트 상태 및 모달 제어
  const { isUnlocked, setIsModalOpen, isLoading: isQuestLoading } = useQuestStore();

  // 페이지 진입 시 해금 전이라면 자동으로 모달 팝업
  useEffect(() => {
    if (!isQuestLoading && !isUnlocked) {
      setIsModalOpen(true);
    }
  }, [isQuestLoading, isUnlocked, setIsModalOpen]);

  // 현물용 데이터 (현재는 Mock 상태, 나중에 본투자 현물 API 연동 필요)
  const availableSpotBalance = 0; 

  const handleModeChange = (mode: string) => {
    setMarketMode(mode as MarketMode);
  };

  return (
    <div className="dark grid h-screen w-full grid-rows-[48px_1fr] bg-[#0B0E11] text-gray-200 overflow-hidden">
      {/* 1. Top Header - 실전 거래 (블루 포인트) */}
      <header className="flex items-center justify-between border-b-2 border-blue-500/50 bg-[#161A28] px-4 z-20">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="text-white/40 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          
          {/* Market Mode Switcher */}
          <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => handleModeChange("spot")}
              className={cn(
                "px-4 py-1 text-xs font-black rounded-md transition-all",
                marketMode === "spot" ? "bg-[#F0B90B] text-black" : "text-gray-500 hover:text-gray-300"
              )}
            >
              현물 거래
            </button>
            <button
              onClick={() => handleModeChange("futures")}
              className={cn(
                "px-4 py-1 text-xs font-black rounded-md transition-all",
                marketMode === "futures" ? "bg-[#F0B90B] text-black" : "text-gray-500 hover:text-gray-300"
              )}
            >
              선물 거래
            </button>
          </div>
        </div>

        {/* Real-time Wallet Metrics */}
        <div className="flex items-center gap-1">
          {marketMode === "futures" ? (
            <>
              <TradingMetric label="총 자산" value={formatAssetNumber(Math.max(0, futures.walletStatus.currentMoney + futures.walletStatus.marginInUse))} />
              <TradingMetric label="주문 가능" value={formatAssetNumber(Math.max(0, futures.walletStatus.currentMoney))} accentClassName="text-emerald-400" />
              <TradingMetric label="증거금" value={formatAssetNumber(futures.walletStatus.marginInUse)} />
            </>
          ) : (
            <>
              <TradingMetric label="보유 현금" value={formatAssetNumber(availableSpotBalance)} accentClassName="text-emerald-400" />
            </>
          )}
          <div className="ml-4 border-l border-white/5 pl-4">
            <button 
              onClick={() => marketMode === "futures" && void futures.refreshBaseData()} 
              disabled={futures.isRefreshingBase} 
              className="p-2 text-white/40 hover:text-white transition-colors"
            >
              <RefreshCcw className={cn("h-4 w-4", futures.isRefreshingBase && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Layout */}
      <div className="grid grid-cols-[auto_1fr] h-full min-h-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className={cn("h-full border-r border-white/5 bg-[#161A1E] transition-all duration-300", isCoinListCollapsed ? "w-0 overflow-hidden" : "w-[360px] overflow-hidden flex flex-col")}>
          <div className="flex-1 overflow-auto">
             <CoinList availableMarketTypes={[marketMode]} />
          </div>
        </aside>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-[1fr_300px_320px] 2xl:grid-cols-[1fr_320px_360px] grid-rows-[minmax(250px,1fr)_300px] h-full min-h-0 min-w-0 overflow-hidden">
          
          {/* Chart Section */}
          <section className="col-start-1 col-end-2 row-start-1 row-end-2 flex flex-col min-h-0 bg-[#0B0E11] border-r border-white/5 overflow-hidden">
             <CoinHeader 
               className="bg-[#161A1E] border-b border-white/5 shrink-0" 
               onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
               isSidebarCollapsed={isCoinListCollapsed}
             />
             <div className="flex-1 min-h-0 relative">
                <MainCandleChart 
                  className="absolute inset-0 h-full w-full border-none p-2" 
                  chartAreaClassName="h-full flex-1 min-h-0"
                  marketTypeOverride={marketMode}
                />
             </div>
          </section>

          {/* OrderBook & Trades Section */}
          <aside className="col-start-2 col-end-3 row-start-1 row-end-2 flex flex-col border-r border-white/5 bg-[#161A1E] min-h-0 min-w-0 overflow-hidden">
            <div className="shrink-0 p-2">
              <Tabs
                activeTab={activeInfoTab}
                onChange={setActiveInfoTab}
                tabs={[
                  { label: "호가창", value: "orderbook" },
                  { label: "실시간 거래", value: "trades" },
                ]}
                fullWidth={true}
                size="sm"
                variant="plain"
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

          {/* Activity Section (Conditional) */}
          <section className="col-start-1 col-end-3 row-start-2 row-end-3 bg-[#161A1E] border-t-4 border-[#0B0E11] border-r border-white/5 min-h-0 overflow-hidden">
             {marketMode === "futures" ? (
               <FuturesActivitySection
                 activityVersion={futures.activityVersion}
                 openPositions={futures.openPositions}
                 closingPositionId={futures.closingPositionId}
                 cancelingOrderId={futures.cancelingOrderId}
                 isTradingEnabled={futures.isTradingEnabled}
                 leverageInfoByKey={futures.leverageInfoByKey}
                 pendingCloseQuantityByPositionKey={futures.pendingCloseQuantityByPositionKey}
                 updatingLeverageKey={futures.updatingLeverageKey}
                 onCancelLimitOrder={futures.cancelLimitOrder}
                 onClosePosition={futures.submitCloseOrder}
                 onSubmitLimitCloseOrder={futures.submitLimitCloseOrder}
                 onUpdatePositionLeverage={futures.updatePositionLeverage}
               />
             ) : (
               <UserOrderHistory />
             )}
          </section>

          {/* Order Panel (Conditional) */}
          <aside className="col-start-3 col-end-4 row-start-1 row-end-3 bg-[#161A1E] min-h-0 min-w-0 overflow-y-auto relative">
            <TradingLockedOverlay />
            {marketMode === "futures" ? (
              <FuturesOrderPanel
                walletStatus={futures.walletStatus}
                leverageInfo={futures.leverageInfo}
                leverageInfoByKey={futures.leverageInfoByKey}
                leverageErrorMessage={futures.leverageErrorMessage}
                isLoadingLeverage={futures.isLoadingLeverage}
                isUpdatingLeverage={futures.isUpdatingLeverage}
                updatingLeverageKey={futures.updatingLeverageKey}
                isSubmitting={futures.isSubmittingOpenOrder}
                isTradingEnabled={futures.isTradingEnabled}
                positionSide={futures.selectedPositionSide}
                openPositions={futures.openPositions}
                closingPositionId={futures.closingPositionId}
                pendingCloseQuantityByPositionKey={futures.pendingCloseQuantityByPositionKey}
                onPositionSideChange={futures.setSelectedPositionSide}
                onUpdatePositionLeverage={futures.updatePositionLeverage}
                onSubmitLimitOpenOrder={futures.submitLimitOpenOrder}
                onSubmitOpenOrder={futures.submitOpenOrder}
                onClosePosition={futures.submitCloseOrder}
                onSubmitLimitCloseOrder={futures.submitLimitCloseOrder}
              />
            ) : (
              <OrderForm mode="trade" />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
