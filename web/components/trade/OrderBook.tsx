//호가
"use client";

import { useEffect, useRef, useState } from "react";
import { useTickerStore } from "@/stores/useTickerStore";
import { getBinanceWsUrl } from "@/lib/utils/market";
import { cn } from "@/lib/utils/cs";
import { ArrowUp, ArrowDown } from "lucide-react";

type OrderBookLevel = {
  price: number;
  quantity: number;
};

type BinanceDepthMessage = {
  lastUpdateId?: number;
  bids?: [string, string][];
  asks?: [string, string][];
  b?: [string, string][];
  a?: [string, string][];
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

const getDepthLevels = (data: BinanceDepthMessage) => {
  // Spot and futures use different field names for partial depth payloads.
  const asks = Array.isArray(data.asks) ? data.asks : Array.isArray(data.a) ? data.a : [];
  const bids = Array.isArray(data.bids) ? data.bids : Array.isArray(data.b) ? data.b : [];

  return { asks, bids };
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

const getBarWidth = (qty: number, maxQty: number) => {
  if (maxQty <= 0) return "0%";
  return `${Math.max((qty / maxQty) * 100, 6)}%`;
};

type OrderBookProps = {
  className?: string;
};

export default function OrderBook({ className }: OrderBookProps) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const realtime = useTickerStore((state) => state.tickers[state.selectedCoin]);
  const setSelectedOrderPrice = useTickerStore((state) => state.setSelectedOrderPrice);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pendingDepthRef = useRef<BinanceDepthMessage | null>(null);

  const coinMetaList = useTickerStore((state) => state.coinMetaList);

  // 현재 선택된 코인의 메타 정보에서 Quote Asset (단위) 가져오기
  const currentCoinMeta = coinMetaList.find(c => c.symbol === selectedCoin);
  const quoteAsset = currentCoinMeta?.quoteAsset || "USDT";

  // 상/하단에 노출할 호가 개수 고정 (잘림 방지를 위해 12개로 조정)
  const DISPLAY_COUNT = 12;

  useEffect(() => {
    if (!selectedCoin) return;

    let isActive = true;
    const resetFrame = window.requestAnimationFrame(() => {
      setIsLoading(true);
      setAsks([]);
      setBids([]);
    });

    const stream = `${selectedCoin.toLowerCase()}@depth20`;
    const ws = new WebSocket(
      getBinanceWsUrl({
        marketType: selectedMarketType,
        stream,
        isCombined: false,
      })
    );
    
    const flushInterval = window.setInterval(() => {
      const data = pendingDepthRef.current;
      if (!isActive || !data) return;

      const { asks: rawAsks, bids: rawBids } = getDepthLevels(data);
      if (rawAsks.length === 0 || rawBids.length === 0) return;

      const nextAsks = parseLevels(rawAsks).sort((a, b) => a.price - b.price);
      const nextBids = parseLevels(rawBids).sort((a, b) => b.price - a.price);

      setAsks(nextAsks);
      setBids(nextBids);
      setIsLoading(false);
      pendingDepthRef.current = null;
    }, 200);

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
  }, [selectedCoin, selectedMarketType]);

  // 상단 매도호가는 가격이 높은 순서대로 위에서부터 정렬
  const displayAsks = [...asks].slice(0, DISPLAY_COUNT).reverse();
  const displayBids = [...bids].slice(0, DISPLAY_COUNT);

  const maxAskQty = displayAsks.length > 0 ? Math.max(...displayAsks.map((item) => item.quantity)) : 1;
  const maxBidQty = displayBids.length > 0 ? Math.max(...displayBids.map((item) => item.quantity)) : 1;

  const bestAsk = asks[0]?.price ?? 0;
  const bestBid = bids[0]?.price ?? 0;
  const fallbackPrice = bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0;

  const currentPrice = realtime?.price ?? fallbackPrice;
  const changeRate = realtime?.changeRate ?? 0;

  if (isLoading && asks.length === 0 && bids.length === 0) {
    return (
      <div className={cn("flex-1 min-h-[600px] animate-pulse border border-white/5 bg-[#161A1E] rounded-xl lg:col-span-3", className)} />
    );
  }

  const isSpot = selectedMarketType === "spot";
  const sellTextColor = isSpot ? "text-[#0058FF]" : "text-[#F6465D]";
  const sellBgColor = isSpot ? "bg-[#0058FF]/10" : "bg-red-500/10";
  const buyTextColor = isSpot ? "text-[#fb2c36]" : "text-[#2EBD85]";
  const buyBgColor = isSpot ? "bg-[#fb2c36]/10" : "bg-green-500/10";

  return (
    <div className={cn("flex flex-col flex-1 min-h-0 overflow-hidden border border-white/5 bg-[#161A1E] rounded-xl md:col-span-1 lg:col-span-3", className)}>
      {/* 헤더 */}
      <div className="grid grid-cols-2 px-4 py-3 border-b border-white/5 font-black text-[10px] uppercase tracking-widest text-gray-500 bg-white/[0.02]">
        <span>가격({quoteAsset})</span>
        <span className="text-right">수량</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-black/[0.02] py-1">
        {/* 매도 호가 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex flex-col mt-auto">
            {displayAsks.map((level) => (
              <div
                key={`ask-${level.price}`}
                onClick={() => setSelectedOrderPrice(level.price)}
                className="group flex justify-between items-center h-[20px] px-4 relative cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className={cn("absolute right-0 top-0 bottom-0 transition-all duration-300", sellBgColor)}
                  style={{ width: getBarWidth(level.quantity, maxAskQty) }}
                />
                <span className={cn("relative z-10 text-[11px] font-black", sellTextColor)}>
                  {formatPrice(level.price)}
                </span>
                <span className="relative z-10 text-[11px] font-bold text-gray-400 tabular-nums">
                  {formatQty(level.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 현재가 (가운데) - 클릭 시 오더폼 입력 기능 추가 */}
        <button 
          onClick={() => currentPrice > 0 && setSelectedOrderPrice(currentPrice)}
          className="h-10 shrink-0 bg-white/[0.04] flex flex-col justify-center border-y border-white/5 z-10 px-4 hover:bg-white/[0.08] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {changeRate > 0 ? (
                <ArrowUp className={cn("size-3.5 stroke-[3]", buyTextColor)} />
              ) : changeRate < 0 ? (
                <ArrowDown className={cn("size-3.5 stroke-[3]", sellTextColor)} />
              ) : null}
              <span className={cn(
                "text-lg font-black tabular-nums tracking-tighter",
                changeRate > 0 ? buyTextColor : changeRate < 0 ? sellTextColor : "text-white"
              )}>
                {currentPrice > 0 ? formatPrice(currentPrice) : "-"}
              </span>
            </div>
            
            <div className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded",
              changeRate > 0 ? `${buyBgColor} ${buyTextColor}` : changeRate < 0 ? `${sellBgColor} ${sellTextColor}` : "bg-gray-500/10 text-gray-500"
            )}>
              {changeRate > 0 ? "+" : ""}{changeRate.toFixed(2)}%
            </div>
          </div>
        </button>

        {/* 매수 호가 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex flex-col">
            {displayBids.map((level) => (
              <div
                key={`bid-${level.price}`}
                onClick={() => setSelectedOrderPrice(level.price)}
                className="group flex justify-between items-center h-[20px] px-4 relative cursor-pointer hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className={cn("absolute right-0 top-0 bottom-0 transition-all duration-300", buyBgColor)}
                  style={{ width: getBarWidth(level.quantity, maxBidQty) }}
                />
                <span className={cn("relative z-10 text-[11px] font-black", buyTextColor)}>
                  {formatPrice(level.price)}
                </span>
                <span className="relative z-10 text-[11px] font-bold text-gray-400 tabular-nums">
                  {formatQty(level.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
