"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Label,
} from "recharts";
import FolderTabs from "@/components/ui/FolderTabs";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import { cn, getProfitColorClass, getSideColorClass } from "@/lib/utils/cs";
import AssetSummaryCard, { type AssetSummary } from "@/components/asset/AssetSummaryCard";
import TickerCell from "@/components/trade/TickerCell";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { useTickerStore } from "@/stores/useTickerStore";
import { useMarketStore, type MarketSymbolMeta } from "@/stores/useMarketStore";
import { formatDateTime } from "@/lib/utils/date";
import {
  getBaseAssetLabel,
  getDefaultQuoteAssetLabel,
  getDisplaySymbolLabel,
} from "@/lib/utils/market-display";
import { getNotificationSseBridgeEventName, type ForwardedNotificationEventName } from "@/lib/utils/notification-sse";
import {
  formatAssetNumber,
  formatNumber,
  formatSignedNumber,
  formatSignedPercent
} from "@/lib/utils/number";
import {
  getUnifiedRealAssetDetail,
  type RealAssetUnifiedResponse,
  type AssetPortfolioDetail,
} from "@/lib/api/asset";
import { fetchClient } from "@/lib/api/client";
import {
  getMyParticipatingContestSeasons,
  getContestParticipationSeasonsByMember,
  getMyContestSeasonResult,
  type ContestParticipationSeason,
  type MyContestSeasonResult,
} from "@/lib/api/contest";
import {
  getFuturesWalletStatus,
  getFinishedContestWalletStatus,
  getContestFuturesOpenPositions,
  getContestFuturesOrders,
  getContestFuturesClosedPositions,
  type FuturesWalletStatus
} from "@/lib/api/contest-futures";
import {
  fetchOrders,
  fetchOpenOrders,
  fetchTradeHistories,
  type OrderItem as SpotOrderItem,
  type TradeHistoryItem as SpotTradeItem,
  type AssetType
} from "@/lib/api/trade";
import {
  getFuturesOrders,
  getFuturesOpenPositions,
  getFuturesClosedPositions,
} from "@/lib/api/futures";
import type { FuturesPositionItem, FuturesOrderItem } from "@/types/futures";


type AssetTab = "trade" | "contest" | "mock";
type DetailTab = "holdings" | "pnl" | "orders" | "trades" | "open";

type MockHolding = {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  buyAmount: number;
  coinTotalValue: number;
  profit: number;
  roi: number;
  holdingRatio: number;
  isPriceStale: boolean;
};

type MockPortfolio = {
  assetType: string;
  holdingCount: number;
  seedMoney: number;
  cashBalance: number;
  totalBuyAmount: number;
  totalCoinValue: number;
  totalAsset: number;
  totalProfit: number;
  totalRoi: number;
  holdings: MockHolding[];
};

// Unified types for the table
type UnifiedOrderItem = {
  id: number;
  symbol: string;
  displayNameKr: string;
  side: string;
  orderType: string;
  orderStatus: string;
  orderPrice: number | null;
  orderQuantity: number | null;
  orderAmount: number | null;
  filledQuantity: number | null;
  avgFilledPrice: number | null;
  executedAmount: number | null;
  orderedAt: string;
};

type UnifiedTradeItem = {
  id: number;
  symbol: string;
  displayNameKr: string;
  side: string;
  price: number;
  quantity: number;
  totalAmount: number;
  fee: number;
  realizedProfit: number | null;
  executedAt: string;
};

type DetailTableCell = {
  value: ReactNode;
  className?: string;
};

type DetailTableData = {
  headers: string[];
  headerClasses: string[];
  rows: DetailTableCell[][];
  emptyText: string;
};

const ASSET_TAB_VALUES: AssetTab[] = ["trade", "contest", "mock"];
const DETAIL_TAB_VALUES: DetailTab[] = [
  "holdings",
  "pnl",
  "orders",
  "trades",
  "open",
];

const isAssetTab = (value: string | null): value is AssetTab => {
  return value !== null && ASSET_TAB_VALUES.includes(value as AssetTab);
};

const isDetailTab = (value: string | null): value is DetailTab => {
  return value !== null && DETAIL_TAB_VALUES.includes(value as DetailTab);
};

type TradeListFilters = {
  symbol: string;
  side: string;
  status: string;
  startDate: string;
  endDate: string;
  size: number;
};

const CHART_COLORS = [
  "#0058FF",
  "#9CB34E",
  "#1D7CA7",
  "#5F5592",
  "#B5679B",
  "#E97A31",
  "#00A6A6",
];

const DEFAULT_TRADE_LIST_FILTERS: TradeListFilters = {
  symbol: "",
  side: "",
  status: "",
  startDate: "",
  endDate: "",
  size: 10,
};

const OPEN_ORDER_PAGE_SIZE = 10;

const createDefaultOrderFilters = (): TradeListFilters => ({
  ...DEFAULT_TRADE_LIST_FILTERS,
});

const createDefaultTradeHistoryFilters = (): TradeListFilters => ({
  ...DEFAULT_TRADE_LIST_FILTERS,
  status: "COMPLETED",
});

const SIDE_OPTIONS = [
  { label: "구분", value: "" },
  { label: "매수/롱", value: "BUY" },
  { label: "매도/숏", value: "SELL" },
];

const ORDER_STATUS_OPTIONS = [
  { label: "상태", value: "" },
  { label: "대기중", value: "PENDING" },
  { label: "부분체결", value: "PARTIALLY_FILLED" },
  { label: "체결완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELED" },
];

const TRADE_STATUS_OPTIONS = [
  { label: "상태", value: "" },
  { label: "체결완료", value: "COMPLETED" },
];



const formatOrderStatus = (status?: string) => {
  if (status === "PENDING") return "대기중";
  if (status === "PARTIALLY_FILLED") return "부분체결";
  if (status === "COMPLETED") return "체결완료";
  if (status === "CANCELED") return "취소";
  return status || "-";
};

const formatOrderType = (orderType?: string) => {
  if (orderType === "MARKET") return "시장가";
  if (orderType === "LIMIT") return "지정가";
  return orderType || "-";
};

const getAssetCellValue = (
  displayNameKr: string | null | undefined,
  symbol: string | null | undefined,
  marketSymbols: MarketSymbolMeta[]
) => {
  const assetLabel = displayNameKr || getBaseAssetLabel(symbol, marketSymbols);

  return (
    <div className="flex flex-col">
      <span className="font-black text-gray-900 dark:text-gray-100">{assetLabel}</span>
      <span className="text-xs font-medium text-gray-400">
        {getDisplaySymbolLabel(symbol, marketSymbols)}
      </span>
    </div>
  );
};

const getMarketSearchMatches = (
  keyword: string,
  marketSymbols: MarketSymbolMeta[]
) => {
  const rawKeyword = keyword.trim();

  if (!rawKeyword) return [];

  const upperKeyword = rawKeyword.toUpperCase();
  const lowerKeyword = rawKeyword.toLowerCase();

  return marketSymbols
    .filter((market) => {
      return (
        market.displayNameKr.includes(rawKeyword) ||
        market.displayNameEn.toLowerCase().includes(lowerKeyword) ||
        market.baseAsset.toUpperCase().includes(upperKeyword) ||
        market.symbol.toUpperCase().includes(upperKeyword)
      );
    })
    .sort((a, b) => {
      const getRank = (market: MarketSymbolMeta) => {
        if (
          market.symbol.toUpperCase() === upperKeyword ||
          market.baseAsset.toUpperCase() === upperKeyword ||
          market.displayNameKr === rawKeyword ||
          market.displayNameEn.toLowerCase() === lowerKeyword
        ) {
          return 0;
        }

        if (
          market.baseAsset.toUpperCase().startsWith(upperKeyword) ||
          market.symbol.toUpperCase().startsWith(upperKeyword) ||
          market.displayNameKr.startsWith(rawKeyword)
        ) {
          return 1;
        }

        return 2;
      };

      return getRank(a) - getRank(b);
    })
    .slice(0, 8);
};

