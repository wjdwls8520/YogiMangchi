"use client";

import { useEffect, useRef, useState } from "react";
import { useTickerStore } from "@/stores/useTickerStore";
import { getBinanceRecentTradesApiUrl, getBinanceWsUrl } from "@/lib/utils/market";
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

const MAX_RECENT_TRADES = 22;

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
  mode?: "mock" | "trade";
};

export default function RecentTrades({ className, mode = "trade" }: RecentTradesProps) {
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
    const ws = new WebSocket(
      getBinanceWsUrl({
        marketType: selectedMarketType,
        stream,
        isCombined: false,
      })
    );

    const flushInterval = window.setInterval(() => {
      if (!isActive) return;
      if (pendingTradesRef.current.length === 0) return;

      setTrades((prev) => mergeUniqueTrades(pendingTradesRef.current, prev));
      pendingTradesRef.current = [];
      setIsLoading(false);
    }, 200);

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

        if (!Number.isFinite(nextTrade.price) || !Number.isFinite(nextTrade.quantity)) return;

        pendingTradesRef.current = mergeUniqueTrades([nextTrade], pendingTradesRef.current);
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

  const currentCoinMeta = coinMetaList.find(c => c.symbol === selectedCoin);
  const quoteAsset = currentCoinMeta?.quoteAsset || "USDT";

  const isMock = mode === "mock";
  const bgMain = isMock ? "bg-white text-slate-900 border-gray-200" : "bg-[#161A1E] text-gray-100 border-white/5";
  const headerBg = isMock ? "bg-slate-50 border-gray-100" : "bg-white/[0.02] border-white/5";
  const textMuted = isMock ? "text-slate-500" : "text-gray-500";
  const textQty = isMock ? "text-slate-600" : "text-gray-400";
  const rowHover = isMock ? "hover:bg-slate-50" : "hover:bg-white/[0.03]";

  if (isLoading && trades.length === 0) {
    return (
      <div className={cn("flex-1 min-h-[600px] animate-pulse border rounded-xl lg:col-span-4", bgMain, className)} />
    );
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const displayTrades = isMobile ? trades.slice(0, 20) : trades;

  return (
    <div className={cn("flex flex-col flex-1 min-h-0 overflow-hidden border rounded-xl md:col-span-1 lg:col-span-4 shadow-sm", bgMain, className)}>
      <div className={cn("grid grid-cols-3 px-4 py-3 border-b font-black text-[10px] uppercase tracking-widest", textMuted, headerBg)}>
        <span>시간</span>
        <span className="text-right">가격({quoteAsset})</span>
        <span className="text-right">수량</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden py-1">
        {displayTrades.length === 0 ? (
          <div className={cn("h-full flex items-center justify-center text-[11px] font-bold", textMuted)}>
            체결 내역이 없습니다.
          </div>
        ) : (
          <div className={cn("flex flex-col overflow-y-auto", isMock ? "scrollbar-light" : "scrollbar-custom")}>
            {displayTrades.map((trade) => (
              <div
                key={trade.id}
                onClick={() => setSelectedOrderPrice(trade.price)}
                className={cn("group grid grid-cols-3 items-center h-[20px] px-4 cursor-pointer transition-colors", rowHover)}
              >
                <span className={cn("text-[10px] font-bold tabular-nums", textMuted)}>
                  {formatTime(trade.time)}
                </span>

                <span className={cn(
                  "text-[11px] font-black text-right tabular-nums",
                  trade.isBuyerMaker
                    ? (selectedMarketType === "spot" || isMock ? "text-[#0058FF]" : "text-[#F6465D]")
                    : (selectedMarketType === "spot" || isMock ? "text-[#fb2c36]" : "text-[#2EBD85]")
                )}>
                  {formatPrice(trade.price)}
                </span>

                <span className={cn("text-[11px] font-bold text-right tabular-nums", textQty)}>
                  {formatQty(trade.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
