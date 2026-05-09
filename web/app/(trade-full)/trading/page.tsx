"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCcw, ArrowLeftRight, ChevronUp, X } from "lucide-react";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import OrderBook from "@/components/trade/OrderBook";
import RecentTrades from "@/components/trade/RecentTrades";
import CoinList from "@/components/trade/CoinList";
import OrderForm from "@/components/trade/OrderForm";
import UserOrderHistory from "@/components/trade/UserOrderHistory";
import CoinListDrawer from "@/components/trade/CoinListDrawer";

import FuturesActivitySection from "@/components/futures/trading/FuturesActivitySection";
import FuturesOrderPanel from "@/components/futures/trading/FuturesOrderPanel";
import { useFuturesTradingSession } from "@/hooks/useFuturesTradingSession";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { cn } from "@/lib/utils/cs";
import { formatAssetNumber } from "@/lib/utils/number";
import Tabs from "@/components/ui/Tabs";
import TradingLockedOverlay from "@/components/quest/TradingLockedOverlay";
import { useQuestStore } from "@/stores/useQuestStore";
import AssetTransferModal from "@/components/asset/AssetTransferModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRequireLogin } from "@/hooks/useWithAuth";
import { useTickerStore } from "@/stores/useTickerStore";

type MarketMode = "spot" | "futures";

const TradingMetric = ({ label, value, accentClassName = "text-slate-900" }: { label: string; value: string; accentClassName?: string }) => (
  <div className="min-w-[100px] border-l border-gray-100 px-3 text-right">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    <p className={cn("mt-0.5 text-xs font-black tabular-nums", accentClassName)}>{value}</p>
  </div>
);

