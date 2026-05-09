"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCcw, ChevronUp } from "lucide-react";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import OrderBook from "@/components/trade/OrderBook";
import RecentTrades from "@/components/trade/RecentTrades";
import CoinList from "@/components/trade/CoinList";
import CoinListDrawer from "@/components/trade/CoinListDrawer";
import FuturesActivitySection from "@/components/futures/trading/FuturesActivitySection";
import FuturesOrderPanel from "@/components/futures/trading/FuturesOrderPanel";
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

const SEASON_COLORS = [
  { main: "#A855F7", light: "#C084FC", glow: "rgba(168, 85, 247, 0.4)" }, // Purple
  { main: "#6366F1", light: "#818CF8", glow: "rgba(99, 102, 241, 0.4)" }, // Indigo
  { main: "#EC4899", light: "#F472B6", glow: "rgba(236, 72, 153, 0.4)" }, // Pink
  { main: "#06B6D4", light: "#22D3EE", glow: "rgba(6, 182, 212, 0.4)" }, // Cyan
  { main: "#F59E0B", light: "#FBBF24", glow: "rgba(245, 158, 11, 0.4)" }, // Amber
  { main: "#8B5CF6", light: "#A78BFA", glow: "rgba(139, 92, 246, 0.4)" }, // Violet
];

const getSeasonTheme = (id: number) => SEASON_COLORS[id % SEASON_COLORS.length];

const TradingMetric = ({ label, value, accentClassName = "text-white" }: { label: string; value: string; accentClassName?: string }) => (
  <div className="min-w-[100px] border-l border-white/5 px-3 text-right">
    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</p>
    <p className={cn("mt-0.5 text-xs font-black tabular-nums", accentClassName)}>{value}</p>
  </div>
);

