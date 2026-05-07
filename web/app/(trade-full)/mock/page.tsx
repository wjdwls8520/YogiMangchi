"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RefreshCcw, TriangleAlert, Lightbulb } from "lucide-react";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import OrderBook from "@/components/trade/OrderBook";
import RecentTrades from "@/components/trade/RecentTrades";
import CoinList from "@/components/trade/CoinList";
import OrderForm from "@/components/trade/OrderForm";
import UserOrderHistory from "@/components/trade/UserOrderHistory";
import MockNoticeBar from "@/components/mock/MockNoticeBar";
import Tabs from "@/components/ui/Tabs";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { cn } from "@/lib/utils/cs";

export default function MockTradingPage() {
  const isParticipated = useMockWalletStore((state) => state.isParticipated);
  const holdings = useMockWalletStore((state) => state.holdings);
  const [isCoinListCollapsed, setIsCoinListCollapsed] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("orderbook");

  useEffect(() => {
    document.body.classList.add("bg-[#0B0E11]");
    return () => document.body.classList.remove("bg-[#0B0E11]");
  }, []);

  useBinanceWebSocket(); // 기본 현물 웹소켓 연결

  return (
    <div className="dark grid h-screen w-full grid-rows-[48px_1fr] bg-[#0B0E11] text-gray-200 overflow-hidden">
      {/* 1. Top Header - 모의투자 (에메랄드 포인트) */}
      <header className="flex items-center justify-between border-b-2 border-emerald-500/50 bg-[#16201A] px-4 z-20">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="text-white/40 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold truncate">
            {isParticipated ? (
              <>
                <TriangleAlert aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-yellow-300" />
                <p className="truncate text-gray-300">
                  현재 <span className="text-yellow-300 font-black">모의투자(연습)</span> 모드로 접속 중입니다. 실제 자산이 소모되지 않습니다.
                </p>
              </>
            ) : (
              <>
                <Lightbulb aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-yellow-200" />
                <p className="truncate text-gray-300">
                  요기망치 모의투자에 오신 것을 환영합니다! 초기 자금을 받고 투자를 연습해 보세요.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* 변경된 MockNoticeBar를 헤더 우측에 배치 */}
          <MockNoticeBar />
          
          <div className="ml-4 pl-4 border-l border-white/5">
            <button className="p-2 text-white/40 hover:text-white transition-colors">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Layout */}
      <div className="grid grid-cols-[auto_1fr] h-full min-h-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <aside className={cn("h-full border-r border-white/5 bg-[#161A1E] transition-all duration-300", isCoinListCollapsed ? "w-0 overflow-hidden" : "w-[360px] overflow-hidden flex flex-col")}>
          <div className="flex-1 overflow-auto bg-[#161A1E]">
             <CoinList 
               mode="mock"
               availableMarketTypes={["spot"]}
               holdingSymbols={holdings.map((item) => item.symbol)}
               isParticipated={isParticipated}
             />
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

          {/* Activity Section */}
          <section className="col-start-1 col-end-3 row-start-2 row-end-3 bg-[#161A1E] border-t-4 border-[#0B0E11] border-r border-white/5 min-h-0 overflow-hidden">
             <UserOrderHistory mode="mock" />
          </section>

          {/* Order Panel */}
          <aside className="col-start-3 col-end-4 row-start-1 row-end-3 bg-[#161A1E] min-h-0 min-w-0 overflow-y-auto relative">
              <OrderForm mode="mock" />
          </aside>
        </div>
      </div>
    </div>
  );
}