export default function IntegratedTradingPage() {
  const { alert, toast } = useFeedback();
  const { isLogin, user } = useAuthStore();
  const requireLogin = useRequireLogin({ redirectMode: "push" });

  // 1. Ticker & Market State
  const selectedCoin = useTickerStore((s) => s.selectedCoin);
  const selectedMarketType = useTickerStore((s) => s.selectedMarketType);
  const setSelectedMarketType = useTickerStore((s) => s.setSelectedMarketType);
  const { isUnlocked, setIsModalOpen } = useQuestStore();

  // 2. Real Trading Hooks
  useBinanceWebSocket(selectedMarketType);
  const futures = useFuturesTradingSession();

  // 3. Asset Transfer States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 4. UI Layout States (Matching Mock Page EXACTLY)
  const [isCoinListCollapsed, setIsCoinListCollapsed] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("orderbook");
  const [mobileTab, setMobileTab] = useState<"trade" | "chart" | "trades">("trade");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isFutures = selectedMarketType === "futures";

  useEffect(() => {
    document.body.classList.add("bg-slate-100");
    return () => document.body.classList.remove("bg-slate-100");
  }, []);

  useEffect(() => {
    if (!isCoinListCollapsed && typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isCoinListCollapsed]);

  const handleTransferSuccess = async () => {
    if (isFutures) await futures.refreshBaseData();
    setIsTransferModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* 1. Top Header */}
      <header className="flex h-[48px] items-center justify-between border-b border-white/10 bg-[#1E2329] px-2 sm:px-4 z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setSelectedMarketType("spot")}
              className={cn(
                "px-3 py-1 rounded text-[13px] font-black transition-all",
                !isFutures ? "bg-slate-100 text-slate-900 shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              현물
            </button>
            <button
              onClick={() => setSelectedMarketType("futures")}
              className={cn(
                "px-3 py-1 rounded text-[13px] font-black transition-all",
                isFutures ? "bg-slate-100 text-slate-900 shadow-sm" : "text-gray-400 hover:text-white"
              )}
            >
              선물
            </button>
          </div>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          <button
            onClick={() => {
              if (isUnlocked) {
                setIsTransferModalOpen(true);
              } else {
                setIsModalOpen(true);
              }
            }}
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
          >
            자산 이체
          </button>
        </div>

        <div className="flex items-center gap-1 min-w-0 shrink" />
      </header>

      {/* 2. Coin List Drawer */}
      <CoinListDrawer
        isOpen={!isCoinListCollapsed}
        onClose={() => setIsCoinListCollapsed(true)}
        mode="trade"
        marketMode={selectedMarketType}
      />

      {/* 3. Main Layout */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-x-hidden scrollbar-hide">
        <div className={cn(
          "flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_300px_320px] 2xl:grid-cols-[1fr_320px_360px] lg:grid-rows-[1fr_300px] lg:gap-2 lg:p-2 h-full min-h-[600px] lg:min-h-[650px] min-w-0 bg-white lg:bg-slate-100",
          isCoinListCollapsed ? "" : "overflow-hidden",
          "lg:overflow-visible"
        )}>

          {/* Mobile Only: Header & Tabs */}
          <div className="lg:hidden flex flex-col shrink-0 border-b border-gray-100 z-10 bg-white">
            <div className="bg-white relative">
              <CoinHeader
                mode="trade"
                className="bg-white border-none"
                onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                isSidebarCollapsed={isCoinListCollapsed}
              />
            </div>

            <div className="flex bg-white border-t border-gray-50 shrink-0">
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trade' ? 'text-brand-primary' : 'text-slate-400'}`}
                onClick={() => setMobileTab('trade')}
              >
                주문
                {mobileTab === 'trade' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary" />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'chart' ? 'text-brand-primary' : 'text-slate-400'}`}
                onClick={() => setMobileTab('chart')}
              >
                차트
                {mobileTab === 'chart' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary" />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trades' ? 'text-brand-primary' : 'text-slate-400'}`}
                onClick={() => setMobileTab('trades')}
              >
                체결
                {mobileTab === 'trades' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-primary" />}
              </button>
            </div>
          </div>

          {/* 모바일 하단 주문내역 트리거 바 */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[40] px-3 pb-3 pointer-events-none">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-full h-11 bg-white text-slate-900 rounded-xl shadow-xl flex items-center justify-between px-4 pointer-events-auto active:scale-[0.98] transition-transform border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  포지션 및 거래 내역
                </span>
              </div>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* 모바일 바텀 시트 */}
          {isHistoryOpen && (
            <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end overflow-hidden">
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-fade-in" 
                onClick={() => setIsHistoryOpen(false)} 
              />
              <div 
                className="relative bg-white rounded-t-[24px] shadow-2xl flex flex-col h-[60vh] border-t border-gray-100 animate-sheet-slide-up"
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex flex-col items-center py-3 shrink-0" onClick={() => setIsHistoryOpen(false)}>
                  <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {isFutures ? (
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
                    <UserOrderHistory mode="trade" onClose={() => setIsHistoryOpen(false)} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          <div className="flex-1 min-h-0 flex flex-col lg:contents overflow-y-auto lg:overflow-hidden scrollbar-hide">
            
            {/* Chart Section */}
            <section className={`lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2 flex-col min-h-[400px] lg:min-h-[350px] bg-white lg:rounded-xl lg:shadow-sm lg:border border-gray-100 shrink-0 ${mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'}`}>
              <div className={cn("hidden lg:block border-b border-gray-100 relative", !isCoinListCollapsed && "z-50")}>
                <CoinHeader
                  mode="trade"
                  className="bg-white border-none relative z-50"
                  onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                  isSidebarCollapsed={isCoinListCollapsed}
                />
                {!isCoinListCollapsed && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCoinListCollapsed(true)} />
                    <div className="absolute top-1/2 left-0 w-[380px] h-[calc(100vh-180px)] max-h-[800px] z-50 bg-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <CoinList
                        mode="trade"
                        availableMarketTypes={["spot", "futures"]}
                        onSelect={() => setIsCoinListCollapsed(true)}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 min-h-0 relative">
                <MainCandleChart
                  mode="trade"
                  className="absolute inset-0 h-full w-full border-none p-2"
                  chartAreaClassName="h-full flex-1 min-h-0"
                />
              </div>
            </section>

            {/* Market Trades (Mobile) */}
            <section className={`lg:hidden flex-col bg-white min-h-[500px] shrink-0 ${mobileTab === 'trades' ? 'flex' : 'hidden'}`}>
              <div className="p-3 border-b border-gray-100 font-bold text-slate-400 text-xs bg-slate-50 tracking-widest shrink-0 uppercase">
                시장 체결 내역
              </div>
              <RecentTrades mode="trade" className="flex-1 border-none !bg-transparent" />
            </section>

            {/* Order Section */}
            <div className={`gap-0 lg:gap-2 shrink-0 lg:contents ${mobileTab === 'trade' ? 'flex flex-col' : 'hidden lg:flex'}`}>
              
              <div className="flex shrink-0 lg:contents">
                <aside className="w-[42%] min-w-[140px] shrink-0 lg:w-auto lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 flex flex-col bg-white lg:rounded-xl lg:shadow-sm lg:border border-r border-gray-100 lg:border-gray-100 min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden order-1 lg:order-none scrollbar-hide">
                  <div className="shrink-0 p-1.5 sm:p-2 border-b border-gray-100 hidden lg:block">
                    <Tabs
                      activeTab={activeInfoTab}
                      onChange={setActiveInfoTab}
                      tabs={[
                        { label: "호가", value: "orderbook" },
                        { label: "체결", value: "trades" },
                      ]}
                      fullWidth={true}
                      size="sm"
                      variant="plain"
                    />
                  </div>
                  <div className="shrink-0 p-2 border-b border-gray-100 lg:hidden font-bold text-slate-400 text-[11px] text-center bg-slate-50 tracking-widest uppercase">
                    호가
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="hidden lg:flex flex-col h-full w-full">
                      {activeInfoTab === "orderbook" ? (
                        <OrderBook mode="trade" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      ) : (
                        <RecentTrades mode="trade" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      )}
                    </div>
                    <div className="flex lg:hidden flex-col h-full w-full">
                      <OrderBook mode="trade" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                    </div>
                  </div>
                </aside>

                <aside className="flex-1 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3 bg-white lg:rounded-xl lg:shadow-sm lg:border border-gray-100 min-h-0 min-w-0 overflow-hidden relative order-2 lg:order-none">
                  <TradingLockedOverlay />
                  {isFutures ? (
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

              {/* Bottom History (Desktop only) */}
              <section className="lg:col-start-1 lg:col-end-3 xl:col-end-3 lg:row-start-2 lg:row-end-3 bg-white lg:rounded-xl lg:shadow-sm lg:border border-t border-gray-100 lg:border-gray-100 min-h-[400px] lg:min-h-0 overflow-hidden flex-col shrink-0 hidden lg:flex">
                {isFutures ? (
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
                  <UserOrderHistory mode="trade" />
                )}
              </section>
            </div>

          </div>
          <div className="h-20 lg:hidden shrink-0" />
        </div>
      </main>

      {/* Modals */}
      {isTransferModalOpen && (
        <AssetTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={handleTransferSuccess}
          initialFromType={isFutures ? "TRADE_FUTURE" : "TRADE_SPOT"}
        />
      )}
    </div>
  );
}
