"use client";

import { useBinanceTickers } from "@/hooks/useBinanceTickers";


export default function SimpleChart() {

  const tickers = useBinanceTickers();

    return <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    <span className={`text-lg font-extrabold`}>
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
    </>
}