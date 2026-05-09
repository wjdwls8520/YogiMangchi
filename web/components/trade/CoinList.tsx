"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, Star } from "lucide-react";
import Input from "@/components/ui/Input";
import Tabs from "@/components/ui/Tabs";
import SegmentTabs from "@/components/ui/SegmentTabs";
import { useTickerStore } from "@/stores/useTickerStore";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { getMarketLabel, type MarketType } from "@/lib/utils/market";
import { cn } from "@/lib/utils/cs";
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
  onSelect?: (symbol: string) => void;
};

export default function CoinList({
  mode = "trade",
  availableMarketTypes = ["spot"],
  holdingSymbols = [],
  isParticipated = false,
  headerAction,
  headerActionPosition = "right",
  onSelect,
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

  const isLogin = useAuthStore((state) => state.isLogin);

  useEffect(() => {
    if (isLogin) {
      fetchFavorites();
    }
  }, [fetchFavorites, isLogin]);

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

  const isMock = mode === "mock";
  const bgMain = isMock ? "bg-white text-slate-900 border-gray-200" : "bg-[#161A1E] text-white border-white/5";
  const borderSub = isMock ? "border-gray-100" : "border-white/5";
  const bgInput = isMock ? "bg-slate-50" : "bg-[#1E2329]";
  const textMain = isMock ? "text-slate-900" : "text-gray-200";
  const textMuted = isMock ? "text-slate-500" : "text-gray-500";
  const textQty = isMock ? "text-slate-600" : "text-gray-300";
  const bgHeader = isMock ? "bg-slate-50" : "bg-[#161A1E]";
  const rowHover = isMock ? "hover:bg-slate-50" : "hover:bg-white/5";
  const rowSelected = isMock ? "bg-blue-50" : "bg-blue-500/10";

  return (
    <aside className={cn("w-full h-full min-h-0 flex flex-col shrink-0 overflow-hidden border-r", bgMain)}>
      <div className={cn("p-4 border-b", borderSub)}>
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
            className={cn("pl-9", bgInput, borderSub, textMain)}
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

      <div className={cn("flex-1 overflow-y-auto px-3", isMock ? "scrollbar-light" : "scrollbar-custom")}>
        <table className="w-full text-[11px] whitespace-nowrap">
          <thead className={cn("sticky top-0 z-10 text-[12px] font-bold border-b", bgHeader, textMuted, borderSub)}>
            <tr>
              <th
                className={cn("py-2.5 px-3 text-left cursor-pointer transition-colors", rowHover)}
                onClick={() => requestSort("displayNameKr")}
              >
                자산{" "}
                {sortConfig.key === "displayNameKr" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className={cn("py-2.5 px-2 text-right cursor-pointer transition-colors", rowHover)}
                onClick={() => requestSort("price")}
              >
                현재가($){" "}
                {sortConfig.key === "price" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className={cn("py-2.5 px-2 text-right cursor-pointer transition-colors", rowHover)}
                onClick={() => requestSort("change")}
              >
                변동률{" "}
                {sortConfig.key === "change" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th
                className={cn("py-2.5 px-3 text-right cursor-pointer transition-colors", rowHover)}
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
                    : textMain;

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
                  onClick={() => {
                    setSelectedCoin(coin.symbol);
                    onSelect?.(coin.symbol);
                  }}
                  className={cn("cursor-pointer transition-colors border-b", borderSub, isSelected ? rowSelected : rowHover)}
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
                        <Star className="size-4 text-gray-300 group-hover:text-yellow-500 transition-colors" />
                      )}
                    </button>

                    <div className="flex flex-col">
                      <span className={cn("font-black", textMain)}>
                        {coin.displayNameKr}
                      </span>
                      <span className={cn("font-bold tracking-tighter text-[10px]", textMuted)}>
                        {coin.baseAsset}/{coin.quoteAsset}
                      </span>
                    </div>
                  </td>

                  <td className={cn("py-3 px-2 text-right font-black tabular-nums", colorClass)}>
                    {priceDisplay}
                  </td>

                  <td className={cn("py-3 px-2 text-right font-bold tabular-nums", colorClass)}>
                    {changeDisplay}
                  </td>

                  <td className={cn("py-3 px-3 text-right font-bold", textQty)}>
                    {volumeDisplay}
                    <span className={cn("ml-0.5 text-[9px]", textMuted)}>M</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {processedCoins.length === 0 && (
          <div className={cn("py-10 text-center text-[11px] font-bold", textMuted)}>
            {getEmptyMessage()}
          </div>
        )}
      </div>
    </aside>
  );
}

