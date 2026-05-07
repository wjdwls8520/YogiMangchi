"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, Star  } from "lucide-react";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";
import SegmentTabs from "@/components/ui/SegmentTabs";
import { useTickerStore } from "@/stores/useTickerStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { getMarketLabel, type MarketType } from "@/lib/utils/market";
import type { RealtimeData } from "@/stores/useTickerStore";

type SortKey = "displayNameKr" | "price" | "change" | "volume";
type CoinTab = "all" | "have" | "favorite";

type CoinListProps = {
  mode?: "mock" | "trade" | "contest";
  availableMarketTypes?: MarketType[];
  holdingSymbols?: string[];
  isParticipated?: boolean;
  headerAction?: ReactNode;
  headerActionPosition?: "left" | "right";
};

export default function CoinList({
  mode = "trade",
  availableMarketTypes = ["spot"],
  holdingSymbols = [],
  isParticipated = false,
  headerAction,
  headerActionPosition = "right",
}: CoinListProps) {
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const setSelectedCoin = useTickerStore((state) => state.setSelectedCoin);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const setSelectedMarketType = useTickerStore(
    (state) => state.setSelectedMarketType
  );

  const { favorites, fetchFavorites, toggleFavorite } = useFavoriteStore();

  const latestTickersRef = useRef<Record<string, RealtimeData>>(
    useTickerStore.getState().tickers
  );
  const [renderTickers, setRenderTickers] = useState<Record<string, RealtimeData>>(
    latestTickersRef.current
  );

  const [coinTab, setCoinTab] = useState<CoinTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc" | null;
  }>({
    key: null,
    direction: null,
  });

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    if (availableMarketTypes.includes(selectedMarketType)) {
      return;
    }

    setSelectedMarketType(availableMarketTypes[0] ?? "spot");
  }, [availableMarketTypes, selectedMarketType, setSelectedMarketType]);

  useEffect(() => {
    // ticker store 변경을 바로 렌더하지 않고 2초 단위로만 화면에 반영합니다.
    const unsubscribe = useTickerStore.subscribe((state) => {
      latestTickersRef.current = state.tickers;
    });

    const flushInterval = window.setInterval(() => {
      setRenderTickers((prev) =>
        prev === latestTickersRef.current ? prev : latestTickersRef.current
      );
    }, 2000);

    return () => {
      unsubscribe();
      window.clearInterval(flushInterval);
    };
  }, []);

  const holdingSymbolSet = new Set(holdingSymbols);

  let processedCoins = coinMetaList.map((coin) => {
    const realtime = renderTickers[coin.symbol];

    return {
      ...coin,
      price: realtime ? realtime.price : 0,
      change: realtime ? realtime.changeRate : 0,
      volume: realtime ? realtime.volume : 0,
    };
  });

  if (coinTab === "favorite") {
    processedCoins = processedCoins.filter((coin) => favorites.includes(coin.symbol));
  }

  if (coinTab === "have") {
    processedCoins = processedCoins.filter((coin) => holdingSymbolSet.has(coin.symbol));
  }

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();

    processedCoins = processedCoins.filter(
      (coin) =>
        coin.displayNameKr.toLowerCase().includes(q) ||
        coin.baseAsset.toLowerCase().includes(q)
      );
  }

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

  const handleToggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(symbol);
  };

  const getEmptyMessage = () => {
    if (coinMetaList.length === 0) {
      return "목록을 불러오는 중입니다...";
    }

    if (coinTab === "have" && mode === "trade") {
      return "실전 보유 자산은 아직 연결 전입니다.";
    }

    if (coinTab === "have" && !isParticipated) {
      return mode === "contest"
        ? "대회 계좌가 활성화되면 보유 목록이 표시됩니다."
        : "모의투자 계좌를 생성하면 보유 목록이 표시됩니다.";
    }

    if (coinTab === "have") {
      return "보유 중인 코인이 없습니다.";
    }

    return "목록이 존재하지 않습니다.";
  };

  return (
    <aside className="w-full h-full min-h-0 bg-[#161A1E] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        {headerAction && (
          <div className="mb-4">
            {headerAction}
          </div>
        )}

        <div className="relative mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="자산명, 심볼 검색"
            className="pl-9 bg-[#1E2329] border-white/5 text-gray-200"
          />
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
        </div>

        <SegmentTabs
          activeTab={coinTab}
          onChange={(value) => setCoinTab(value as CoinTab)}
          tabs={[
            { label: "전체", value: "all" },
            { label: "보유", value: "have" },
            { label: "관심", value: "favorite" },
          ]}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-[11px] whitespace-nowrap">
          <thead className="sticky top-0 bg-[#161A1E] text-[12px] font-bold text-gray-400 border-b border-white/5 z-10">
            <tr>
              <th
                className="py-2.5 px-3 text-left cursor-pointer hover:bg-white/5"
                onClick={() => requestSort("displayNameKr")}
              >
                자산{" "}
                {sortConfig.key === "displayNameKr" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:bg-white/5"
                onClick={() => requestSort("price")}
              >
                현재가($){" "}
                {sortConfig.key === "price" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="py-2.5 px-2 text-right cursor-pointer hover:bg-white/5"
                onClick={() => requestSort("change")}
              >
                변동률{" "}
                {sortConfig.key === "change" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-white/5"
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

              const isSpotMode = selectedMarketType === "spot" || mode === "mock";
              const buyColor = isSpotMode ? "text-[#fb2c36]" : "text-emerald-400";
              const sellColor = isSpotMode ? "text-[#0058FF]" : "text-rose-400";

              const colorClass =
                coin.change > 0
                  ? buyColor
                  : coin.change < 0
                    ? sellColor
                    : "text-gray-200";

              const priceDisplay = coin.price
                ? coin.price.toLocaleString(undefined, {
                    minimumFractionDigits: coin.price < 1 ? 2 : 2,
                    maximumFractionDigits: coin.price < 1 ? 8 : 4,
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
                  className={`cursor-pointer transition-colors border-b border-white/5 ${
                    isSelected ? "bg-blue-500/10" : "hover:bg-white/5"
                  }`}
                >
                  <td className="py-3 px-3 flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleFavorite(coin.symbol, e)}
                      className="p-1 active:scale-90 transition-transform group"
                    >
                      {isFavorite ? (
                        <Star
                          className="size-4 text-[#F0B90B] fill-[#F0B90B] drop-shadow-[0_0_2px_rgba(240,185,11,0.5)]"
                        />
                      ) : (
                        <Star className="size-4 text-gray-600 group-hover:text-yellow-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex flex-col">
                      <span className="font-black text-gray-200">
                        {coin.displayNameKr}
                      </span>
                      <span className="text-gray-500 font-bold tracking-tighter text-[10px]">
                        {coin.baseAsset}/{coin.quoteAsset}
                      </span>
                    </div>
                  </td>

                  <td className={`py-3 px-2 text-right font-black tabular-nums ${colorClass}`}>
                    {priceDisplay}
                  </td>

                  <td className={`py-3 px-2 text-right font-bold tabular-nums ${colorClass}`}>
                    {changeDisplay}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-gray-300">
                    {volumeDisplay}
                    <span className="text-gray-500 ml-0.5 text-[9px]">M</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {processedCoins.length === 0 && (
          <div className="py-10 text-center text-[11px] text-gray-500 font-bold">
            {getEmptyMessage()}
          </div>
        )}
      </div>
    </aside>
  );
}

