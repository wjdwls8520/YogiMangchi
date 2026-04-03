//호가
"use client";

import { useEffect, useRef, useState } from "react";
import { useTickerStore } from "@/stores/useTickerStore";

type OrderBookLevel = {
  price: number;
  quantity: number;
};

type BinanceDepthMessage = {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
};

const parseLevels = (levels: [string, string][]) => {
  return levels
    .map(([price, quantity]) => ({
      price: Number(price),
      quantity: Number(quantity),
    }))
    .filter(
      (level) =>
        Number.isFinite(level.price) &&
        Number.isFinite(level.quantity) &&
        level.quantity > 0
    );
};

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

const getBarWidth = (qty: number, maxQty: number) => {
  if (maxQty <= 0) return "0%";
  return `${Math.max((qty / maxQty) * 100, 6)}%`;
};

export default function OrderBook() {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const realtime = useTickerStore((state) => state.tickers[state.selectedCoin]);

  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pendingDepthRef = useRef<BinanceDepthMessage | null>(null);

  useEffect(() => {
    if (!selectedCoin) return;

    let isActive = true;
    const resetFrame = window.requestAnimationFrame(() => {
      setIsLoading(true);
      setAsks([]);
      setBids([]);
    });

    // 실시간 수신은 유지하고, 화면 반영만 2초마다 한 번씩 한다.
    const stream = `${selectedCoin.toLowerCase()}@depth10`;
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
    const flushInterval = window.setInterval(() => {
      const data = pendingDepthRef.current;

      if (!isActive || !data) return;
      if (!Array.isArray(data.asks) || !Array.isArray(data.bids)) return;

      const nextAsks = parseLevels(data.asks).sort((a, b) => a.price - b.price);
      const nextBids = parseLevels(data.bids).sort((a, b) => b.price - a.price);

      setAsks(nextAsks);
      setBids(nextBids);
      setIsLoading(false);
      pendingDepthRef.current = null;
    }, 2000);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BinanceDepthMessage;

        if (!isActive) return;
        pendingDepthRef.current = data;
      } catch (error) {
        console.error("바이낸스 호가 데이터 파싱 실패:", error);
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
      pendingDepthRef.current = null;
      ws.close();
    };
  }, [selectedCoin]);

  // asks는 낮은 가격 -> 높은 가격 순으로 들어오므로,
  // 화면에서는 현재가 바로 위에 가장 낮은 매도호가가 붙게 reverse 해서 보여줌
  const displayAsks = [...asks].reverse();

  const maxAskQty =
    displayAsks.length > 0
      ? Math.max(...displayAsks.map((item) => item.quantity))
      : 1;

  const maxBidQty =
    bids.length > 0 ? Math.max(...bids.map((item) => item.quantity)) : 1;

  const bestAsk = asks[0]?.price ?? 0;
  const bestBid = bids[0]?.price ?? 0;
  const fallbackPrice =
    bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0;

  const currentPrice = realtime?.price ?? fallbackPrice;
  const changeRate = realtime?.changeRate ?? 0;

  if (isLoading && asks.length === 0 && bids.length === 0) {
    return (
      <div className="lg:col-span-4 bg-white border border-gray-200 h-[600px] animate-pulse" />
    );
  }

  return (
    <div className="h-[520px] lg:col-span-4 bg-white border border-gray-200 flex flex-col lg:h-full overflow-hidden">
      <div className="grid grid-cols-2 p-3 border-b border-gray-200 font-black text-xs bg-gray-50/50">
        <span>호가</span>
        <span className="text-right">수량</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {displayAsks.length === 0 && bids.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm font-bold text-gray-400">
            호가 정보를 불러오지 못했습니다.
          </div>
        ) : (
          <>
            {displayAsks.map((level) => (
              <div
                key={`ask-${level.price}`}
                className="flex justify-between items-center h-10 px-4 relative border-b border-gray-100 hover:bg-blue-50/10 cursor-pointer"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-blue-50/30"
                  style={{ width: getBarWidth(level.quantity, maxAskQty) }}
                />
                <span className="relative z-10 text-[12px] font-black text-[#1763B6]">
                  {formatPrice(level.price)}
                </span>
                <span className="relative z-10 text-[11px] font-bold text-gray-500">
                  {formatQty(level.quantity)}
                </span>
              </div>
            ))}

            <div className="h-12 bg-gray-100 flex items-center justify-between px-4 sticky top-0 bottom-0 z-10 border-y border-gray-300">
              <span className="text-sm font-black text-gray-900">
                {currentPrice > 0 ? formatPrice(currentPrice) : "-"}
              </span>
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  changeRate > 0
                    ? "text-red-500"
                    : changeRate < 0
                      ? "text-blue-500"
                      : "text-gray-500"
                }`}
              >
                {changeRate > 0 ? "+" : changeRate < 0 ? "-" : ""}
                {Math.abs(changeRate).toFixed(2)}%
              </span>
            </div>

            {bids.map((level) => (
              <div
                key={`bid-${level.price}`}
                className="flex justify-between items-center h-10 px-4 relative border-b border-gray-100 hover:bg-red-50/10 cursor-pointer"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-red-50/30"
                  style={{ width: getBarWidth(level.quantity, maxBidQty) }}
                />
                <span className="relative z-10 text-[12px] font-black text-[#E12343]">
                  {formatPrice(level.price)}
                </span>
                <span className="relative z-10 text-[11px] font-bold text-gray-500">
                  {formatQty(level.quantity)}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
