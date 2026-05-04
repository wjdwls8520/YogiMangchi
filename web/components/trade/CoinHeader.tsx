"use client";

import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { cn } from "@/lib/utils/cs";

export default function CoinHeader({ className }: { className?: string }) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const realtime = useTickerStore((state) => state.tickers[state.selectedCoin]);

  const meta = coinMetaList.find(c => c.symbol === selectedCoin);

  if (!meta) {
    return (
      <header aria-label="코인 요약 정보" className={cn("bg-white px-3 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 min-h-[48px] animate-pulse", className)}>
        <div className="h-5 bg-gray-100 rounded w-40"></div>
        <div className="flex gap-4">
           <div className="h-5 bg-gray-100 rounded w-16"></div>
           <div className="h-5 bg-gray-100 rounded w-16"></div>
        </div>
      </header>
    );
  }

  // 화면에 예쁘게 그리기 위한 값 세팅
  const price = realtime?.price ?? null;
  const changeRate = realtime?.changeRate ?? null;
  const volume = realtime?.volume ?? null;
  const highPrice = realtime?.highPrice ?? null;
  const lowPrice = realtime?.lowPrice ?? null;
  const normalizedChangeRate = changeRate ?? 0;
  const isUp = normalizedChangeRate > 0;
  const isDown = normalizedChangeRate < 0;
  const colorClass = isUp ? "text-trade-buy" : isDown ? "text-trade-sell" : "text-gray-900";
  const sign = isUp ? "▲" : isDown ? "▼" : "";

  return (
    <header aria-label="코인 요약 정보" className={cn("bg-white p-3 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 min-h-[48px] transition-all", className)}>
      <div className="flex items-center gap-4">
        {/* 코인 이름 & 심볼 */}
        <div className="flex flex-col">
           <h1 className={cn("text-lg font-black text-gray-900 leading-none", className?.includes("bg-[#161A1E]") && "text-gray-100")}>{meta.displayNameKr}</h1>
           <span className="text-[10px] font-bold text-gray-400 italic leading-none mt-1">{meta.baseAsset}/{meta.quoteAsset}</span>
        </div>
        
        {/* 현재 가격 & 변동률 */}
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-black ${colorClass}`}>
            {price === null
              ? "-"
              : formatAssetNumber(price, {
                  standardMaxFractionDigits: 4,
                  smallMaxFractionDigits: 8,
                })}
          </span>
          <span className={`text-[11px] font-bold ${colorClass}`}>
            {changeRate === null
              ? "시세 연결 중"
              : `${sign} ${Math.abs(changeRate).toFixed(2)}%`}
          </span>
        </div>
      </div>

      {/* 24시간 부가 정보들 */}
      <div className="flex gap-4 text-[10px] font-bold">
        <div className={cn("border-l border-gray-200 pl-3", className?.includes("bg-[#161A1E]") && "border-white/5")}>
          <p className="text-gray-400 mb-0.5">고가(24H)</p>
          <p className={cn("text-gray-900 font-black", className?.includes("bg-[#161A1E]") && "text-gray-200")}>
            {highPrice === null || highPrice === undefined
              ? "-"
              : formatAssetNumber(highPrice, {
                  standardMaxFractionDigits: 4,
                  smallMaxFractionDigits: 8,
                })}
          </p>
        </div>
        <div className={cn("border-l border-gray-200 pl-3", className?.includes("bg-[#161A1E]") && "border-white/5")}>
          <p className="text-gray-400 mb-0.5">저가(24H)</p>
          <p className={cn("text-gray-900 font-black", className?.includes("bg-[#161A1E]") && "text-gray-200")}>
            {lowPrice === null || lowPrice === undefined
              ? "-"
              : formatAssetNumber(lowPrice, {
                  standardMaxFractionDigits: 4,
                  smallMaxFractionDigits: 8,
                })}
          </p>
        </div>
        <div className={cn("border-l border-gray-200 pl-3", className?.includes("bg-[#161A1E]") && "border-white/5")}>
          <p className="text-gray-400 mb-0.5">거래량(24H)</p>
          <p className={cn("text-gray-900 font-black", className?.includes("bg-[#161A1E]") && "text-gray-200")}>
            {volume === null
              ? "-"
              : volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
            <span className="text-gray-400 font-medium">{meta.baseAsset}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
