"use client";

import { useState } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { HiOutlineStar, HiStar } from "react-icons/hi2";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";
import { useTickerStore } from "@/stores/useTickerStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

type SortKey = "displayNameKr" | "price" | "change" | "volume";
type CoinTab = "krw" | "have" | "favorite";

type CoinListProps = {
  // mock 페이지에서는 mock, trading 페이지에서는 trade
  mode?: "mock" | "trade";
};

export default function CoinList({ mode = "trade" }: CoinListProps) {
  const { coinMetaList, tickers, selectedCoin, setSelectedCoin } = useTickerStore();
  const { holdings, isParticipated } = useMockWalletStore();

  const [coinTab, setCoinTab] = useState<CoinTab>("krw");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc" | null;
  }>({
    key: null,
    direction: null,
  });

  // mock 데모 페이지일 때만 보유 심볼을 사용
  const holdingSymbols = mode === "mock" ? holdings.map((item) => item.symbol) : [];
  const holdingSymbolSet = new Set(holdingSymbols);

  // 1. 코인 기본정보 + 실시간 정보 합치기
  let processedCoins = coinMetaList.map((coin) => {
    const realtime = tickers[coin.symbol];

    return {
      ...coin,
      price: realtime ? realtime.price : 0,
      change: realtime ? realtime.changeRate : 0,
      volume: realtime ? realtime.volume : 0,
    };
  });

  // 2. 탭 필터
  if (coinTab === "favorite") {
    processedCoins = processedCoins.filter((coin) => favorites.includes(coin.symbol));
  }

  if (coinTab === "have") {
    processedCoins = processedCoins.filter((coin) => holdingSymbolSet.has(coin.symbol));
  }

  // 3. 검색 필터
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();

    processedCoins = processedCoins.filter(
      (coin) =>
        coin.displayNameKr.toLowerCase().includes(q) ||
        coin.baseAsset.toLowerCase().includes(q)
    );
  }

  // 4. 정렬
  if (sortConfig.key) {
    processedCoins = [...processedCoins].sort((a, b) => {
      const valueA = a[sortConfig.key!];
      const valueB = b[sortConfig.key!];

      if (valueA < valueB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  const requestSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "desc";

    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }

    setSortConfig({ key, direction });
  };

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();

    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((item) => item !== symbol)
        : [...prev, symbol]
    );
  };

  const getEmptyMessage = () => {
    if (coinMetaList.length === 0) {
      return "목록을 불러오는 중입니다...";
    }

    if (coinTab === "have" && mode !== "mock") {
      return "실전 보유 자산은 아직 연결 전입니다.";
    }

    if (coinTab === "have" && !isParticipated) {
      return "모의투자 계좌를 생성하면 보유 목록이 표시됩니다.";
    }

    if (coinTab === "have") {
      return "보유 중인 코인이 없습니다.";
    }

    return "목록이 존재하지 않습니다.";
  };

  return (
    <aside className="w-full h-200 bg-white border border-gray-200 flex flex-col shrink-0 overflow-hidden rounded-xl">
      <div className="p-4 border-b border-gray-200">
        <div className="relative mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="자산명, 심볼 검색"
            className="pl-9"
          />
          <HiOutlineSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        </div>

        <Tabs
          activeTab={coinTab}
          onChange={(value) => setCoinTab(value as CoinTab)}
          fullWidth={true}
          tabs={[
            { label: "원화", value: "krw" },
            { label: "보유", value: "have" },
            { label: "관심", value: "favorite" },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead className="sticky top-0 bg-white text-[12px] font-bold text-gray-500 border-b border-gray-200 z-10">
            <tr>
              <th
                className="py-2.5 px-3 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => requestSort("displayNameKr")}
              >
                자산{" "}
                {sortConfig.key === "displayNameKr" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:bg-gray-50"
                onClick={() => requestSort("price")}
              >
                현재가($){" "}
                {sortConfig.key === "price" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:bg-gray-50"
                onClick={() => requestSort("change")}
              >
                변동률(%){" "}
                {sortConfig.key === "change" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-50"
                onClick={() => requestSort("volume")}
              >
                거래금액{" "}
                {sortConfig.key === "volume" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>

          <tbody>
            {processedCoins.map((coin) => {
              const isFavorite = favorites.includes(coin.symbol);
              const isSelected = selectedCoin === coin.symbol;

              const colorClass =
                coin.change > 0
                  ? "text-[#E12343]"
                  : coin.change < 0
                    ? "text-[#1763B6]"
                    : "text-gray-900";

              const priceDisplay = coin.price
                ? coin.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })
                : "-";

              const changeDisplay =
                coin.change || coin.change === 0
                  ? `${coin.change > 0 ? "+" : ""}${coin.change.toFixed(2)}%`
                  : "-";

              const volumeDisplay = coin.volume
                ? (coin.volume / 1000000).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })
                : "-";

              return (
                <tr
                  key={coin.symbol}
                  onClick={() => setSelectedCoin(coin.symbol)}
                  className={`cursor-pointer transition-colors border-b border-gray-100 ${
                    isSelected ? "bg-blue-100/50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-3 px-3 flex items-center gap-2">
                    <button
                      onClick={(e) => toggleFavorite(coin.symbol, e)}
                      className="p-1 active:scale-90 transition-transform"
                    >
                      {isFavorite ? (
                        <HiStar className="size-4 text-yellow-400 drop-shadow-sm" />
                      ) : (
                        <HiOutlineStar className="size-4 text-gray-300 hover:text-yellow-200" />
                      )}
                    </button>

                    <div className="flex flex-col">
                      <span className="font-black text-gray-900">
                        {coin.displayNameKr}
                      </span>
                      <span className="text-gray-400 font-medium tracking-tighter">
                        {coin.baseAsset}/{coin.quoteAsset}
                      </span>
                    </div>
                  </td>

                  <td className={`py-3 px-2 text-right font-black ${colorClass}`}>
                    {priceDisplay}
                  </td>

                  <td className={`py-3 px-2 text-right font-bold ${colorClass}`}>
                    {changeDisplay}
                  </td>

                  <td className="py-3 px-3 text-right font-bold">
                    {volumeDisplay}
                    <span className="text-gray-400">백만</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {processedCoins.length === 0 && (
          <div className="py-10 text-center text-[11px] text-gray-400 font-bold">
            {getEmptyMessage()}
          </div>
        )}
      </div>
    </aside>
  );
}