const isNoMockWalletMessage = (message: string | null | undefined) => {
  if (!message) return false;
  return (
    message.includes("현재 참여중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("현재 참여 중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("생성된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.")
  );
};

const isWalletNotCreatedOrInactive = (error: any) => {
  const message = error?.message;
  if (!message) return false;
  return (
    message.includes("본투자 지갑이 비활성화 상태입니다") ||
    message.includes("인증 및 모의투자 3회를 완료") ||
    message.includes("활성화해주세요") ||
    message.includes("현재 참여중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("현재 참여 중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("생성된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.") ||
    message.includes("참여 중인 대회가 존재하지 않습니다.") ||
    message.includes("지갑을 찾을 수 없습니다") ||
    message.includes("접근 권한이 없습니다.") ||
    message.includes("거래 가능한 대회 선물 지갑이 없습니다") ||
    message.includes("거래 가능한 대회 선물 지갑을 찾을 수 없습니다") ||
    message.includes("거래 가능한 본투자 선물 지갑이 없습니다")  // ← 선물 지갑 비활성/미활성화
  );
};

// Mappers for Unified types
const mapSpotOrderToUnified = (item: SpotOrderItem): UnifiedOrderItem => ({
  id: item.orderId,
  symbol: item.symbol,
  displayNameKr: item.displayNameKr,
  side: item.side,
  orderType: item.orderType,
  orderStatus: item.orderStatus,
  orderPrice: item.orderPrice,
  orderQuantity: item.orderQuantity,
  orderAmount: item.orderAmount,
  filledQuantity: item.filledQuantity,
  avgFilledPrice: item.avgFilledPrice,
  executedAmount: item.executedAmount,
  orderedAt: item.orderedAt,
});

const mapFuturesOrderToUnified = (item: FuturesOrderItem): UnifiedOrderItem => ({
  id: item.orderId,
  symbol: item.symbol,
  displayNameKr: item.displayNameKr || item.symbol,
  side: item.positionSide,
  orderType: item.orderType,
  orderStatus: item.orderStatus,
  orderPrice: item.orderPrice,
  orderQuantity: item.orderQuantity,
  orderAmount: item.notionalAmount,
  filledQuantity: item.filledQuantity,
  avgFilledPrice: item.executedPrice,
  executedAmount: item.notionalAmount,
  orderedAt: item.createdAt || "",
});

const mapSpotTradeToUnified = (item: SpotTradeItem): UnifiedTradeItem => ({
  id: item.tradeId,
  symbol: item.symbol,
  displayNameKr: item.displayNameKr,
  side: item.side,
  price: item.price,
  quantity: item.quantity,
  totalAmount: item.totalAmount,
  fee: item.fee,
  realizedProfit: item.realizedProfit,
  executedAt: item.executedAt || "",
});

const mapFuturesPositionToTradeUnified = (item: FuturesPositionItem): UnifiedTradeItem => ({
  id: item.positionId,
  symbol: item.symbol,
  displayNameKr: item.symbol,
  side: item.positionSide,
  price: item.exitPrice || item.entryPrice,
  quantity: item.filledQuantity,
  totalAmount: item.notionalAmount,
  fee: item.totalFee ?? 0,
  realizedProfit: item.realizedPnl,
  executedAt: item.closedAt || item.updatedAt || "",
});

function RealtimeAssetSummary({
  portfolio,
  title,
  className
}: {
  portfolio: MockPortfolio;
  title: string;
  className?: string;
}) {
  const tickers = useTickerStore((state) => state.tickers);

  let totalCoinValue = 0;
  let totalBuyAmount = 0;

  portfolio.holdings.forEach((holding) => {
    const realtimePrice = tickers[holding.symbol]?.price ?? holding.currentPrice;
    totalCoinValue += holding.quantity * realtimePrice;
    totalBuyAmount += holding.buyAmount;
  });

  const totalProfit = totalCoinValue - totalBuyAmount;
  const totalRoi = totalBuyAmount > 0 ? (totalProfit / totalBuyAmount) * 100 : 0;
  const totalAsset = portfolio.cashBalance + totalCoinValue;

  const summary: AssetSummary = {
    title,
    cashBalance: portfolio.cashBalance,
    totalAsset,
    totalBuyAmount,
    totalCoinValue,
    totalProfit,
    totalRoi,
  };

  return <AssetSummaryCard summary={summary} className={className} />;
}

const cell = (value: ReactNode, className = ""): DetailTableCell => ({
  value,
  className,
});

export default function AssetsPage() {
  return (
    <Suspense fallback={<EmptyState text="잠시만 기다려 주세요..." />}>
      <AssetsPageContent />
    </Suspense>
  );
}

function AssetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchAssetTab = searchParams.get("assetTab");
  const searchDetailTab = searchParams.get("detailTab");

  const [assetTab, setAssetTab] = useState<AssetTab>(
    isAssetTab(searchAssetTab) ? searchAssetTab : "trade"
  );
  const [detailTab, setDetailTab] = useState<DetailTab>(
    isDetailTab(searchDetailTab) ? searchDetailTab : "holdings"
  );
  const [tradingSubTab, setTradingSubTab] = useState<"spot" | "futures">("spot");

  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [mainErrorMessage, setMainErrorMessage] = useState("");

  const [mockPortfolio, setMockPortfolio] = useState<MockPortfolio | null>(null);
  const [openOrders, setOpenOrders] = useState<UnifiedOrderItem[]>([]);
  const [openOrdersNextCursorId, setOpenOrdersNextCursorId] = useState<number | null>(null);
  const [openOrdersHasNext, setOpenOrdersHasNext] = useState(false);

  const [orderHistories, setOrderHistories] = useState<UnifiedOrderItem[]>([]);
  const [tradeHistories, setTradeHistories] = useState<UnifiedTradeItem[]>([]);

  const [ordersNextCursorId, setOrdersNextCursorId] = useState<number | null>(null);
  const [tradesNextCursorId, setTradesNextCursorId] = useState<number | null>(null);
  const [ordersHasNext, setOrdersHasNext] = useState(false);
  const [tradesHasNext, setTradesHasNext] = useState(false);

  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [isFetchingMoreOpenOrders, setIsFetchingMoreOpenOrders] = useState(false);
  const [isFetchingMoreOrders, setIsFetchingMoreOrders] = useState(false);
  const [isFetchingMoreTrades, setIsFetchingMoreTrades] = useState(false);
  const [ordersErrorMessage, setOrdersErrorMessage] = useState("");
  const [tradesErrorMessage, setTradesErrorMessage] = useState("");

  const [realAsset, setRealAsset] = useState<RealAssetUnifiedResponse | null>(null);
  const [isLoadingReal, setIsLoadingReal] = useState(false);

  const [participatingContests, setParticipatingContests] = useState<ContestParticipationSeason[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [contestWallet, setContestWallet] = useState<FuturesWalletStatus | null>(null);
  const [contestPositions, setContestPositions] = useState<FuturesPositionItem[]>([]);
  const [contestResult, setContestResult] = useState<MyContestSeasonResult | null>(null);
  const [isLoadingContests, setIsLoadingContests] = useState(false);
  const [isLoadingContestData, setIsLoadingContestData] = useState(false);
  const [isLoadingContestResult, setIsLoadingContestResult] = useState(false);

  const isContestFinished = useMemo(() => {
    if (assetTab !== "contest" || !selectedContestId) return false;
    const selectedContest = participatingContests.find((c) => c.seasonId === selectedContestId);
    return selectedContest?.displayStatus === "FINISHED" || selectedContest?.displayStatus === "SETTLED";
  }, [assetTab, selectedContestId, participatingContests]);

  const marketSymbols = useMarketStore((state) => state.marketSymbols);
  const fetchMarketSymbols = useMarketStore((state) => state.fetchMarketSymbols);

  const [orderFilters, setOrderFilters] = useState<TradeListFilters>(createDefaultOrderFilters);
  const [tradeFilters, setTradeFilters] = useState<TradeListFilters>(createDefaultTradeHistoryFilters);

  const [orderSymbolInput, setOrderSymbolInput] = useState("");
  const [tradeSymbolInput, setTradeSymbolInput] = useState("");
  const [isSymbolInputFocused, setIsSymbolInputFocused] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useBinanceWebSocket();

  useEffect(() => {
    void fetchMarketSymbols();
  }, [fetchMarketSymbols]);

  // SSE Refresh Logic
  useEffect(() => {
    const tradeEvent = getNotificationSseBridgeEventName("NOTIFICATION_TRADE_ORDER_COMPLETED");
    const mockEvent = getNotificationSseBridgeEventName("NOTIFICATION_MOCK_ORDER_COMPLETED");
    const contestEvent = getNotificationSseBridgeEventName("NOTIFICATION_CONTEST_ORDER_COMPLETED");

    const contestEvents: ForwardedNotificationEventName[] = [
      "NOTIFICATION_CONTEST_APPLICATION_APPROVED",
      "NOTIFICATION_CONTEST_APPLICATION_REJECTED",
      "CONTEST_APPLICATION_APPROVED",
      "CONTEST_APPLICATION_REJECTED",
      "CONTEST_APPROVED",
      "CONTEST_REJECTED",
    ];

    const handleRefresh = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener(tradeEvent, handleRefresh);
    window.addEventListener(mockEvent, handleRefresh);
    window.addEventListener(contestEvent, handleRefresh);

    const contestEventListeners = contestEvents.map(evt => {
      const bridgeEvent = getNotificationSseBridgeEventName(evt);
      window.addEventListener(bridgeEvent, handleRefresh);
      return { bridgeEvent, handleRefresh };
    });

    return () => {
      window.removeEventListener(tradeEvent, handleRefresh);
      window.removeEventListener(mockEvent, handleRefresh);
      window.removeEventListener(contestEvent, handleRefresh);
      contestEventListeners.forEach(({ bridgeEvent, handleRefresh }) => {
        window.removeEventListener(bridgeEvent, handleRefresh);
      });
    };
  }, []);

  // Unified data loader for Main Portfolio Information
  useEffect(() => {
    let isActive = true;

    const loadPortfolioData = async () => {
      setIsLoadingMain(true);
      setMainErrorMessage("");

      try {
        if (assetTab === "trade") {
          const data = await getUnifiedRealAssetDetail();
          if (isActive) setRealAsset(data);
        } else if (assetTab === "mock") {
          const json = await fetchClient<any>("asset/mock/portfolio");
          if (isActive) {
            if (json) {
              setMockPortfolio(json.data || json);
            } else {
              setMockPortfolio(null);
              setMainErrorMessage("모의투자 정보를 불러오지 못했습니다.");
            }
          }
        } else if (assetTab === "contest") {
          const memberInfo = await fetchClient<any>("member/me/info");
          const memberId = memberInfo?.data?.memberId || memberInfo?.memberId;

          if (memberId) {
            const response = await getContestParticipationSeasonsByMember(memberId, { size: 50 });
            const seasons = response.content || [];
            if (isActive) {
              setParticipatingContests(seasons);
              if (seasons.length > 0 && !selectedContestId) {
                setSelectedContestId(seasons[0].seasonId);
              }
            }
          } else {
            const response = await getMyParticipatingContestSeasons({ size: 50 });
            const seasons = response.content || [];
            if (isActive) {
              setParticipatingContests(seasons);
              if (seasons.length > 0 && !selectedContestId) {
                setSelectedContestId(seasons[0].seasonId);
              }
            }
          }
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Wallet not created or inactive:", error.message);
          if (isActive) {
            if (assetTab === "trade") {
              setRealAsset(null);
            } else if (assetTab === "mock") {
              setMockPortfolio(null);
              setMainErrorMessage("모의투자 계좌를 생성하면 데이터가 표시됩니다.");
            }
          }
        } else {
          console.error("Failed to load portfolio:", error);
          if (isActive) {
            if (assetTab === "mock" && isNoMockWalletMessage(error.message)) {
              setMainErrorMessage("모의투자 계좌를 생성하면 데이터가 표시됩니다.");
            } else {
              setMainErrorMessage("정보를 불러오지 못했습니다. 다시 시도해 주세요.");
            }
          }
        }
      } finally {
        if (isActive) setIsLoadingMain(false);
      }
    };

    void loadPortfolioData();
    return () => { isActive = false; };
  }, [assetTab, refreshTrigger, selectedContestId]);

  // Load Contest Specific Data
  useEffect(() => {
    if (assetTab !== "contest" || !selectedContestId) return;
    if (participatingContests.length === 0) return;

    let isActive = true;
    const loadContestData = async () => {
      setIsLoadingContestData(true);
      try {
        const selectedContest = participatingContests.find(c => c.seasonId === selectedContestId);
        const isFinished = selectedContest?.displayStatus === "FINISHED" || selectedContest?.displayStatus === "SETTLED";

        let wallet;
        let positionsContent: FuturesPositionItem[] = [];

        if (isFinished) {
          wallet = await getFinishedContestWalletStatus(selectedContestId);
        } else {
          const [w, pos] = await Promise.all([
            getFuturesWalletStatus(selectedContestId),
            getContestFuturesOpenPositions(selectedContestId, { size: 50 })
          ]);
          wallet = w;
          positionsContent = pos.content || [];
        }

        if (isActive) {
          setContestWallet(wallet);
          setContestPositions(positionsContent);
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Contest wallet is not created or inactive:", error.message);
          if (isActive) {
            setContestWallet(null);
            setContestPositions([]);
          }
        } else {
          console.error("Failed to load contest data:", error);
        }
      } finally {
        if (isActive) setIsLoadingContestData(false);
      }
    };

    void loadContestData();
    return () => { isActive = false; };
  }, [assetTab, selectedContestId, refreshTrigger, participatingContests]);

  // Load Contest Result for Assets Page
  useEffect(() => {
    if (assetTab !== "contest" || !selectedContestId) {
      setContestResult(null);
      return;
    }

    let isActive = true;
    const loadContestResult = async () => {
      setIsLoadingContestResult(true);
      try {
        const result = await getMyContestSeasonResult(selectedContestId);
        if (isActive) {
          setContestResult(result);
        }
      } catch (error: any) {
        console.warn("Failed to load contest result on assets page:", error?.message || error);
        if (isActive) {
          setContestResult(null);
        }
      } finally {
        if (isActive) {
          setIsLoadingContestResult(false);
        }
      }
    };

    void loadContestResult();
    return () => {
      isActive = false;
    };
  }, [assetTab, selectedContestId]);

  // Load Open Orders (Holdings/Positions or Pending)
  useEffect(() => {
    let isActive = true;

    const loadOpenOrders = async () => {

      try {
        let items: UnifiedOrderItem[] = [];
        let nextCursor: number | null = null;
        let hasNext = false;

        if (assetTab === "contest" && selectedContestId) {
          const selectedContest = participatingContests.find(c => c.seasonId === selectedContestId);
          const isFinished = selectedContest?.displayStatus === "FINISHED" || selectedContest?.displayStatus === "SETTLED";
          if (isFinished) {
            items = [];
          } else {
            const response = await getContestFuturesOrders(selectedContestId, { orderStatus: "PENDING", size: OPEN_ORDER_PAGE_SIZE });
            items = response.content.map(mapFuturesOrderToUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          }
        } else if (assetTab === "trade") {
          if (tradingSubTab === "spot") {
            const response = await fetchOpenOrders({ assetType: "TRADE_SPOT", size: OPEN_ORDER_PAGE_SIZE });
            items = response.map(mapSpotOrderToUnified);
          } else {
            const response = await getFuturesOrders({ orderStatus: "PENDING", size: OPEN_ORDER_PAGE_SIZE });
            items = response.content.map(mapFuturesOrderToUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          }
        } else if (assetTab === "mock") {
          const response = await fetchOpenOrders({ assetType: "MOCK", size: OPEN_ORDER_PAGE_SIZE });
          items = response.map(mapSpotOrderToUnified);
        }

        if (isActive) {
          setOpenOrders(items);
          setOpenOrdersNextCursorId(nextCursor);
          setOpenOrdersHasNext(hasNext);
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Open orders load skipped: wallet inactive/not created.");
          if (isActive) {
            setOpenOrders([]);
          }
        } else {
          console.error("Failed to load open orders:", error);
        }
      }
    };

    void loadOpenOrders();
    return () => { isActive = false; };
  }, [assetTab, tradingSubTab, selectedContestId, refreshTrigger, participatingContests]);

  // Load Order History
  useEffect(() => {
    if (detailTab !== "orders") return;

    let isActive = true;
    const loadOrders = async () => {
      setIsLoadingOrders(true);
      setOrdersErrorMessage("");
      try {
        let items: UnifiedOrderItem[] = [];
        let nextCursor: number | null = null;
        let hasNext = false;

        if (assetTab === "contest" && selectedContestId) {
          // 종료된 대회는 백엔드가 ACTIVE 지갑만 조회 가능하여 주문내역을 제공하지 않습니다.
          if (!isContestFinished) {
            const response = await getContestFuturesOrders(selectedContestId, {
              symbol: orderFilters.symbol,
              size: orderFilters.size
            });
            items = response.content.map(mapFuturesOrderToUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          }
        } else if (assetTab === "trade") {
          if (tradingSubTab === "spot") {
            const response = await fetchOrders({
              assetType: "TRADE_SPOT",
              symbol: orderFilters.symbol,
              side: orderFilters.side as any,
              status: orderFilters.status as any,
              startDate: orderFilters.startDate,
              endDate: orderFilters.endDate,
              size: orderFilters.size
            });
            items = response.content.map(mapSpotOrderToUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          } else {
            const response = await getFuturesOrders({
              symbol: orderFilters.symbol,
              size: orderFilters.size
            });
            items = response.content.map(mapFuturesOrderToUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          }
        } else if (assetTab === "mock") {
          const response = await fetchOrders({
            assetType: "MOCK",
            symbol: orderFilters.symbol,
            size: orderFilters.size
          });
          items = response.content.map(mapSpotOrderToUnified);
          nextCursor = response.nextCursorId;
          hasNext = response.hasNext;
        }

        if (isActive) {
          setOrderHistories(items);
          setOrdersNextCursorId(nextCursor);
          setOrdersHasNext(hasNext);
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Orders load skipped: wallet inactive/not created.");
          if (isActive) {
            setOrderHistories([]);
            setOrdersErrorMessage(""); // Leave empty to naturally fall back to default empty message
          }
        } else {
          console.error("Failed to load orders:", error);
          if (isActive) setOrdersErrorMessage(error.message || "주문내역을 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoadingOrders(false);
      }
    };

    void loadOrders();
    return () => { isActive = false; };
  }, [assetTab, tradingSubTab, detailTab, selectedContestId, orderFilters, refreshTrigger]);

  // Load Trade History
  useEffect(() => {
    if (detailTab !== "trades") return;

    let isActive = true;
    const loadTrades = async () => {
      setIsLoadingTrades(true);
      setTradesErrorMessage("");
      try {
        let items: UnifiedTradeItem[] = [];
        let nextCursor: number | null = null;
        let hasNext = false;

        if (assetTab === "contest" && selectedContestId) {
          // 종료된 대회는 백엔드가 ACTIVE 지갑만 조회 가능하여 거래내역을 제공하지 않습니다.
          if (isContestFinished) {
            if (isActive) {
              setTradeHistories([]);
            }
          } else {
            const response = await getContestFuturesClosedPositions(selectedContestId, {
              symbol: tradeFilters.symbol,
              size: tradeFilters.size
            });
            items = (response.content || []).map(mapFuturesPositionToTradeUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          }
        } else if (assetTab === "trade") {
          if (tradingSubTab === "spot") {
            const response = await fetchTradeHistories({
              assetType: "TRADE_SPOT",
              symbol: tradeFilters.symbol,
              size: tradeFilters.size
            });
            // fetchTradeHistories standard response has .content
            items = (response.content || []).map(mapSpotTradeToUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          } else {
            const response = await getFuturesClosedPositions({
              symbol: tradeFilters.symbol,
              size: tradeFilters.size
            });
            items = (response.content || []).map(mapFuturesPositionToTradeUnified);
            nextCursor = response.nextCursorId;
            hasNext = response.hasNext;
          }
        } else if (assetTab === "mock") {
          const response = await fetchTradeHistories({
            assetType: "MOCK",
            symbol: tradeFilters.symbol,
            size: tradeFilters.size
          });
          items = (response.content || []).map(mapSpotTradeToUnified);
          nextCursor = response.nextCursorId;
          hasNext = response.hasNext;
        }

        if (isActive) {
          setTradeHistories(items);
          setTradesNextCursorId(nextCursor);
          setTradesHasNext(hasNext);
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Trades load skipped: wallet inactive/not created.");
          if (isActive) {
            setTradeHistories([]);
            setTradesErrorMessage(""); 
          }
        } else {
          console.error("Failed to load trades:", error);
          if (isActive) setTradesErrorMessage(error.message || "거래내역을 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setIsLoadingTrades(false);
      }
    };

    void loadTrades();
    return () => { isActive = false; };
  }, [assetTab, tradingSubTab, detailTab, selectedContestId, tradeFilters, refreshTrigger]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!loadMoreRef.current || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Infinite scroll logic can be added here if needed for more than initial pages
        }
      },
      { root: scrollContainerRef.current }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [detailTab]);


  const handleAssetTabChange = (value: AssetTab) => {
    setAssetTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("assetTab", value);
    router.replace(`/assets?${params.toString()}`, { scroll: false });
  };

  const handleDetailTabChange = (value: DetailTab) => {
    setDetailTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("detailTab", value);
    router.replace(`/assets?${params.toString()}`, { scroll: false });
  };

  const pieData = useMemo(() => {
    if (assetTab === "mock") {
      if (!mockPortfolio) return [];
      const totalAsset = mockPortfolio.totalAsset;
      const holdingsData = mockPortfolio.holdings
        .filter((item) => item.quantity > 0)
        .map((item, index) => ({
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: totalAsset > 0 ? (item.quantity * item.currentPrice / totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        }));
      const cashRatio = totalAsset > 0 ? (mockPortfolio.cashBalance / totalAsset) * 100 : 0;
      if (cashRatio > 0) {
        holdingsData.unshift({
          name: "현금",
          value: cashRatio,
          color: CHART_COLORS[0],
        });
      }
      return holdingsData.filter((item) => item.value > 0);
    }

    if (assetTab === "trade") {
      if (!realAsset) return [];
      const portfolio = tradingSubTab === "spot" ? realAsset.spot : null;
      if (!portfolio) {
        // If futures subtab, show margin usage
        return [
          { name: "사용 중인 증거금", value: realAsset.futures.totalAsset > 0 ? (realAsset.futures.totalMargin / realAsset.futures.totalAsset) * 100 : 0, color: "#0058FF" },
          { name: "사용 가능 잔고", value: realAsset.futures.totalAsset > 0 ? (realAsset.futures.cashBalance / realAsset.futures.totalAsset) * 100 : 0, color: "#E0E7FF" },
        ].filter(i => i.value > 0);
      }

      const totalAsset = portfolio.totalAsset;
      const holdingsData = portfolio.holdings
        .filter((item) => item.quantity > 0)
        .map((item, index) => ({
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: totalAsset > 0 ? (item.coinTotalValue / totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        }));
      const cashRatio = totalAsset > 0 ? (portfolio.cashBalance / totalAsset) * 100 : 0;
      if (cashRatio > 0) {
        holdingsData.unshift({
          name: "현금",
          value: cashRatio,
          color: CHART_COLORS[0],
        });
      }
      return holdingsData.filter((item) => item.value > 0);
    }

    if (assetTab === "contest") {
      if (!contestWallet) return [];
      const totalAsset = contestWallet.currentMoney;
      return [
        { name: "대회 증거금", value: totalAsset > 0 ? (contestWallet.marginInUse / totalAsset) * 100 : 0, color: "#1D7CA7" },
        { name: "사용 가능 잔고", value: totalAsset > 0 ? ((totalAsset - contestWallet.marginInUse) / totalAsset) * 100 : 0, color: "#F0F9FF" },
      ].filter(item => item.value > 0);
    }

    return [];
  }, [assetTab, marketSymbols, mockPortfolio, realAsset, tradingSubTab, contestWallet]);

  const contestLongShortData = useMemo(() => {
    if (assetTab !== "contest" || contestPositions.length === 0) return { long: 0, short: 0 };
    let longMargin = 0;
    let shortMargin = 0;
    contestPositions.forEach(pos => {
      if (pos.positionSide === "LONG") longMargin += pos.totalMargin;
      else shortMargin += pos.totalMargin;
    });
    const total = longMargin + shortMargin;
    if (total === 0) return { long: 0, short: 0 };
    return { long: (longMargin / total) * 100, short: (shortMargin / total) * 100 };
  }, [assetTab, contestPositions]);

  const defaultQuoteAssetLabel = getDefaultQuoteAssetLabel(marketSymbols);
  const withQuoteAssetHeader = useCallback(
    (label: string) => defaultQuoteAssetLabel ? `${label}(${defaultQuoteAssetLabel})` : label,
    [defaultQuoteAssetLabel]
  );

  const detailTable = useMemo<DetailTableData>(() => {
    const isFutures = assetTab === "contest" || (assetTab === "trade" && tradingSubTab === "futures");

    if (detailTab === "holdings") {
      if (isFutures) {
        const positions = assetTab === "contest" ? contestPositions : (realAsset?.futures?.positions ?? []);
        return {
          headers: ["포지션", "방향", "레버리지", "진입가", "현재가", "증거금", "미실현손익", "수익률"],
          headerClasses: ["text-left", "text-center", "text-center", "text-right", "text-right", "text-right", "text-right", "text-right"],
          rows: positions.map((pos: any) => [
            cell(getAssetCellValue(null, pos.symbol, marketSymbols), "text-left"),
            cell(pos.positionSide === "LONG" ? "롱" : "숏", `text-center font-bold ${pos.positionSide === "LONG" ? "text-red-500" : "text-blue-500"}`),
            cell(`${pos.leverage}x`, "text-center font-bold text-gray-600"),
            cell(formatNumber(pos.entryPrice), "text-right tabular-nums"),
            cell(<TickerCell symbol={pos.symbol} fallbackPrice={pos.currentPrice || pos.entryPrice} type="price" />, "text-right tabular-nums font-bold"),
            cell(formatNumber(pos.totalMargin), "text-right tabular-nums font-black"),
            cell(<TickerCell symbol={pos.symbol} fallbackPrice={pos.currentPrice || pos.entryPrice} quantity={pos.filledQuantity} buyAmount={pos.totalMargin} type="profit" />, "text-right tabular-nums font-bold"),
            cell(<TickerCell symbol={pos.symbol} fallbackPrice={pos.currentPrice || pos.entryPrice} quantity={pos.filledQuantity} buyAmount={pos.totalMargin} type="roi" />, "text-right tabular-nums font-bold"),
          ]),
          emptyText: isContestFinished ? "종료된 대회는 포지션 현황이 제공되지 않습니다." : "보유 중인 포지션이 없습니다.",
        };
      }

      const holdings = assetTab === "mock" ? (mockPortfolio?.holdings ?? []) : (realAsset?.spot?.holdings ?? []);
      return {
        headers: ["자산", "보유수량", withQuoteAssetHeader("평균매수가"), withQuoteAssetHeader("현재가"), withQuoteAssetHeader("평가금액"), withQuoteAssetHeader("평가손익"), "수익률"],
        headerClasses: ["text-left", "text-right", "text-right", "text-right", "text-right", "text-right", "text-right"],
        rows: holdings.map((item) => [
          cell(getAssetCellValue(getBaseAssetLabel(item.symbol, marketSymbols), item.symbol, marketSymbols), "text-left"),
          cell(formatNumber(item.quantity), "text-right tabular-nums text-gray-600"),
          cell(formatNumber(item.averageBuyPrice), "text-right tabular-nums"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} type="price" />, "text-right tabular-nums font-bold"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} type="value" />, "text-right tabular-nums font-black"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="profit" />, "text-right tabular-nums font-bold"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="roi" />, "text-right tabular-nums font-bold"),
        ]),
        emptyText: "보유 중인 자산이 없습니다.",
      };
    }

    if (detailTab === "pnl") {
      if (isFutures) {
        if (assetTab === "contest" && isContestFinished) {
          const displayRealizedPnl = contestResult?.finalRealizedPnl !== undefined
            ? contestResult.finalRealizedPnl
            : (contestWallet ? (contestWallet.currentMoney - contestWallet.seedMoney) : 0);
          const displayProfitRate = (contestResult?.finalProfitRate !== undefined && contestResult.finalProfitRate !== 0)
            ? contestResult.finalProfitRate
            : (contestWallet && contestWallet.seedMoney > 0 ? ((displayRealizedPnl / contestWallet.seedMoney) * 100) : 0);

          return {
            headers: ["대회명", "최종순위", "종료시점 잔고", "실현손익", "수익률", "정산일시"],
            headerClasses: ["text-left", "text-center", "text-right", "text-right", "text-right", "text-center"],
            rows: contestResult ? [[
              cell(contestResult.seasonTitle, "text-left font-bold"),
              cell(contestResult.finalRank > 0 ? `${contestResult.finalRank}위` : "집계중", "text-center font-black text-blue-600"),
              cell(formatNumber(contestWallet?.currentMoney || 0), "text-right tabular-nums"),
              cell(formatSignedNumber(displayRealizedPnl), `text-right tabular-nums font-bold ${getProfitColorClass(displayRealizedPnl)}`),
              cell(formatSignedPercent(displayProfitRate), `text-right tabular-nums font-bold ${getProfitColorClass(displayProfitRate)}`),
              cell(formatDateTime(contestResult.settledAt), "text-center text-gray-400 text-xs"),
            ]] : [],
            emptyText: "정산 결과 정보를 불러올 수 없습니다.",
          };
        }

        const positions = assetTab === "contest" ? contestPositions : (realAsset?.futures?.positions ?? []);
        return {
          headers: ["자산", "구분", "레버리지", "증거금", "미실현손익", "실현손익", "수익률"],
          headerClasses: ["text-left", "text-center", "text-center", "text-right", "text-right", "text-right", "text-right"],
          rows: positions.map((pos: any) => [
            cell(getAssetCellValue(null, pos.symbol, marketSymbols), "text-left"),
            cell(pos.positionSide === "LONG" ? "롱" : "숏", `text-center font-bold ${pos.positionSide === "LONG" ? "text-red-500" : "text-blue-500"}`),
            cell(`${pos.leverage}x`, "text-center font-bold text-gray-600"),
            cell(formatNumber(pos.totalMargin), "text-right tabular-nums"),
            cell(<TickerCell symbol={pos.symbol} fallbackPrice={pos.currentPrice || pos.entryPrice} quantity={pos.filledQuantity} buyAmount={pos.totalMargin} type="profit" />, "text-right tabular-nums font-bold"),
            cell(formatSignedNumber(pos.realizedPnl ?? 0), `text-right tabular-nums font-bold ${getProfitColorClass(pos.realizedPnl)}`),
            cell(<TickerCell symbol={pos.symbol} fallbackPrice={pos.currentPrice || pos.entryPrice} quantity={pos.filledQuantity} buyAmount={pos.totalMargin} type="roi" />, "text-right tabular-nums font-bold"),
          ]),
          emptyText: "손익을 표시할 포지션이 없습니다.",
        };
      }

      const holdings = assetTab === "mock" ? (mockPortfolio?.holdings ?? []) : (realAsset?.spot?.holdings ?? []);
      return {
        headers: ["자산", withQuoteAssetHeader("총매수"), withQuoteAssetHeader("총평가"), withQuoteAssetHeader("평가손익"), "수익률", "비중"],
        headerClasses: ["text-left", "text-right", "text-right", "text-right", "text-right", "text-right"],
        rows: holdings.map((item) => [
          cell(getAssetCellValue(getBaseAssetLabel(item.symbol, marketSymbols), item.symbol, marketSymbols), "text-left"),
          cell(formatNumber(item.buyAmount), "text-right tabular-nums"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} type="value" />, "text-right tabular-nums font-black"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="profit" />, "text-right tabular-nums font-bold"),
          cell(<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="roi" />, "text-right tabular-nums font-bold"),
          cell(formatNumber(item.holdingRatio) + "%", "text-right tabular-nums text-gray-500"),
        ]),
        emptyText: "손익현황을 표시할 자산이 없습니다.",
      };
    }

    if (detailTab === "orders") {
      return {
        headers: ["주문일시", "자산", "구분", "주문유형", withQuoteAssetHeader("주문가격"), "주문수량", withQuoteAssetHeader("주문금액"), "상태"],
        headerClasses: ["text-left", "text-left", "text-center", "text-center", "text-right", "text-right", "text-right", "text-center"],
        rows: orderHistories.map((item) => [
          cell(formatDateTime(item.orderedAt), "text-left text-gray-500 tabular-nums"),
          cell(getAssetCellValue(item.displayNameKr, item.symbol, marketSymbols), "text-left"),
          cell(
            isFutures ? (item.side === "BUY" || item.side === "LONG" ? "롱" : "숏") : (item.side === "BUY" ? "매수" : "매도"),
            `text-center font-bold ${getSideColorClass(item.side as any)}`
          ),
          cell(formatOrderType(item.orderType), "text-center text-gray-600"),
          cell(formatNumber(item.orderPrice), "text-right tabular-nums"),
          cell(formatNumber(item.orderQuantity), "text-right tabular-nums"),
          cell(formatNumber(item.orderAmount), "text-right tabular-nums font-black"),
          cell(formatOrderStatus(item.orderStatus), "text-center font-bold"),
        ]),
        emptyText: isContestFinished ? "종료된 대회는 주문 내역 조회가 제한될 수 있습니다." : (ordersErrorMessage || "주문내역이 없습니다."),
      };
    }

    if (detailTab === "trades") {
      return {
        headers: ["체결일시", "자산", "구분", withQuoteAssetHeader("체결가"), "체결수량", withQuoteAssetHeader("총금액"), withQuoteAssetHeader("수수료"), withQuoteAssetHeader("실현손익")],
        headerClasses: ["text-left", "text-left", "text-center", "text-right", "text-right", "text-right", "text-right", "text-right"],
        rows: tradeHistories.map((item) => [
          cell(formatDateTime(item.executedAt), "text-left text-gray-500 tabular-nums"),
          cell(getAssetCellValue(item.displayNameKr, item.symbol, marketSymbols), "text-left"),
          cell(
            isFutures ? (item.side === "BUY" || item.side === "LONG" ? "롱" : "숏") : (item.side === "BUY" ? "매수" : "매도"),
            `text-center font-bold ${getSideColorClass(item.side as any)}`
          ),
          cell(formatNumber(item.price), "text-right tabular-nums"),
          cell(formatNumber(item.quantity), "text-right tabular-nums"),
          cell(formatNumber(item.totalAmount), "text-right tabular-nums font-black"),
          cell(formatNumber(item.fee), "text-right tabular-nums text-gray-400"),
          cell(formatSignedNumber(item.realizedProfit ?? 0), `text-right tabular-nums font-bold ${getProfitColorClass(item.realizedProfit)}`),
        ]),
        emptyText: isContestFinished ? "종료된 대회는 거래 내역 조회가 제한될 수 있습니다." : (tradesErrorMessage || "거래내역이 없습니다."),
      };
    }

    return {
      headers: ["주문일시", "자산", "구분", withQuoteAssetHeader("주문가격"), "주문수량", "미체결수량", withQuoteAssetHeader("주문금액"), "상태"],
      headerClasses: ["text-left", "text-left", "text-center", "text-right", "text-right", "text-right", "text-right", "text-center"],
      rows: openOrders.map((item) => [
        cell(formatDateTime(item.orderedAt), "text-left text-gray-500 tabular-nums"),
        cell(getAssetCellValue(item.displayNameKr, item.symbol, marketSymbols), "text-left"),
        cell(
          isFutures ? (item.side === "BUY" || item.side === "LONG" ? "롱" : "숏") : (item.side === "BUY" ? "매수" : "매도"),
          `text-center font-bold ${getSideColorClass(item.side as any)}`
        ),
        cell(formatNumber(item.orderPrice), "text-right tabular-nums"),
        cell(formatNumber(item.orderQuantity), "text-right tabular-nums"),
        cell(formatNumber((item.orderQuantity ?? 0) - (item.filledQuantity || 0)), "text-right tabular-nums text-blue-500 font-bold"),
        cell(formatNumber(item.orderAmount), "text-right tabular-nums font-black"),
        cell(formatOrderStatus(item.orderStatus), "text-center font-bold"),
      ]),
      emptyText: "미체결내역이 없습니다.",
    };
  }, [
    assetTab,
    tradingSubTab,
    detailTab,
    mockPortfolio,
    realAsset,
    contestPositions,
    orderHistories,
    tradeHistories,
    openOrders,
    ordersErrorMessage,
    tradesErrorMessage,
    marketSymbols,
    withQuoteAssetHeader,
  ]);

  const updateCurrentFilters = (key: keyof TradeListFilters, value: string | number) => {
    const nextValue = key === "size" ? Number(value) : String(value);
    if (detailTab === "orders") setOrderFilters(prev => ({ ...prev, [key]: nextValue }));
    else if (detailTab === "trades") setTradeFilters(prev => ({ ...prev, [key]: nextValue }));
  };

  const resetCurrentFilters = () => {
    if (detailTab === "orders") { setOrderSymbolInput(""); setOrderFilters(createDefaultOrderFilters()); }
    else if (detailTab === "trades") { setTradeSymbolInput(""); setTradeFilters(createDefaultTradeHistoryFilters()); }
  };

  const handleSelectSymbolSuggestion = (symbol: string) => {
    if (detailTab === "orders") setOrderSymbolInput(symbol);
    else setTradeSymbolInput(symbol);
    updateCurrentFilters("symbol", symbol);
    setIsSymbolInputFocused(false);
  };

  return (
    <main className="w-full space-y-6 animate-in fade-in duration-500">
      <Tabs
        tabs={[
          { label: "모의투자", value: "mock" },
          { label: "트레이딩", value: "trade" },
          { label: "대회", value: "contest" },
        ]}
        activeTab={assetTab}
        onChange={(value) => handleAssetTabChange(value as AssetTab)}
      />

      {assetTab === "trade" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AssetSummaryCard
            summary={{
              title: "총 자산",
              cashBalance: (realAsset?.spot?.cashBalance ?? 0) + (realAsset?.futures?.cashBalance ?? 0),
              totalAsset: realAsset?.totalAsset ?? 0,
              totalBuyAmount: (realAsset?.spot?.totalBuyAmount ?? 0) + (realAsset?.futures?.totalMargin ?? 0),
              totalCoinValue: (realAsset?.spot?.totalCoinValue ?? 0) + (realAsset?.futures?.totalMargin ?? 0) + (realAsset?.futures?.totalUnrealizedPnl ?? 0),
              totalProfit: realAsset?.totalProfit ?? 0,
              totalRoi: 0,
            }}
          />
          <AssetSummaryCard
            summary={{
              title: "현물 자산",
              cashBalance: realAsset?.spot?.cashBalance ?? 0,
              totalAsset: realAsset?.spot?.totalAsset ?? 0,
              totalBuyAmount: realAsset?.spot?.totalBuyAmount ?? 0,
              totalCoinValue: realAsset?.spot?.totalCoinValue ?? 0,
              totalProfit: realAsset?.spot?.totalProfit ?? 0,
              totalRoi: realAsset?.spot?.totalRoi ?? 0,
            }}
          />
          <AssetSummaryCard
            summary={{
              title: "선물 자산",
              cashBalance: realAsset?.futures?.cashBalance ?? 0,
              totalAsset: realAsset?.futures?.totalAsset ?? 0,
              totalBuyAmount: realAsset?.futures?.totalMargin ?? 0,
              totalCoinValue: (realAsset?.futures?.totalMargin ?? 0) + (realAsset?.futures?.totalUnrealizedPnl ?? 0),
              totalProfit: realAsset?.futures?.totalUnrealizedPnl ?? 0,
              totalRoi: 0,
            }}
          />
        </div>
      )}

      {assetTab === "contest" && (
        <div className="flex items-center gap-4 mb-6">
          <div className="w-64">
            <Select
              options={participatingContests.map((c) => {
                const isFinished = c.displayStatus === "FINISHED" || c.displayStatus === "SETTLED";
                return {
                  label: (
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-bold text-gray-900 dark:text-gray-100 truncate">{c.seasonTitle}</span>
                      {isFinished ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-gray-50 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                          종료
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/30 text-[#0058FF] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                          진행중
                        </span>
                      )}
                    </div>
                  ),
                  value: String(c.seasonId),
                };
              })}
              value={String(selectedContestId || "")}
              onChange={(val) => setSelectedContestId(Number(val))}
              placeholder="대회 선택"
            />
          </div>
        </div>
      )}

      {isContestFinished ? (
        <div className="max-w-4xl mx-auto mb-16 w-full px-4">
          {isLoadingContestResult && isLoadingContestData ? (
            <div className="py-12 text-center text-gray-400 font-bold">결과 정보를 불러오는 중...</div>
          ) : (
            (() => {
              const selectedContest = participatingContests.find(c => c.seasonId === selectedContestId);
              const displayTitle = contestResult?.seasonTitle || selectedContest?.seasonTitle || "대회";
              const displayRank = contestResult?.finalRank !== undefined && contestResult.finalRank > 0 
                ? `${contestResult.finalRank}위` 
                : "집계중";
              const displayRealizedPnl = contestResult?.finalRealizedPnl !== undefined
                ? contestResult.finalRealizedPnl
                : (contestWallet ? (contestWallet.currentMoney - contestWallet.seedMoney) : 0);
              const displayProfitRate = (contestResult?.finalProfitRate !== undefined && contestResult.finalProfitRate !== 0)
                ? contestResult.finalProfitRate
                : (contestWallet && contestWallet.seedMoney > 0 ? ((displayRealizedPnl / contestWallet.seedMoney) * 100) : 0);

              return (
                <div className="card p-8 bg-blue-50/30 border-blue-100 dark:border-blue-900/50 mb-10">
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-black">
                      {displayRank}
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-black text-gray-900 dark:text-gray-100">{displayTitle}</h4>
                      <p className="text-sm font-bold text-gray-500 mt-1">최종 순위: {displayRank}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">실현 손익</p>
                        <p className={cn("text-lg font-black", getProfitColorClass(displayRealizedPnl))}>
                          {formatSignedNumber(displayRealizedPnl)} USDT
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">수익률</p>
                        <p className={cn("text-lg font-black", getProfitColorClass(displayProfitRate))}>
                          {formatSignedPercent(displayProfitRate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-16">
            {assetTab !== "trade" && (
              <div className="lg:col-span-4">
                {assetTab === "mock" ? (
                  mockPortfolio ? (
                    <RealtimeAssetSummary portfolio={mockPortfolio} title="모의투자 자산" />
                  ) : (
                    <AssetSummaryCard
                      summary={{
                        title: "모의투자 자산",
                        cashBalance: 0,
                        totalAsset: 0,
                        totalBuyAmount: 0,
                        totalCoinValue: 0,
                        totalProfit: 0,
                        totalRoi: 0,
                      }}
                    />
                  )
                ) : (
                  <AssetSummaryCard
                    summary={{
                      title: "대회 자산",
                      cashBalance: (contestWallet?.currentMoney ?? 0) - (contestWallet?.marginInUse ?? 0),
                      totalAsset: contestWallet?.currentMoney ?? 0,
                      totalBuyAmount: contestWallet?.seedMoney ?? 0,
                      totalCoinValue: contestWallet?.currentMoney ?? 0,
                      totalProfit: (contestWallet?.currentMoney ?? 0) - (contestWallet?.seedMoney ?? 0),
                      totalRoi: contestWallet?.seedMoney ? (((contestWallet.currentMoney - contestWallet.seedMoney) / contestWallet.seedMoney) * 100) : 0,
                    }}
                  />
                )}
              </div>
            )}

            <section className={cn(
              "rounded-3xl bg-white dark:bg-gray-800 p-8 border border-gray-100 dark:border-gray-700 flex flex-col justify-center ",
              assetTab === "trade" ? "lg:col-span-12" : "lg:col-span-8"
            )}>
              {isLoadingMain || isLoadingContestData ? (
                <EmptyState text="데이터를 불러오는 중입니다..." />
              ) : assetTab === "contest" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-tight">대회 증거금 비중</h4>
                    <div className="flex-1 relative min-h-[180px]">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {pieData.map((entry, i) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(val) => [`${Number(val).toFixed(1)}%`, "비중"]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xxs font-bold text-gray-400">증거금</span>
                        <span className="text-sm font-black text-[#1D7CA7]">
                          {pieData.find(d => d.name === "대회 증거금")?.value.toFixed(1) || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center border-l border-gray-50 dark:border-gray-700 pl-8">
                    <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 mb-6 uppercase tracking-tight">대회 포지션 비율</h4>
                    <div className="flex justify-between text-[11px] font-black mb-2">
                      <span className="text-red-500">LONG {contestLongShortData.long.toFixed(1)}%</span>
                      <span className="text-blue-500">SHORT {contestLongShortData.short.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 w-full bg-gray-50 dark:bg-gray-700 rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${contestLongShortData.long}%` }} />
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${contestLongShortData.short}%` }} />
                    </div>
                    <p className="mt-6 text-[11px] text-gray-400 font-medium leading-relaxed">
                      선택한 대회에서 보유 중인 포지션의 증거금 합계를 기준으로 계산된 비중입니다.
                    </p>
                  </div>
                </div>
              ) : pieData.length === 0 ? (
                <EmptyState text="비중을 표시할 자산이 없습니다." />
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-10 h-full">
                  <div className="h-[220px] w-full md:w-1/2 relative">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                          animationDuration={400}
                        >
                          {pieData.map((entry, i) => <Cell key={entry.name} fill={entry.color || CHART_COLORS[i]} />)}
                          <Label value="보유 비중(%)" position="center" fill="#9ca3af" style={{ fontSize: "14px", fontWeight: "bold" }} />
                        </Pie>
                        <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "비중"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full md:w-1/2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-sm font-black text-gray-900 dark:text-white">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div id="asset-detail-tabs">
            {assetTab === "trade" && (
              <div className="mb-6 flex gap-4">
                <button
                  onClick={() => setTradingSubTab("spot")}
                  className={cn(
                    "px-8 py-3 rounded-2xl text-sm font-black transition-all duration-300",
                    tradingSubTab === "spot"
                      ? "bg-[#0058FF] text-white"
                      : "bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
                  )}
                >
                  현물 자산/거래
                </button>
                <button
                  onClick={() => setTradingSubTab("futures")}
                  className={cn(
                    "px-8 py-3 rounded-2xl text-sm font-black transition-all duration-300",
                    tradingSubTab === "futures"
                      ? "bg-[#0058FF] text-white"
                      : "bg-white dark:bg-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700"
                  )}
                >
                  선물 자산/거래
                </button>
              </div>
            )}

            <FolderTabs
              tabs={[
                { id: "holdings", label: assetTab === "contest" || (assetTab === "trade" && tradingSubTab === "futures") ? "포지션 현황" : "보유자산", content: null },
                { id: "pnl", label: "손익현황", content: null },
                { id: "orders", label: "주문내역", content: null },
                { id: "trades", label: "거래내역", content: null },
                { id: "open", label: "미체결내역", content: null },
              ].filter(tab => {
                // 트레이딩 선물거래탭 및 대회 탭에서 손익현황(pnl), 거래내역(trades) 숨김
                const isFuturesOrContest = assetTab === "contest" || (assetTab === "trade" && tradingSubTab === "futures");
                if (isFuturesOrContest && (tab.id === "pnl" || tab.id === "trades")) {
                  return false;
                }
                return true;
              })}
              activeId={detailTab}
              onChange={(id) => handleDetailTabChange(id as DetailTab)}
            >
              {(detailTab === "orders" || detailTab === "trades") && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-1">
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="flex h-11 items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 transition focus-within:border-[#0058FF] focus-within:ring-2 focus-within:ring-[#0058FF]/20">
                      <input
                        type="date"
                        value={detailTab === "orders" ? orderFilters.startDate : tradeFilters.startDate}
                        onChange={(e) => updateCurrentFilters("startDate", e.target.value)}
                        className="bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none"
                      />
                      <span className="mx-2 text-gray-400">~</span>
                      <input
                        type="date"
                        value={detailTab === "orders" ? orderFilters.endDate : tradeFilters.endDate}
                        onChange={(e) => updateCurrentFilters("endDate", e.target.value)}
                        className="bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none"
                      />
                    </div>
                    <div className="">
                      <Select
                        options={SIDE_OPTIONS}
                        value={detailTab === "orders" ? orderFilters.side : tradeFilters.side}
                        onChange={(v) => updateCurrentFilters("side", v)}
                        size="md"
                      />
                    </div>
                    {detailTab === "orders" && (
                      <div className="">
                        <Select
                          options={ORDER_STATUS_OPTIONS}
                          value={orderFilters.status}
                          onChange={(v) => updateCurrentFilters("status", v)}
                          size="md"
                        />
                      </div>
                    )}
                    <div className="relative w-48">
                      <input
                        type="text"
                        value={detailTab === "orders" ? orderSymbolInput : tradeSymbolInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (detailTab === "orders") setOrderSymbolInput(val); else setTradeSymbolInput(val);
                          if (!val) updateCurrentFilters("symbol", "");
                        }}
                        onFocus={() => setIsSymbolInputFocused(true)}
                        onBlur={() => setTimeout(() => setIsSymbolInputFocused(false), 200)}
                        placeholder="종목검색 (SOL)"
                        className="h-11 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#0058FF] focus:ring-2 focus:ring-[#0058FF]/20"
                      />
                      {isSymbolInputFocused && (detailTab === "orders" ? orderSymbolInput : tradeSymbolInput).trim() && (
                        <div className="absolute left-0 top-full mt-2 z-50 w-full overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {getMarketSearchMatches(detailTab === "orders" ? orderSymbolInput : tradeSymbolInput, marketSymbols).map((m) => (
                            <button key={m.symbol} onMouseDown={() => handleSelectSymbolSuggestion(m.symbol)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.displayNameKr}</span>
                              <span className="text-xs text-gray-400">{m.symbol}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={resetCurrentFilters} className="h-11 px-6 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">초기화</button>
                </div>
              )}

              <div className="px-0 pb-0 min-h-[400px]">
                {isLoadingMain || isLoadingOrders || isLoadingTrades || isLoadingContestData ? (
                  <EmptyState className="py-32" text="데이터를 불러오는 중입니다." />
                ) : detailTable.rows.length === 0 ? (
                  <EmptyState className="py-32" text={detailTable.emptyText} />
                ) : (
                  <div ref={scrollContainerRef} className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <DetailTable headers={detailTable.headers} headerClasses={detailTable.headerClasses} rows={detailTable.rows} />
                    <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                      <p className="text-xs font-bold text-gray-300">내역의 끝입니다.</p>
                    </div>
                  </div>
                )}
              </div>
            </FolderTabs>
          </div>
        </>
      )}
    </main>
  );
}

function EmptyState({ text, className = "py-20" }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <p className="text-gray-400 font-bold animate-pulse">{text}</p>
    </div>
  );
}

function DetailTable({ headers, headerClasses, rows }: { headers: string[]; headerClasses: string[]; rows: DetailTableCell[][] }) {
  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 ">
      <table className="w-full min-w-[1000px] text-sm whitespace-nowrap border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md">
          <tr>
            {headers.map((header, index) => (
              <th key={header} className={`py-5 px-6 first:pl-10 last:pr-10 text-[11px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-700 ${headerClasses[index] || "text-center"}`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="group hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className={`py-5 px-6 first:pl-10 last:pr-10 ${cell.className || ""}`}>
                  {cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
