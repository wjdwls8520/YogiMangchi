"use client";

import { useTickerStore } from "@/stores/useTickerStore";

export default function OrderBook() {
  const { selectedCoin, tickers } = useTickerStore();
  const realtime = tickers[selectedCoin];

  if (!realtime) {
    return <div className="lg:col-span-4 bg-white border border-gray-200 h-[600px] animate-pulse"></div>;
  }

  const { price, changeRate } = realtime;
  // 호가 간격 (가격이 크면 크게, 작으면 작게)
  const tickSize = price > 1000 ? 1000 : price > 10 ? 0.1 : 0.001; 

  return (
    <div className="h-[520px] lg:col-span-4 bg-white border border-gray-200 flex flex-col lg:h-full overflow-hidden">
      <div className="grid grid-cols-2 p-3 border-b border-gray-200 font-black text-xs bg-gray-50/50">
        <span>호가</span>
        <span className="text-right">잔량</span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* 매도 호가 (현재가보다 높은 가격들) */}
        {[...Array(10)].reverse().map((_, i) => {
          const askPrice = price + (i + 1) * tickSize;
          return (
            <div key={`ask-${i}`} className="flex justify-between items-center h-10 px-4 relative border-b border-gray-100 hover:bg-blue-50/10 cursor-pointer">
              <div className="absolute right-0 top-0 bottom-0 bg-blue-50/30" style={{ width: `${(10 - i) * 8}%` }}></div>
              <span className="relative z-10 text-[12px] font-black text-[#1763B6]">
                {askPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
              <span className="relative z-10 text-[11px] font-bold text-gray-500">0.1245</span>
            </div>
          );
        })}

        {/* 현재가 (가운데 띠) */}
        <div className="h-12 bg-gray-100 flex items-center justify-between px-4 sticky top-0 bottom-0 z-10 border-y border-gray-300">
          <span className="text-sm font-black text-gray-900">
            {price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
          <span className={`text-[10px] font-bold tracking-tight ${changeRate > 0 ? "text-red-500" : "text-blue-500"}`}>
            {changeRate > 0 ? "▲" : "▼"} {Math.abs(changeRate).toFixed(2)}%
          </span>
        </div>

        {/* 매수 호가 (현재가보다 낮은 가격들) */}
        {[...Array(10)].map((_, i) => {
          const bidPrice = price - (i + 1) * tickSize;
          return (
            <div key={`bid-${i}`} className="flex justify-between items-center h-10 px-4 relative border-b border-gray-100 hover:bg-red-50/10 cursor-pointer">
              <div className="absolute right-0 top-0 bottom-0 bg-red-50/30" style={{ width: `${(i + 1) * 10}%` }}></div>
              <span className="relative z-10 text-[12px] font-black text-[#E12343]">
                {bidPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
              <span className="relative z-10 text-[11px] font-bold text-gray-500">0.4502</span>
            </div>
          );
        })}

      </div>
    </div>
  );
}