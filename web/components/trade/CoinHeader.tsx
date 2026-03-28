"use client";

import { useTickerStore } from "@/stores/useTickerStore";

export default function CoinHeader() {
  // 🌟 1. 저수지에서 필요한 물(데이터)만 딱 떠옵니다!
  const { selectedCoin, tickers, coinMetaList } = useTickerStore();

  // 🌟 2. 선택된 코인의 '한국어 이름' 등을 찾기 위해 목록을 뒤집니다.
  const meta = coinMetaList.find(c => c.symbol === selectedCoin);
  
  // 🌟 3. 선택된 코인의 '실시간 가격 데이터'를 꺼냅니다.
  const realtime = tickers[selectedCoin];

  // 💡 데이터가 아직 도착하기 전(0.5초)에는 뼈대(스켈레톤)만 보여줘서 에러를 막습니다.
  if (!meta || !realtime) {
    return (
      <header aria-label="코인 요약 정보" className="bg-white p-5 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 h-[88px] animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-48"></div>
        <div className="flex gap-6">
           <div className="h-8 bg-gray-100 rounded w-20"></div>
           <div className="h-8 bg-gray-100 rounded w-20"></div>
        </div>
      </header>
    );
  }

  // 화면에 예쁘게 그리기 위한 값 세팅
  const { price, changeRate, volume, highPrice, lowPrice } = realtime;
  const isUp = changeRate > 0;
  const isDown = changeRate < 0;
  const colorClass = isUp ? "text-[#E12343]" : isDown ? "text-[#1763B6]" : "text-gray-900";
  const sign = isUp ? "▲" : isDown ? "▼" : "";

  return (
    <header aria-label="코인 요약 정보" className="bg-white p-5 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 transition-all">
      <div className="flex items-center gap-6">
        {/* 코인 이름 & 심볼 */}
        <div className="flex flex-col">
           <h1 className="text-2xl font-black text-gray-900">{meta.displayNameKr}</h1>
           <span className="text-sm font-bold text-gray-400 italic">{meta.baseAsset}/{meta.quoteAsset}</span>
        </div>
        
        {/* 현재 가격 & 변동률 */}
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-black ${colorClass}`}>
            {price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
          <span className={`text-sm font-bold ${colorClass}`}>
            {sign} {Math.abs(changeRate).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 24시간 부가 정보들 */}
      <div className="flex gap-6 text-[11px] font-bold">
        <div className="border-l border-gray-200 pl-4">
          <p className="text-gray-400 mb-1">고가(24H)</p>
          <p className="text-gray-900 font-black">
            {highPrice?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || "-"}
          </p>
        </div>
        <div className="border-l border-gray-200 pl-4">
          <p className="text-gray-400 mb-1">저가(24H)</p>
          <p className="text-gray-900 font-black">
            {lowPrice?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || "-"}
          </p>
        </div>
        <div className="border-l border-gray-200 pl-4">
          <p className="text-gray-400 mb-1">거래량(24H)</p>
          <p className="text-gray-900 font-black">
            {volume?.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-gray-400 font-medium">{meta.baseAsset}</span>
          </p>
        </div>
      </div>
    </header>
  );
}