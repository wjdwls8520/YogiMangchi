"use client";

import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";

import CoinList from "@/components/trade/CoinList";
import CoinHeader from "@/components/trade/CoinHeader";
import MainCandleChart from "@/components/trade/CoinChart";
import RecentTrades from "@/components/trade/RecentTrades";
import OrderBook from "@/components/trade/OrderBook";
import OrderForm from "@/components/trade/OrderForm";
import UserOrderHistory from "@/components/trade/UserOrderHistory";
import MockNoticeBar from "@/components/mock/MockNoticeBar";

export default function TradingPage() {
  useBinanceWebSocket();

  return (
    <>
      <MockNoticeBar />
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* 왼쪽영역 */}
        <div className="w-full lg:w-[390px] shrink-0 lg:sticky lg:top-24.5 lg:h-[calc(100vh-32px)]">
          <CoinList mode="mock"/>
        </div>

        {/* 오른쪽영역 */}
        <main className="flex-1 flex flex-col gap-3 w-full overflow-x-hidden">
          <CoinHeader />

          <section className="w-full bg-white border border-gray-200 shrink-0">
            <MainCandleChart />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch lg:h-[520px]">
            <RecentTrades />
            <OrderBook />
            <OrderForm mode="mock" />
          </section>

          <UserOrderHistory mode="mock"/>
        </main>

      </div>
    </>
  );
}