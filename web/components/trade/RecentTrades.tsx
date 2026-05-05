"use client";

import { useEffect, useRef, useState } from "react";
import { useTickerStore } from "@/stores/useTickerStore";
import { getBinanceRecentTradesApiUrl, getBinanceWsBaseUrl } from "@/lib/utils/market";
import { cn } from "@/lib/utils/cs";

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

const mergeUniqueTrades = (incoming: TradeItem[], current: TradeItem[]) => {
  const seenTradeIds = new Set<number>();
  const uniqueTrades: TradeItem[] = [];

  for (const trade of [...incoming, ...current]) {
    if (seenTradeIds.has(trade.id)) continue;

    seenTradeIds.add(trade.id);
    uniqueTrades.push(trade);
  }

  return uniqueTrades.slice(0, MAX_RECENT_TRADES);
};

const formatPrice = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value < 1 ? 2 : 2,
    maximumFractionDigits: value < 1 ? 8 : 4,
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

type RecentTradesProps = {
  className?: string;
};

export default function RecentTrades({ className }: RecentTradesProps) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const setSelectedOrderPrice = useTickerStore((state) => state.setSelectedOrderPrice);
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

    const meta = coinMetaList.find((c) => c.symbol === selectedCoin);
    const binanceSymbol = (meta?.binanceRequestSymbol || selectedCoin).toUpperCase();

    // REST API로 최근 체결 즉시 로딩
    const fetchInitialTrades = async () => {
      try {
        const url = getBinanceRecentTradesApiUrl({ marketType: selectedMarketType, symbol: binanceSymbol, limit: MAX_RECENT_TRADES });
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!isActive || !Array.isArray(data)) return;

        const initialTrades: TradeItem[] = data
          .map((d: { id: number; price: string; qty: string; time: number; isBuyerMaker: boolean }) => ({
            id: d.id,
            price: Number(d.price),
            quantity: Number(d.qty),
            time: d.time,
            isBuyerMaker: d.isBuyerMaker,
          }))
          .filter((t: TradeItem) => Number.isFinite(t.price) && Number.isFinite(t.quantity))
          .reverse();

        if (isActive && initialTrades.length > 0) {
          setTrades(initialTrades);
          setIsLoading(false);
        }
      } catch {
        // REST 실패해도 WebSocket으로 데이터 들어옴
      }
    };
    void fetchInitialTrades();

    const stream = `${binanceSymbol.toLowerCase()}@trade`;
    const wsBaseUrl = getBinanceWsBaseUrl(selectedMarketType);
    const ws = new WebSocket(`${wsBaseUrl}/ws/${stream}`);
    const flushInterval = window.setInterval(() => {
      if (!isActive) return;
      if (pendingTradesRef.current.length === 0) return;

      setTrades((prev) =>
        mergeUniqueTrades(pendingTradesRef.current, prev)
      );
      pendingTradesRef.current = [];
      setIsLoading(false);
    }, 500);

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

        pendingTradesRef.current = mergeUniqueTrades(
          [nextTrade],
          pendingTradesRef.current
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
  }, [selectedCoin, selectedMarketType, coinMetaList]);

  return (
    <div
      className={cn(
        "flex h-[520px] flex-col overflow-hidden border border-gray-200 bg-white md:col-span-1 lg:col-span-4 lg:h-full",
        className
      )}
    >
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
              onClick={() => setSelectedOrderPrice(trade.price)}
              className="grid grid-cols-3 items-center h-10 px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
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
