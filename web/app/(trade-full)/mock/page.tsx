"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCcw, TriangleAlert, Lightbulb, X, ChevronUp } from "lucide-react";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import OrderBook from "@/components/trade/OrderBook";
import RecentTrades from "@/components/trade/RecentTrades";
import CoinList from "@/components/trade/CoinList";
import OrderForm from "@/components/trade/OrderForm";
import UserOrderHistory from "@/components/trade/UserOrderHistory";
import MockNoticeBar from "@/components/mock/MockNoticeBar";
import CoinListDrawer from "@/components/trade/CoinListDrawer";
import Tabs from "@/components/ui/Tabs";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils/cs";

export default function MockTradingPage() {
  const isParticipated = useMockWalletStore((state) => state.isParticipated);
  const holdings = useMockWalletStore((state) => state.holdings);
  const [isCoinListCollapsed, setIsCoinListCollapsed] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("orderbook");
  const [mobileTab, setMobileTab] = useState<"trade" | "chart" | "trades">("trade");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    // 모바일에서 코인 목록이 열려있을 때 바디 스크롤 방지
    if (!isCoinListCollapsed && typeof window !== "undefined" && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCoinListCollapsed]);

  useBinanceWebSocket(); // 기본 현물 웹소켓 연결

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 dark:bg-zinc-900 text-slate-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      {/* 1. Top Header - 고정 높이 48px */}
      <header className="flex h-[48px] items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-slate-200 dark:bg-gray-800 px-2 sm:px-4 z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-bold truncate">
            {isParticipated ? (
              <>
                <TriangleAlert aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-yellow-400" />
                <p className="truncate text-slate-600 dark:text-slate-400">
                  현재 <span className="text-emerald-600 dark:text-emerald-400 font-black">모의투자(연습)</span> 모드로 접속 중입니다. 실제 자산이 소모되지 않습니다.
                </p>
              </>
            ) : (
              <>
                <Lightbulb aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-500" />
                <p className="truncate text-slate-600 dark:text-slate-400">
                  요기망치 모의투자에 오신 것을 환영합니다! 초기 자금을 받고 투자를 연습해 보세요.
                </p>
              </>
            )}
          </div>
          {/* 모바일용 짧은 타이틀 */}
          <div className="md:hidden flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
            <TriangleAlert className="h-4 w-4 text-yellow-400" />
            모의투자
          </div>
        </div>

        <div className="flex items-center gap-1 min-w-0 shrink">
          <div className="min-w-0 overflow-x-auto scrollbar-hide no-scrollbar-arrows pb-0.5 max-w-full pr-2">
            <MockNoticeBar />
          </div>
        </div>
      </header>

      {/* 2. Mobile Coin List Drawer (Now using common component) */}
      <CoinListDrawer
        isOpen={!isCoinListCollapsed}
        onClose={() => setIsCoinListCollapsed(true)}
        mode="mock"
        holdingSymbols={holdings.map((item) => item.symbol)}
        isParticipated={isParticipated}
        marketMode="spot"
      />

      {/* 3. Main Layout - 헤더 제외 남은 공간 꽉 채움 */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row relative overflow-y-auto lg:overflow-x-hidden scrollbar-hide">
        {/* Dashboard Grid / Mobile Tab Interface */}
        <div className={cn(
          "flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_300px_320px] 2xl:grid-cols-[1fr_320px_360px] lg:grid-rows-[1fr_300px] lg:gap-2 lg:p-2 h-full min-h-[600px] lg:min-h-[650px] min-w-0 bg-white dark:bg-zinc-900 lg:bg-slate-100",
          isCoinListCollapsed ? "" : "overflow-hidden",
          "lg:overflow-visible"
        )}>

          {/* Mobile Only: Header & Tabs (고정 영역) */}
          <div className="lg:hidden flex flex-col shrink-0 border-b border-gray-100 dark:border-gray-700 z-10 bg-white dark:bg-gray-800">
            <div className="bg-white dark:bg-gray-800 relative">
              <CoinHeader
                mode="mock"
                className="bg-white dark:bg-gray-800 border-none relative z-50"
                onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                isSidebarCollapsed={isCoinListCollapsed}
              />
            </div>

            <div className="flex bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 shrink-0">
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trade' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500'}`}
                onClick={() => setMobileTab('trade')}
              >
                주문
                {mobileTab === 'trade' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 dark:bg-emerald-400" />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'chart' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500'}`}
                onClick={() => setMobileTab('chart')}
              >
                차트
                {mobileTab === 'chart' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 dark:bg-emerald-400" />}
              </button>
              <button
                className={`flex-1 py-3 text-[13px] font-black transition-all relative ${mobileTab === 'trades' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-gray-500'}`}
                onClick={() => setMobileTab('trades')}
              >
                체결
                {mobileTab === 'trades' && <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-emerald-600 dark:bg-emerald-400" />}
              </button>
            </div>
          </div>

          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[40] px-3 pb-3 pointer-events-none">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="w-full h-11 bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100 rounded-xl shadow-xl flex items-center justify-between px-4 pointer-events-auto active:scale-[0.98] transition-transform border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                className="relative bg-white dark:bg-gray-800 rounded-t-[24px] shadow-2xl flex flex-col h-[60vh] border-t border-gray-100 dark:border-gray-700 animate-sheet-slide-up"
                style={{ willChange: 'transform, opacity' }}
              >
                <div className="flex flex-col items-center py-3 shrink-0" onClick={() => setIsHistoryOpen(false)}>
                  <div className="w-10 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                   <UserOrderHistory mode="mock" onClose={() => setIsHistoryOpen(false)} />
                </div>
              </div>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          <div className="flex-1 min-h-0 flex flex-col lg:contents overflow-y-auto lg:overflow-hidden scrollbar-hide">
            
            {/* Chart Section */}
            <section className={cn(
              "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2 flex-col min-h-[400px] lg:min-h-[350px] shrink-0",
              "bg-white dark:bg-gray-800 lg:rounded-xl lg:shadow-sm lg:border border-gray-200 dark:border-gray-700",
              mobileTab === 'chart' ? 'flex' : 'hidden lg:flex'
            )}>
              <div className={cn("hidden lg:block border-b border-gray-200 dark:border-gray-700 relative", !isCoinListCollapsed && "z-50")}>
                <CoinHeader
                  mode="mock"
                  className="bg-white dark:bg-gray-800 border-none relative z-50"
                  onToggleSidebar={() => setIsCoinListCollapsed(!isCoinListCollapsed)}
                  isSidebarCollapsed={isCoinListCollapsed}
                />
                {!isCoinListCollapsed && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCoinListCollapsed(true)} />
                    <div className="absolute top-1/2 left-0 w-[420px] h-[calc(100vh-180px)] max-h-[800px] z-50 bg-white dark:bg-gray-800 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                      <CoinList
                        mode="mock"
                        availableMarketTypes={["spot"]}
                        holdingSymbols={holdings.map((item) => item.symbol)}
                        isParticipated={isParticipated}
                        onSelect={() => setIsCoinListCollapsed(true)}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 min-h-0 relative">
                <MainCandleChart
                  mode="mock"
                  className="absolute inset-0 h-full w-full border-none p-2"
                  chartAreaClassName="h-full flex-1 min-h-0"
                />
              </div>
            </section>

            {/* Market Trades (Mobile) */}
            <section className={cn(
              "lg:hidden flex-col bg-white dark:bg-gray-800 min-h-[500px] shrink-0",
              mobileTab === 'trades' ? 'flex' : 'hidden'
            )}>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-bold text-slate-400 dark:text-gray-500 text-xs bg-slate-50 dark:bg-gray-800 tracking-widest shrink-0 uppercase">
                시장 체결 내역
              </div>
              <RecentTrades mode="mock" className="flex-1 border-none !bg-transparent" />
            </section>

            {/* Order Section */}
            <div className={cn(
              "gap-0 lg:gap-2 shrink-0 lg:contents",
              mobileTab === 'trade' ? 'flex flex-col' : 'hidden lg:flex'
            )}>
              
              <div className="flex shrink-0 lg:contents">
                <aside className="w-[42%] min-w-[140px] shrink-0 lg:w-auto lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 flex flex-col bg-white dark:bg-gray-800 lg:rounded-xl lg:shadow-sm lg:border border-r border-gray-200 dark:border-gray-700 lg:border-gray-200 dark:lg:border-gray-700 min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden order-1 lg:order-none scrollbar-hide">
                  <div className="shrink-0 p-1.5 sm:p-2 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
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
                      mode={isDarkMode ? "dark" : "light"}
                    />
                  </div>
                  <div className="shrink-0 p-2 border-b border-gray-200 dark:border-gray-700 lg:hidden font-bold text-slate-400 dark:text-gray-500 text-[11px] text-center bg-slate-50 dark:bg-gray-800/50 tracking-widest uppercase">
                    호가
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="hidden lg:flex flex-col h-full w-full">
                      {activeInfoTab === "orderbook" ? (
                        <OrderBook mode="mock" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      ) : (
                        <RecentTrades mode="mock" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                      )}
                    </div>
                    <div className="flex lg:hidden flex-col h-full w-full">
                      <OrderBook mode="mock" className="flex-1 w-full border-none !bg-transparent !rounded-none" />
                    </div>
                  </div>
                </aside>

                <aside className="flex-1 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-3 bg-white dark:bg-gray-800 lg:rounded-xl lg:shadow-sm lg:border border-gray-200 dark:border-gray-700 min-h-0 min-w-0 overflow-hidden relative order-2 lg:order-none">
                  <OrderForm mode="mock" />
                </aside>
              </div>

              {/* Bottom History (Desktop only) */}
              <section className="lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:row-end-3 bg-white dark:bg-gray-800 lg:rounded-xl lg:shadow-sm lg:border border-t border-gray-200 dark:border-gray-700 lg:border-gray-200 dark:lg:border-gray-700 min-h-[400px] lg:min-h-0 overflow-hidden flex-col shrink-0 hidden lg:flex">
                <UserOrderHistory mode="mock" />
              </section>
            </div>
          </div>
          {/* Bottom Spacer for Mobile (to prevent content being hidden by fixed bottom bar) */}
          <div className="h-20 lg:hidden shrink-0" />
        </div>
      </main>
    </div>
  );
}