export default function ContestTradingPage() {
  const params = useParams<{ seasonId: string }>();
  const contestSeasonId = Number(params.seasonId);
  const theme = getSeasonTheme(contestSeasonId);

  // 1. Theme Effect
  useEffect(() => {
    document.body.classList.add("bg-black");
    return () => document.body.classList.remove("bg-black");
  }, []);

  // 2. Contest Session Hook
  useBinanceWebSocket("futures");
  const session = useContestFuturesTradingSession(contestSeasonId);

  // 3. UI Layout States (Strictly following mock/page.tsx)
  const [isCoinListCollapsed, setIsCoinListCollapsed] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("orderbook");
  const [mobileTab, setMobileTab] = useState<"trade" | "chart" | "trades">("trade");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (!isCoinListCollapsed && typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isCoinListCollapsed]);

  if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
    return <div className="flex h-screen items-center justify-center text-white">유효하지 않은 시즌입니다.</div>;
  }

  const holdingSymbols = session.openPositions.map((p) => p.symbol);
  const walletStatusLabel = getContestFuturesWalletStatusLabel(session.walletStatus.status);
  const seasonTitle = session.seasonInfo?.seasonTitle ?? `Season #${contestSeasonId}`;

  return (
    <div className="flex flex-col h-full w-full bg-black text-gray-200 overflow-hidden font-sans">
      {/* 1. Top Header */}
      <header 
        className="flex h-[48px] items-center justify-between bg-[#1A1625] px-2 sm:px-4 z-20 shrink-0 relative"
        style={{ 
          borderBottom: `2.5px solid ${theme.main}`,
          boxShadow: `0 4px 15px ${theme.glow}`
        }}
      >
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Link href="/contest" className="text-white/40 hover:text-white shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div 
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: theme.main, boxShadow: `0 0 10px ${theme.main}` }}
            />
            <h1 className="truncate text-xs sm:text-sm font-black text-white uppercase tracking-tight">{seasonTitle}</h1>
            <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0", getStatusTone(session.walletStatus.status))}>
              {walletStatusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 min-w-0 shrink">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-[10px] font-black text-white/50 uppercase">CONTEST MODE</span>
          </div>
        </div>
      </header>

      {/* 2. Coin List Drawer */}
      <CoinListDrawer
        isOpen={!isCoinListCollapsed}
        onClose={() => setIsCoinListCollapsed(true)}
        mode="contest"
        holdingSymbols={holdingSymbols}
        isParticipated={true}
        marketMode="futures"
      />

      {/* 3. Main Layout */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-x-hidden scrollbar-hide">
        <div className={cn(
          "flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_300px_320px] 2xl:grid-cols-[1fr_320px_360px] lg:grid-rows-[1fr_300px] lg:gap-2 lg:p-2 h-full min-h-[600px] lg:min-h-[650px] min-w-0 bg-[#1A1625] lg:bg-black",
          isCoinListCollapsed ? "" : "overflow-hidden",
          "lg:overflow-visible"
        )}>

          {/* Mobile Only: Header & Tabs */}
          <div className="lg:hidden flex flex-col shrink-0 border-b border-white/5 z-10 bg-[#1A1625]">
            <div className="bg-[#1A1625] relative">
              <CoinHeader
                mode="contest"
                className="bg-[#1A1625] border-none"
                onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                isSidebarCollapsed={isCoinListCollapsed}
              />
            </div>

            <div className="flex bg-[#1A1625] border-t border-white/5 shrink-0">
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trade' ? 'text-white' : 'text-gray-500'}`}
                onClick={() => setMobileTab('trade')}
                style={mobileTab === 'trade' ? { color: theme.light } : {}}
              >
                주문
                {mobileTab === 'trade' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px]" style={{ backgroundColor: theme.main }} />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'chart' ? 'text-white' : 'text-gray-500'}`}
                onClick={() => setMobileTab('chart')}
                style={mobileTab === 'chart' ? { color: theme.light } : {}}
              >
                차트
                {mobileTab === 'chart' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px]" style={{ backgroundColor: theme.main }} />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trades' ? 'text-white' : 'text-gray-500'}`}
                onClick={() => setMobileTab('trades')}
                style={mobileTab === 'trades' ? { color: theme.light } : {}}
              >
                체결
                {mobileTab === 'trades' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px]" style={{ backgroundColor: theme.main }} />}
              </button>
            </div>
          </div>

          {/* 모바일 하단 주문내역 트리거 바 */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[40] px-3 pb-3 pointer-events-none">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-full h-11 bg-gray-900 text-white rounded-xl shadow-2xl flex items-center justify-between px-4 pointer-events-auto active:scale-[0.98] transition-transform border"
              style={{ borderColor: `${theme.main}44` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.main }} />
                  대회 포지션 및 내역
                </span>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 모바일 바텀 시트 */}
          {isHistoryOpen && (
            <div className="lg:hidden fixed inset-0 z-[150] flex flex-col justify-end overflow-hidden">
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-backdrop-fade-in" 
                onClick={() => setIsHistoryOpen(false)} 
              />
              <div 
                className="relative bg-[#1A1625] rounded-t-[24px] shadow-2xl flex flex-col h-[60vh] border-t border-purple-500/20 animate-sheet-slide-up"
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex flex-col items-center py-3 shrink-0" onClick={() => setIsHistoryOpen(false)}>
                  <div className="w-10 h-1.5 bg-gray-800 rounded-full" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <FuturesActivitySection
                    contestSeasonId={contestSeasonId}
                    activityVersion={session.activityVersion}
                    openPositions={session.openPositions}
                    closingPositionId={session.closingPositionId}
                    cancelingOrderId={session.cancelingOrderId}
                    isTradingEnabled={session.isTradingEnabled && !session.pageErrorMessage}
                    leverageInfoByKey={session.leverageInfoByKey}
                    pendingCloseQuantityByPositionKey={session.pendingCloseQuantityByPositionKey}
                    updatingLeverageKey={session.updatingLeverageKey}
                    onCancelLimitOrder={session.cancelLimitOrder}
                    onClosePosition={session.submitCloseOrder}
                    onSubmitLimitCloseOrder={session.submitLimitCloseOrder}
                    onUpdatePositionLeverage={session.updatePositionLeverage}
                    mode="dark"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          <div className="flex-1 min-h-0 flex flex-col lg:contents overflow-y-auto lg:overflow-hidden scrollbar-hide">
            
            {/* Chart Section */}
            <section className={`lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2 flex-col min-h-[400px] lg:min-h-[350px] bg-[#161A1E] lg:rounded-xl lg:shadow-sm lg:border border-white/5 shrink-0 ${mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'}`}>
              <div className={cn("hidden lg:block border-b border-white/5 relative", !isCoinListCollapsed && "z-50")}>
                <CoinHeader
                  mode="contest"
                  className="bg-[#161A1E] border-none relative z-50"
                  onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                  isSidebarCollapsed={isCoinListCollapsed}
                />
                {!isCoinListCollapsed && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCoinListCollapsed(true)} />
                    <div className="absolute top-1/2 left-0 w-[380px] h-[calc(100vh-180px)] max-h-[800px] z-50 bg-[#161A1E] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <CoinList
                        mode="contest"
                        availableMarketTypes={["futures"]}
                        onSelect={() => setIsCoinListCollapsed(true)}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 min-h-0 relative">
                <MainCandleChart
                  mode="contest"
                  className="absolute inset-0 h-full w-full border-none p-2"
                  chartAreaClassName="h-full flex-1 min-h-0"
                />
              </div>
            </section>

            {/* Market Trades (Mobile) */}
            <section className={`lg:hidden flex-col bg-[#161A1E] min-h-[500px] shrink-0 ${mobileTab === 'trades' ? 'flex' : 'hidden'}`}>
              <div className="p-3 border-b border-white/5 font-bold text-gray-500 text-xs bg-black/20 tracking-widest shrink-0 uppercase">
                시장 체결 내역
              </div>
              <RecentTrades mode="contest" className="flex-1 border-none !bg-transparent" />
            </section>

            {/* Order Section */}
            <div className={`gap-0 lg:gap-2 shrink-0 lg:contents ${mobileTab === 'trade' ? 'flex flex-col' : 'hidden lg:flex'}`}>
              
              <div className="flex shrink-0 lg:contents">
                <aside className="w-[42%] min-w-[140px] shrink-0 lg:w-auto lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 flex flex-col bg-[#161A1E] lg:rounded-xl lg:shadow-sm lg:border border-r border-white/5 lg:border-white/5 min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden order-1 lg:order-none scrollbar-hide">
                  <div className="shrink-0 p-1.5 sm:p-2 border-b border-white/5 hidden lg:block">
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
                      mode="dark"
                    />
                  </div>
                  <div className="shrink-0 p-2 border-b border-white/5 lg:hidden font-bold text-gray-500 text-[11px] text-center bg-black/20 tracking-widest uppercase">
                    호가
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scrollbar-hide">
                    <div className="hidden lg:flex flex-col h-full w-full">
                      {activeInfoTab === "orderbook" ? (
                        <OrderBook mode="contest" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      ) : (
                        <RecentTrades mode="contest" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      )}
                    </div>
                    <div className="flex lg:hidden flex-col h-full w-full">
                      <OrderBook mode="contest" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                    </div>
                  </div>
                </aside>

                <aside className="flex-1 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3 bg-[#161A1E] lg:rounded-xl lg:shadow-sm lg:border border-white/5 min-h-0 min-w-0 overflow-hidden relative order-2 lg:order-none">
                  <FuturesOrderPanel
                    mode="contest"
                    walletStatus={session.walletStatus}
                    leverageInfo={session.leverageInfo}
                    leverageInfoByKey={session.leverageInfoByKey}
                    leverageErrorMessage={session.leverageErrorMessage}
                    isLoadingLeverage={session.isLoadingLeverage}
                    isUpdatingLeverage={session.isUpdatingLeverage}
                    updatingLeverageKey={session.updatingLeverageKey}
                    isSubmitting={session.isSubmittingOpenOrder}
                    isTradingEnabled={session.isTradingEnabled && !session.pageErrorMessage}
                    positionSide={session.selectedPositionSide}
                    openPositions={session.openPositions}
                    closingPositionId={session.closingPositionId}
                    pendingCloseQuantityByPositionKey={session.pendingCloseQuantityByPositionKey}
                    onPositionSideChange={session.setSelectedPositionSide}
                    onUpdatePositionLeverage={session.updatePositionLeverage}
                    onSubmitLimitOpenOrder={session.submitLimitOpenOrder}
                    onSubmitOpenOrder={session.submitOpenOrder}
                    onClosePosition={session.submitCloseOrder}
                    onSubmitLimitCloseOrder={session.submitLimitCloseOrder}
                    disabledMessage={session.pageErrorMessage}
                  />
                </aside>
              </div>

              {/* Bottom History (Desktop only) */}
              <section className="lg:col-start-1 lg:col-end-3 xl:col-end-3 lg:row-start-2 lg:row-end-3 bg-[#161A1E] lg:rounded-xl lg:shadow-sm lg:border border-t border-white/5 lg:border-white/5 min-h-[400px] lg:min-h-0 overflow-hidden flex-col shrink-0 hidden lg:flex">
                <FuturesActivitySection
                  contestSeasonId={contestSeasonId}
                  activityVersion={session.activityVersion}
                  openPositions={session.openPositions}
                  closingPositionId={session.closingPositionId}
                  cancelingOrderId={session.cancelingOrderId}
                  isTradingEnabled={session.isTradingEnabled && !session.pageErrorMessage}
                  leverageInfoByKey={session.leverageInfoByKey}
                  pendingCloseQuantityByPositionKey={session.pendingCloseQuantityByPositionKey}
                  updatingLeverageKey={session.updatingLeverageKey}
                  onCancelLimitOrder={session.cancelLimitOrder}
                  onClosePosition={session.submitCloseOrder}
                  onSubmitLimitCloseOrder={session.submitLimitCloseOrder}
                  onUpdatePositionLeverage={session.updatePositionLeverage}
                  mode="dark"
                />
              </section>
            </div>

          </div>
          <div className="h-20 lg:hidden shrink-0" />
        </div>
      </main>

      {/* Error Toast Overlay */}
      {session.pageErrorMessage && (
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-950/90 p-4 text-red-200 shadow-2xl backdrop-blur">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-bold">{session.pageErrorMessage}</p>
        </div>
      )}
    </div>
  );
}
