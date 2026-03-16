// app/test/page.tsx
"use client";

import { useBinanceTickers } from "@/hooks/useBinanceTickers"; 

export default function TestWebSocketPage() {
  const tickers = useBinanceTickers(); // 아까 만든 완벽한 훅을 여기서 호출합니다!

  return (
    <div className="flex min-h-screen flex-col items-center py-16 bg-[#F8F9FA]">
      
      <div className="w-full max-w-5xl px-4">
        <div className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            🛠️ 웹소켓 테스트 페이지
          </h1>
          <p className="text-gray-500">
            기존 코드를 건드리지 않고 30개 코인 실시간 연동을 테스트하는 공간입니다.
          </p>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          실시간 마켓 동향
        </h2>

        {/* 바둑판 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {tickers.map((coin) => {
            const isUp = coin.changeRate > 0;
            const isDown = coin.changeRate < 0;
            const colorClass = coin.isLoading ? "text-gray-300" : isUp ? "text-red-500" : isDown ? "text-blue-500" : "text-gray-500";
            const bgColorClass = coin.isLoading ? "bg-gray-100" : isUp ? "bg-red-50" : isDown ? "bg-blue-50" : "bg-gray-50";

            return (
              <div 
                key={coin.symbol} 
                className="flex flex-col rounded-2xl bg-white p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer"
              >
                <span className="text-sm font-bold text-gray-500 mb-1">
                  {coin.symbol.replace('USDT', '')}
                </span>
                
                {coin.isLoading ? (
                  <>
                    <span className="text-lg font-extrabold text-gray-300 animate-pulse">Loading...</span>
                    <span className={`text-xs font-semibold mt-1 px-2 py-1 rounded-md w-max text-gray-400 bg-gray-100`}>
                      - %
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`text-lg font-extrabold ${colorClass}`}>
                      ${coin.price}
                    </span>
                    <span className={`text-xs font-semibold mt-1 px-2 py-1 rounded-md w-max ${colorClass} ${bgColorClass}`}>
                      {isUp ? '+' : ''}{coin.changeRate.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}