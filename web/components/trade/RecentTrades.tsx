"use client";

import { useEffect, useRef, useState } from "react";
import { useTickerStore } from "@/stores/useTickerStore";
import { getBinanceWsBaseUrl } from "@/lib/utils/market";

type TradeItem = {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
};

type BinanceTradeMessage = {
  t: number;
  p: string;
  q: string;
  T: number;
  m: boolean;
};

const MAX_RECENT_TRADES = 20;

const formatPrice = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 4,
  });
};

const formatQty = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export default function RecentTrades() {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pendingTradesRef = useRef<TradeItem[]>([]);

  useEffect(() => {
    if (!selectedCoin) return;

    let isActive = true;
    const resetFrame = window.requestAnimationFrame(() => {
      setTrades([]);
      setIsLoading(true);
      pendingTradesRef.current = [];
    });

    const stream = `${selectedCoin.toLowerCase()}@trade`;
    const wsBaseUrl = getBinanceWsBaseUrl(selectedMarketType);
    const ws = new WebSocket(`${wsBaseUrl}/ws/${stream}`);
    const flushInterval = window.setInterval(() => {
      if (!isActive) return;
      if (pendingTradesRef.current.length === 0) return;

      setTrades((prev) =>
        [...pendingTradesRef.current, ...prev].slice(0, MAX_RECENT_TRADES)
      );
      pendingTradesRef.current = [];
      setIsLoading(false);
    }, 2000);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BinanceTradeMessage;

        if (!isActive) return;

        const nextTrade: TradeItem = {
          id: data.t,
          price: Number(data.p),
          quantity: Number(data.q),
          time: data.T,
          isBuyerMaker: data.m,
        };

        if (
          !Number.isFinite(nextTrade.price) ||
          !Number.isFinite(nextTrade.quantity)
        ) {
          return;
        }

        pendingTradesRef.current = [nextTrade, ...pendingTradesRef.current].slice(
          0,
          MAX_RECENT_TRADES
        );
      } catch (error) {
        console.error("바이낸스 체결 데이터 파싱 실패:", error);
      }
    };

    ws.onerror = () => {
      if (!isActive) return;
      setIsLoading(false);
    };

    return () => {
      isActive = false;
      window.cancelAnimationFrame(resetFrame);
      window.clearInterval(flushInterval);
      pendingTradesRef.current = [];
      ws.close();
    };
  }, [selectedCoin, selectedMarketType]);

  return (
    <div className="h-[520px] md:col-span-1 lg:col-span-4 bg-white border border-gray-200 flex flex-col lg:h-full overflow-hidden">
      <div className="grid grid-cols-3 p-4 pr-6 border-b border-gray-200 font-black text-xs bg-gray-50/50">
        <span>체결시간</span>
        <span className="text-right">체결가</span>
        <span className="text-right">체결량</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && trades.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-bold text-gray-400">
            체결 내역 불러오는 중...
          </div>
        ) : trades.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-bold text-gray-400">
            체결 내역이 없습니다.
          </div>
        ) : (
          trades.map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-3 items-center h-10 px-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <span className="text-[11px] font-medium text-gray-500">
                {formatTime(trade.time)}
              </span>

              <span
                className={`text-[12px] font-black text-right ${
                  trade.isBuyerMaker ? "text-trade-sell" : "text-trade-buy"
                }`}
              >
                {formatPrice(trade.price)}
              </span>

              <span className="text-[11px] font-bold text-gray-500 text-right">
                {formatQty(trade.quantity)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
