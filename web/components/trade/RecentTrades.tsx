"use client";

import { useTickerStore } from "@/stores/useTickerStore";

export default function RecentTrades() {
  const { selectedCoin, tickers } = useTickerStore();
  const realtime = tickers[selectedCoin];

  // 로딩 처리
  if (!realtime) {
    return <div className="lg:col-span-3 bg-white border border-gray-200 h-[600px] animate-pulse"></div>;
  }

  const { price } = realtime;

  return (
    <div className="h-[520px] lg:col-span-3 bg-white border border-gray-200 flex flex-col lg:h-full overflow-hidden">
      <div className="p-3 border-b border-gray-200 bg-gray-50/50 font-black text-xs">체결내역</div>
      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-3 text-[10px] font-bold text-gray-500 mb-3 px-1 uppercase">
          <span>시간</span>
          <span className="text-center">가격</span>
          <span className="text-right">수량</span>
        </div>
        <div className="space-y-2">
          {/* 스토어의 실시간 가격(price)을 기준으로 가짜 체결내역 생성 */}
          {[...Array(20)].map((_, i) => {
            // 위아래로 약간씩 흔들리는 가짜 가격
            const tradePrice = price + (i % 2 === 0 ? i * 150 : -i * 120); 
            const isBuy = i % 3 === 0; // 빨간색(매수), 파란색(매도) 교차
            
            return (
              <div key={i} className="grid grid-cols-3 text-[11px] font-bold px-1">
                <span className="text-gray-400 font-medium">17:06:{60 - i}</span>
                <span className={`text-center ${isBuy ? "text-[#E12343]" : "text-[#1763B6]"}`}>
                  {tradePrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
                <span className="text-right text-gray-900">0.00{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}