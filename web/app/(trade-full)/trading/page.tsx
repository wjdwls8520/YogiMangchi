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
import { useUIStore } from "@/stores/useUIStore";

type MarketMode = "spot" | "futures";

const TradingMetric = ({ label, value, accentClassName = "text-slate-900 dark:text-gray-100" }: { label: string; value: string; accentClassName?: string }) => (
  <div className="min-w-[100px] border-l border-gray-100 dark:border-gray-700 px-3 text-right">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">{label}</p>
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
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    if (!isCoinListCollapsed && typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isCoinListCollapsed]);

  const handleTransferSuccess = async () => {
    setIsTransferModalOpen(false);
    // 백엔드의 자산 이체 트랜잭션이 DB에 완전히 반영되는 시간차를 고려하여, 0.5초 대기 후 양쪽(현물/선물) 데이터를 모두 확실하게 새로고침합니다.
    setTimeout(async () => {
      await futures.refreshBaseData();
      window.dispatchEvent(new CustomEvent("REFRESH_REAL_SPOT_ASSET"));
    }, 500);
  };

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden font-sans transition-colors duration-300", isFutures ? "bg-black text-gray-200" : "bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-gray-100")}>
      {/* 1. Top Header */}
      <header className="flex h-[48px] items-center justify-between border-b border-white/10 dark:border-gray-700 bg-[#1E2329] dark:bg-gray-800 px-2 sm:px-4 z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setSelectedMarketType("spot")}
              className={cn(
                "px-3 py-1 rounded text-[13px] font-black transition-all",
                !isFutures ? "bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-gray-100" : "text-gray-400 hover:text-white"
              )}
            >
              현물
            </button>
            <button
              onClick={() => setSelectedMarketType("futures")}
              className={cn(
                "px-3 py-1 rounded text-[13px] font-black transition-all",
                isFutures ? "bg-slate-100 text-slate-900" : "text-gray-400 hover:text-white"
              )}
            >
              선물
            </button>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <button
            onClick={() => {
              if (isUnlocked) {
                setIsTransferModalOpen(true);
              } else {
                setIsModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
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
        mode={isFutures ? "contest" : "trade"}
        marketMode={selectedMarketType}
      />

      {/* 3. Main Layout */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-x-hidden scrollbar-hide">
        <div className={cn(
          "flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_300px_320px] 2xl:grid-cols-[1fr_320px_360px] lg:grid-rows-[1fr_300px] lg:gap-2 lg:p-2 h-full min-h-[600px] lg:min-h-[650px] min-w-0",
          isFutures ? "bg-futures-trade lg:bg-black" : "bg-white dark:bg-zinc-900 lg:bg-slate-100",
          isCoinListCollapsed ? "" : "overflow-hidden",
          "lg:overflow-visible"
        )}>

          {/* Mobile Only: Header & Tabs */}
          <div className={cn("lg:hidden flex flex-col shrink-0 border-b z-10", isFutures ? "bg-futures-trade border-futures-border" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700")}>
            <div className={cn("relative", isFutures ? "bg-futures-trade" : "bg-white dark:bg-gray-800")}>
              <CoinHeader
                mode={isFutures ? "contest" : "trade"}
                className={cn("border-none", isFutures ? "bg-futures-trade" : "bg-white dark:bg-gray-800")}
                onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                isSidebarCollapsed={isCoinListCollapsed}
              />
            </div>

            <div className={cn("flex shrink-0 border-t", isFutures ? "bg-futures-trade border-futures-border" : "bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-700")}>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trade' ? (isFutures ? 'text-white' : 'text-brand-primary') : 'text-slate-400'}`}
                onClick={() => setMobileTab('trade')}
              >
                주문
                {mobileTab === 'trade' && <div className={cn("absolute bottom-0 left-0 right-0 h-[2.5px]", isFutures ? "bg-white" : "bg-brand-primary")} />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'chart' ? (isFutures ? 'text-white' : 'text-brand-primary') : 'text-slate-400'}`}
                onClick={() => setMobileTab('chart')}
              >
                차트
                {mobileTab === 'chart' && <div className={cn("absolute bottom-0 left-0 right-0 h-[2.5px]", isFutures ? "bg-white" : "bg-brand-primary")} />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trades' ? (isFutures ? 'text-white' : 'text-brand-primary') : 'text-slate-400 dark:text-gray-500'}`}
                onClick={() => setMobileTab('trades')}
              >
                체결
                {mobileTab === 'trades' && <div className={cn("absolute bottom-0 left-0 right-0 h-[2.5px]", isFutures ? "bg-white" : "bg-brand-primary")} />}
              </button>
            </div>
          </div>

          {/* 모바일 하단 주문내역 트리거 바 */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[40] px-3 pb-3 pointer-events-none">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className={cn("w-full h-11 rounded-xl shadow-xl flex items-center justify-between px-4 pointer-events-auto active:scale-[0.98] transition-transform border", isFutures ? "bg-gray-900 text-white border-futures-border" : "bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 border-gray-200 dark:border-gray-700")}
            >
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-black flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isFutures ? "bg-purple-500" : "bg-brand-primary")} />
                  {isFutures ? "포지션 및 거래 내역" : "거래 내역"}
                </span>
              </div>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* 모바일 바텀 시트 */}
          {isHistoryOpen && (
            <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end overflow-hidden">
              <div 
                className={cn("absolute inset-0 backdrop-blur-sm animate-backdrop-fade-in", isFutures ? "bg-black/80" : "bg-black/40")} 
                onClick={() => setIsHistoryOpen(false)} 
              />
              <div 
                className={cn("relative rounded-t-[24px] shadow-2xl flex flex-col h-[60vh] border-t animate-sheet-slide-up", isFutures ? "bg-futures-trade border-purple-500/20" : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700")}
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex flex-col items-center py-3 shrink-0" onClick={() => setIsHistoryOpen(false)}>
                  <div className={cn("w-10 h-1.5 rounded-full", isFutures ? "bg-gray-800" : "bg-slate-200")} />
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
                      mode="dark"
                    />
                  ) : (
                    <UserOrderHistory mode="trade" onClose={() => setIsHistoryOpen(false)} />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col lg:contents overflow-y-auto lg:overflow-hidden scrollbar-hide">
            <section className={cn(
              "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2 flex-col min-h-[400px] lg:min-h-[350px] shrink-0",
              isFutures ? "bg-futures-trade lg:rounded-xl lg:border border-futures-border" : "bg-white dark:bg-gray-800 lg:rounded-xl lg:border border-gray-200 dark:border-gray-700",
              mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
            )}>
              <div className={cn("hidden lg:block border-b relative lg:rounded-t-xl", isFutures ? "border-futures-border" : "border-gray-200 dark:border-gray-700", !isCoinListCollapsed && "z-50")}>
                <CoinHeader
                  mode={isFutures ? "contest" : "trade"}
                  className={cn("border-none relative z-50 lg:rounded-t-xl", isFutures ? "bg-futures-trade" : "bg-white dark:bg-gray-800")}
                  onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                  isSidebarCollapsed={isCoinListCollapsed}
                />
                {!isCoinListCollapsed && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCoinListCollapsed(true)} />
                    <div className={cn("absolute top-1/2 left-0 w-[420px] h-[calc(100vh-180px)] max-h-[800px] z-50 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200", isFutures ? "bg-futures-trade border-futures-border-strong" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700")}>
                      <CoinList
                        mode={isFutures ? "contest" : "trade"}
                        availableMarketTypes={["spot", "futures"]}
                        onSelect={() => setIsCoinListCollapsed(true)}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 min-h-0 relative">
                <MainCandleChart
                  mode={isFutures ? "contest" : "trade"}
                  className="absolute inset-0 h-full w-full border-none p-2"
                  chartAreaClassName="h-full flex-1 min-h-0"
                />
              </div>
            </section>

            <section className={cn(
              "lg:hidden flex-col min-h-[500px] shrink-0",
              isFutures ? "bg-futures-trade" : "bg-white dark:bg-gray-800",
              mobileTab === 'trades' ? 'flex' : 'hidden'
            )}>
              <div className={cn("p-3 border-b font-bold text-xs tracking-widest shrink-0 uppercase", isFutures ? "border-futures-border text-white/30 bg-white/5" : "border-gray-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-gray-800/50")}>
                시장 체결 내역
              </div>
              <RecentTrades mode={isFutures ? "contest" : "trade"} className="flex-1 border-none !bg-transparent" />
            </section>

            <div className={cn(
              "gap-0 lg:gap-2 shrink-0 lg:contents",
              mobileTab === 'trade' ? 'flex flex-col' : 'hidden lg:flex'
            )}>
              <div className="flex shrink-0 lg:contents">
                <aside className={cn("w-[42%] min-w-[140px] shrink-0 lg:w-auto lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 flex flex-col min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden order-1 lg:order-none scrollbar-hide", isFutures ? "bg-futures-trade lg:rounded-xl lg:border border-futures-border" : "bg-white dark:bg-gray-800 lg:rounded-xl lg:border border-r border-gray-200 dark:border-gray-700 lg:border-gray-200 dark:lg:border-gray-700")}>
                  <div className={cn("shrink-0 p-1.5 sm:p-2 border-b hidden lg:block", isFutures ? "border-futures-border" : "border-gray-200 dark:border-gray-700")}>
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
                      mode={isFutures ? "dark" : (isDarkMode ? "dark" : "light")}
                    />
                  </div>
                  <div className={cn("shrink-0 p-2 border-b lg:hidden font-bold text-[11px] text-center tracking-widest uppercase", isFutures ? "border-futures-border text-white/30 bg-white/5" : "border-gray-200 dark:border-gray-700 text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-gray-800/50")}>
                    호가
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="hidden lg:flex flex-col h-full w-full">
                      {activeInfoTab === "orderbook" ? (
                        <OrderBook mode={isFutures ? "contest" : "trade"} className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      ) : (
                        <RecentTrades mode={isFutures ? "contest" : "trade"} className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      )}
                    </div>
                    <div className="flex lg:hidden flex-col h-full w-full">
                      <OrderBook mode={isFutures ? "contest" : "trade"} className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                    </div>
                  </div>
                </aside>

                <aside className={cn("flex-1 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3 min-h-0 min-w-0 overflow-hidden relative order-2 lg:order-none", isFutures ? "bg-futures-trade lg:rounded-xl lg:border border-futures-border" : "bg-white dark:bg-gray-800 lg:rounded-xl lg:border border-gray-200 dark:border-gray-700")}>
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
                      onOpenTransferModal={() => setIsTransferModalOpen(true)}
                    />
                  ) : (
                    <OrderForm mode="trade" />
                  )}
                </aside>
              </div>

              <section className={cn("lg:col-start-1 lg:col-end-3 xl:col-end-3 lg:row-start-2 lg:row-end-3 min-h-[400px] lg:min-h-0 overflow-hidden flex-col shrink-0 hidden lg:flex", isFutures ? "bg-futures-trade lg:rounded-xl lg:border border-futures-border" : "bg-white dark:bg-gray-800 lg:rounded-xl lg:border border-t border-gray-200 dark:border-gray-700 lg:border-gray-200 dark:lg:border-gray-700")}>
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
                    mode="dark"
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
