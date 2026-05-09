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
  mode?: "mock" | "trade";
};

export default function OrderBook({ className, mode = "trade" }: OrderBookProps) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const realtime = useTickerStore((state) => state.tickers[state.selectedCoin]);
  const setSelectedOrderPrice = useTickerStore((state) => state.setSelectedOrderPrice);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pendingDepthRef = useRef<BinanceDepthMessage | null>(null);
  const asksContainerRef = useRef<HTMLDivElement>(null);

  const coinMetaList = useTickerStore((state) => state.coinMetaList);

  // 현재 선택된 코인의 메타 정보에서 Quote Asset (단위) 가져오기
  const currentCoinMeta = coinMetaList.find(c => c.symbol === selectedCoin);
  const quoteAsset = currentCoinMeta?.quoteAsset || "USDT";

  // 상/하단에 노출할 호가 개수 (모바일 8개, PC 12개)
  const [displayCount, setDisplayCount] = useState(12);

  useEffect(() => {
    const updateCount = () => {
      setDisplayCount(window.innerWidth < 1024 ? 8 : 12);
    };
    updateCount();
    window.addEventListener('resize', updateCount);
    return () => window.removeEventListener('resize', updateCount);
  }, []);

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

  // 매도 호가 스크롤 하단 고정 (현재가 근처가 먼저 보이도록)
  useEffect(() => {
    if (asksContainerRef.current) {
      asksContainerRef.current.scrollTop = asksContainerRef.current.scrollHeight;
    }
  }, [asks]);

  const bestAsk = asks[0]?.price ?? 0;
  const bestBid = bids[0]?.price ?? 0;
  const fallbackPrice = bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : 0;
  const currentPrice = realtime?.price ?? fallbackPrice;
  const changeRate = realtime?.changeRate ?? 0;

  // 상단 매도호가는 현재가보다 큰 가격만, 하단 매수호가는 현재가보다 작은 가격만 노출
  const displayAsks = [...asks]
    .filter(level => level.price > currentPrice)
    .slice(0, displayCount)
    .reverse();
    
  const displayBids = [...bids]
    .filter(level => level.price < currentPrice)
    .slice(0, displayCount);

  // 현재가와 정확히 일치하는 호가의 잔량 찾기
  const matchingLevel = [...asks, ...bids].find(level => level.price === currentPrice);
  const currentPriceQty = matchingLevel?.quantity ?? null;

  const maxAskQty = displayAsks.length > 0 ? Math.max(...displayAsks.map((item) => item.quantity)) : 1;
  const maxBidQty = displayBids.length > 0 ? Math.max(...displayBids.map((item) => item.quantity)) : 1;

  const isMock = mode === "mock";
  const isSpot = selectedMarketType === "spot";

  if (isLoading && asks.length === 0 && bids.length === 0) {
    const loadingBgCls = isMock ? "bg-white border border-gray-200" : "bg-[#161A1E] border border-white/5";
    return (
      <div className={cn(`flex-1 min-h-[600px] animate-pulse rounded-xl lg:col-span-3 ${loadingBgCls}`, className)} />
    );
  }

  const sellTextColor = isSpot || isMock ? "text-[#0058FF]" : "text-[#F6465D]";
  const sellBgColor = isSpot || isMock ? "bg-[#0058FF]/10" : "bg-red-500/10";
  const buyTextColor = isSpot || isMock ? "text-[#fb2c36]" : "text-[#2EBD85]";
  const buyBgColor = isSpot || isMock ? "bg-[#fb2c36]/10" : "bg-green-500/10";

  const containerBg = isMock ? "bg-transparent" : "bg-[#161A1E] border border-white/5 rounded-xl";
  const headerBg = isMock ? "bg-slate-50 border-gray-100" : "bg-white/[0.02] border-white/5";
  const headerText = isMock ? "text-slate-500" : "text-gray-500";
  const chartBg = isMock ? "bg-white" : "bg-black/[0.02]";
  const rowHover = isMock ? "hover:bg-slate-50" : "hover:bg-white/[0.03]";
  const qtyColor = isMock ? "text-slate-500" : "text-gray-400";
  const centerBtnBg = isMock ? "bg-slate-50 hover:bg-slate-100 border-gray-100" : "bg-white/[0.04] hover:bg-white/[0.08] border-white/5";

  return (
    <div className={cn(`flex flex-col flex-1 min-h-0 overflow-hidden md:col-span-1 lg:col-span-3 ${containerBg}`, className)}>
      {/* 헤더 */}
      <div className={`grid grid-cols-2 px-3 sm:px-4 py-2 sm:py-3 border-b font-black text-[10px] uppercase tracking-widest ${headerText} ${headerBg}`}>
        <span>가격({quoteAsset})</span>
        <span className="text-right">수량</span>
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden py-1 ${chartBg}`}>
        {/* 매도 호가 영역 */}
        <div ref={asksContainerRef} className="flex-1 flex flex-col overflow-y-auto min-h-0 custom-scrollbar scroll-smooth">
          <div className="flex flex-col mt-auto">
            {displayAsks.map((level) => (
              <div
                key={`ask-${level.price}`}
                onClick={() => setSelectedOrderPrice(level.price)}
                className={`group flex justify-between items-center h-[20px] px-3 sm:px-4 relative cursor-pointer transition-colors min-w-0 ${rowHover}`}
              >
                <div
                  className={cn("absolute right-0 top-0 bottom-0 transition-all duration-300", sellBgColor)}
                  style={{ width: getBarWidth(level.quantity, maxAskQty) }}
                />
                <span className={cn("relative z-10 text-[10px] sm:text-[11px] font-black truncate mr-2", sellTextColor)}>
                  {formatPrice(level.price)}
                </span>
                <span className={`relative z-10 text-[10px] sm:text-[11px] font-bold tabular-nums truncate ${qtyColor}`}>
                  {formatQty(level.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 현재가 (가운데) - 화이트 배경, 블랙 테두리/폰트 (2px) */}
        <div className="py-1 shrink-0">
          <button 
            onClick={() => currentPrice > 0 && setSelectedOrderPrice(currentPrice)}
            className={cn(
              "w-full h-[28px] flex items-center justify-between px-3 sm:px-4 transition-all z-10 border-y-2",
              "bg-white border-black"
            )}
          >
            <span className="text-[11px] sm:text-[12px] font-black tabular-nums tracking-tighter truncate text-black">
              {currentPrice > 0 ? formatPrice(currentPrice) : "-"}
            </span>
            <span className="text-[11px] sm:text-[12px] font-bold text-black tabular-nums">
              {currentPriceQty !== null ? formatQty(currentPriceQty) : "-"}
            </span>
          </button>
        </div>

        {/* 매수 호가 영역 */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0 custom-scrollbar">
          <div className="flex flex-col">
            {displayBids.map((level) => (
              <div
                key={`bid-${level.price}`}
                onClick={() => setSelectedOrderPrice(level.price)}
                className={`group flex justify-between items-center h-[20px] px-3 sm:px-4 relative cursor-pointer transition-colors min-w-0 ${rowHover}`}
              >
                <div
                  className={cn("absolute right-0 top-0 bottom-0 transition-all duration-300", buyBgColor)}
                  style={{ width: getBarWidth(level.quantity, maxBidQty) }}
                />
                <span className={cn("relative z-10 text-[10px] sm:text-[11px] font-black truncate mr-2", buyTextColor)}>
                  {formatPrice(level.price)}
                </span>
                <span className={`relative z-10 text-[10px] sm:text-[11px] font-bold tabular-nums truncate ${qtyColor}`}>
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
