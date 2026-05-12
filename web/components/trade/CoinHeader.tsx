"use client";

import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { cn } from "@/lib/utils/cs";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";

type CoinHeaderProps = {
  className?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  mode?: "mock" | "trade" | "contest";
};

export default function CoinHeader({
  className,
  onToggleSidebar,
  isSidebarCollapsed = true,
  mode = "trade"
}: CoinHeaderProps) {
  const isContest = mode === "contest";
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const realtime = useTickerStore((state) => state.tickers[state.selectedCoin]);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);

  const meta = coinMetaList.find(c => c.symbol === selectedCoin);

  if (!meta) {
    return (
      <header aria-label="코인 요약 정보" className={cn("bg-white dark:bg-gray-800 px-3 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 min-h-[48px] animate-pulse", className)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-md"></div>
          <div className="h-5 bg-gray-100 dark:bg-gray-900 rounded w-40"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-5 bg-gray-100 dark:bg-gray-900 rounded w-16"></div>
          <div className="h-5 bg-gray-100 dark:bg-gray-900 rounded w-16"></div>
        </div>
      </header>
    );
  }

  const isSpot = selectedMarketType === "spot";
  const isMock = mode === "mock";

  // 화면에 예쁘게 그리기 위한 값 세팅
  const price = realtime?.price ?? null;
  const changeRate = realtime?.changeRate ?? null;
  const volume = realtime?.volume ?? null;
  const highPrice = realtime?.highPrice ?? null;
  const lowPrice = realtime?.lowPrice ?? null;
  const normalizedChangeRate = changeRate ?? 0;
  const isUp = normalizedChangeRate > 0;
  const isDown = normalizedChangeRate < 0;

  const buyTextColor = isContest ? "text-trade-long" : (isSpot || isMock ? "text-[#fb2c36]" : "text-[#2EBD85]");
  const sellTextColor = isContest ? "text-trade-short" : (isSpot || isMock ? "text-[#0058FF]" : "text-[#F6465D]");
  const neutralColor = isMock ? "text-slate-900 dark:text-gray-100" : (isContest || className?.includes("bg-[#161A1E]") ? "text-gray-100" : "text-gray-900 dark:text-gray-100");
  const colorClass = isUp ? buyTextColor : isDown ? sellTextColor : neutralColor;

  const sign = isUp ? (isSpot ? "▲" : "+") : isDown ? (isSpot ? "▼" : "") : "";

  return (
    <header aria-label="코인 요약 정보" className={cn("px-3 flex flex-col justify-center shrink-0 py-2 min-h-[64px] lg:h-auto lg:py-3 transition-all", isContest ? "bg-futures-trade border-b border-futures-border" : "bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700", className)}>
      {/* 첫 번째 줄 (모바일) / 왼쪽 영역 (데스크탑) */}
      <div className="flex items-center justify-start gap-4 lg:gap-8 min-w-0 w-full lg:w-auto">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* 사이드바 토글 버튼 */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-md transition-all shrink-0 group cursor-pointer text-slate-400 hover:text-slate-900 hover:bg-slate-50"
            >
              {isSidebarCollapsed ? <ChevronDown className="w-5 h-5 lg:w-6 lg:h-6" /> : <ChevronUp className="w-5 h-5 lg:w-6 lg:h-6" />}
            </button>
          )}

          {/* 코인 이름 & 심볼 */}
          <div className="flex flex-col">
            <h1 className={cn("text-base lg:text-lg font-black leading-none", isContest ? "text-white" : "text-slate-900 dark:text-gray-100")}>{meta.displayNameKr}</h1>
            <span className={cn("text-[9px] lg:text-[10px] font-bold italic leading-none mt-1", isContest ? "text-white/30" : "text-slate-400 dark:text-gray-500")}>{meta.baseAsset}/{meta.quoteAsset}</span>
          </div>
        </div>

        {/* 현재 가격 & 변동률 (이름 바로 옆에 배치) */}
        <div className="flex items-baseline gap-2">
          <span className={`text-lg lg:text-xl font-black leading-none ${colorClass}`}>
            {price === null ? "-" : formatAssetNumber(price, { standardMaxFractionDigits: 4, smallMaxFractionDigits: 8 })}
          </span>
          <span className={`text-[10px] lg:text-[11px] font-bold ${colorClass}`}>
            {changeRate === null ? "시세 연결 중" : `${sign} ${Math.abs(changeRate).toFixed(2)}%`}
          </span>
        </div>
      </div>

      {/* 지표 영역 (모든 화면에서 표시) */}
      <div className={cn("flex items-center gap-3 sm:gap-6 mt-2 pt-2 border-t overflow-x-auto no-scrollbar", isContest ? "border-white/5" : "border-gray-100 dark:border-gray-700")}>
        <div className="flex flex-col">
          <p className={cn("text-[9px] lg:text-[10px] mb-0.5 uppercase tracking-tighter", isContest ? "text-white/30" : "text-slate-400 dark:text-gray-500")}>고가(24H)</p>
          <p className={cn("text-[10px] lg:text-[11px] font-black", isContest ? "text-white/70" : "text-slate-900 dark:text-gray-200")}>
            {highPrice === null ? "-" : formatAssetNumber(highPrice, { standardMaxFractionDigits: 4, smallMaxFractionDigits: 8 })}
          </p>
        </div>
        <div className="flex flex-col">
          <p className={cn("text-[9px] lg:text-[10px] mb-0.5 uppercase tracking-tighter", isContest ? "text-white/30" : "text-slate-400 dark:text-gray-500")}>저가(24H)</p>
          <p className={cn("text-[10px] lg:text-[11px] font-black", isContest ? "text-white/70" : "text-slate-900 dark:text-gray-200")}>
            {lowPrice === null ? "-" : formatAssetNumber(lowPrice, { standardMaxFractionDigits: 4, smallMaxFractionDigits: 8 })}
          </p>
        </div>
        <div className={cn("flex flex-col border-l pl-3", isContest ? "border-white/5" : "border-gray-100 dark:border-gray-700")}>
          <p className={cn("text-[10px] mb-0.5 uppercase tracking-tighter", isContest ? "text-white/30" : "text-slate-400 dark:text-gray-500")}>거래량(24H)</p>
          <p className={cn("text-[11px] font-black", isContest ? "text-white/70" : "text-slate-900 dark:text-gray-200")}>
            {volume === null ? "-" : volume.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className={cn("font-medium", isContest ? "text-white/30" : "text-slate-400 dark:text-gray-500")}>{meta.baseAsset}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
