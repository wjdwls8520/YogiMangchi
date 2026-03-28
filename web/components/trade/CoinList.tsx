"use client";

import { useState, useMemo } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { HiOutlineStar, HiStar } from "react-icons/hi2";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";

import { useTickerStore } from "@/stores/useTickerStore"; 

type SortKey = "displayNameKr" | "price" | "change" | "volume";

export default function CoinList() {
  const { 
    coinMetaList,    // 백엔드가 준 30개 코인 기본 정보
    tickers,         // 1초마다 업데이트되는 실시간 가격 통
    selectedCoin,    // 현재 선택된 주인공 코인
    setSelectedCoin  // 주인공 코인을 바꾸는 스위치
  } = useTickerStore();

  // UI 상태 (화면 조작용 상태는 컴포넌트 안에)
  const [coinTab, setCoinTab] = useState("krw"); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [favorites, setFavorites] = useState<string[]>([]); 
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });

  // 🌟 3. 스토어의 데이터(Meta + Tickers)를 합치고, 검색/정렬을 수행합니다.
  const processedCoins = useMemo(() => {
    let result = coinMetaList.map(coin => {
      const rt = tickers[coin.symbol]; // 실시간 데이터 매칭!
      return {
        ...coin,
        price: rt ? rt.price : 0,
        change: rt ? rt.changeRate : 0,
        volume: rt ? rt.volume : 0,
      };
    });

    // [탭 필터링]
    if (coinTab === "favorite") {
      result = result.filter(c => favorites.includes(c.symbol));
    } else if (coinTab === "have") {
      const mockOwned = ["BTCUSDT", "ETHUSDT"]; // TODO: 실제 보유 코인으로 변경
      result = result.filter(c => mockOwned.includes(c.symbol));
    }

    // [검색 필터링]
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.displayNameKr.toLowerCase().includes(q) || 
        c.baseAsset.toLowerCase().includes(q)
      );
    }

    // [정렬(Sorting)]
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [coinMetaList, tickers, coinTab, searchQuery, favorites, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
  };

  return (
    <aside className="w-full h-200 bg-white border border-gray-200 flex flex-col shrink-0 overflow-hidden rounded-xl">
      
      {/* 검색 & 탭 영역 */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-4">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="자산명/심볼 검색" 
            className="pl-9"
          />
          <HiOutlineSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        </div>
        
        <Tabs 
          activeTab={coinTab}
          onChange={setCoinTab}
          fullWidth={true}
          tabs={[
            { label: "원화", value: "krw" },
            { label: "보유", value: "have" },
            { label: "관심", value: "favorite" }
          ]}
        />
      </div>
      
      {/* 코인 목록 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead className="sticky top-0 bg-white text-[12px] font-bold text-gray-500 border-b border-gray-200 z-10">
            <tr>
              <th className="py-2.5 px-3 text-left cursor-pointer hover:bg-gray-50" onClick={() => requestSort('displayNameKr')}>
                자산 {sortConfig.key === 'displayNameKr' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:bg-gray-50" onClick={() => requestSort('price')}>
                현재가($) {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:bg-gray-50" onClick={() => requestSort('change')}>
                변동(당일) {sortConfig.key === 'change' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-50" onClick={() => requestSort('volume')}>
                거래금액 {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody>
            {processedCoins.map((coin) => {
              const isFav = favorites.includes(coin.symbol);
              const colorClass = coin.change > 0 ? "text-[#E12343]" : coin.change < 0 ? "text-[#1763B6]" : "text-gray-900";
              const priceDisplay = coin.price ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "-";
              const changeDisplay = coin.change ? `${coin.change > 0 ? "+" : ""}${coin.change.toFixed(2)}%` : "-";
              const volumeDisplay = coin.volume ? `${(coin.volume / 1000000).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "-";

              const isSelected = selectedCoin === coin.symbol;

              return (
                <tr 
                  key={coin.symbol} 
                  onClick={() => setSelectedCoin(coin.symbol)}
                  className={`cursor-pointer transition-colors border-b border-gray-100 
                    ${isSelected ? "bg-blue-100/50" : "hover:bg-gray-50"} 
                  `}
                >
                  <td className="py-3 px-3 flex items-center gap-2">
                    <button onClick={(e) => toggleFavorite(coin.symbol, e)} className="p-1 active:scale-90 transition-transform">
                      {isFav ? (
                        <HiStar className="size-4 text-yellow-400 drop-shadow-sm" />
                      ) : (
                        <HiOutlineStar className="size-4 text-gray-300 hover:text-yellow-200" />
                      )}
                    </button>
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900">{coin.displayNameKr}</span>
                      <span className=" text-gray-400 font-medium tracking-tighter">{coin.baseAsset}/{coin.quoteAsset}</span>
                    </div>
                  </td>
                  <td className={`py-3 px-2 text-right font-black ${colorClass}`}>{priceDisplay}</td>
                  <td className={`py-3 px-2 text-right font-bold ${colorClass}`}>{changeDisplay}</td>
                  <td className="py-3 px-3 text-right font-bold">{volumeDisplay}<span className="text-gray-400">백만</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* 상태 표시 */}
        {coinMetaList.length === 0 && <div className="py-10 text-center text-[11px] text-gray-400 font-bold">목록을 불러오는 중입니다...</div>}
        {coinMetaList.length > 0 && processedCoins.length === 0 && <div className="py-10 text-center text-[11px] text-gray-400 font-bold">목록이 존재하지 않습니다.</div>}
      </div>
    </aside>
  );
}