"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import AssetSummaryCard, { type AssetSummary } from "@/components/asset/AssetSummaryCard";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { useTickerStore } from "@/stores/useTickerStore";
import { formatDateTime } from "@/lib/utils/date";
import {
  getBaseAssetLabel,
  getDefaultQuoteAssetLabel,
  getDisplaySymbolLabel,
} from "@/lib/utils/market-display";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";


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

type MarketSymbolMeta = {
  symbol: string;
  displayNameKr: string;
  displayNameEn: string;
  baseAsset: string;
  quoteAsset: string;
};

type OpenOrderItem = {
  orderId: number;
  assetType: string;
  symbol: string;
  displayNameKr: string;
  orderType: string;
  side: "BUY" | "SELL";
  orderStatus: "PENDING" | "PARTIALLY_FILLED" | "COMPLETED" | "CANCELED";
  orderPrice: number | null;
  orderQuantity: number | null;
  orderAmount: number | null;
  filledQuantity: number | null;
  remainingQuantity: number | null;
  avgFilledPrice: number | null;
  executedAmount: number | null;
  totalFee: number | null;
  orderedAt: string;
  executedAt: string | null;
  canceledAt: string | null;
};

type OrderHistoryItem = OpenOrderItem;

type TradeHistoryItem = {
  tradeId: number;
  orderId: number;
  assetType: string;
  symbol: string;
  displayNameKr: string;
  side: "BUY" | "SELL";
  orderType: string;
  orderStatus: "PENDING" | "PARTIALLY_FILLED" | "COMPLETED" | "CANCELED";
  price: number;
  quantity: number;
  totalAmount: number;
  fee: number;
  realizedProfit: number | null;
  orderedAt: string;
  executedAt: string | null;
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

type CursorPage<T> = {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
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
  size: 5,
};

const OPEN_ORDER_PAGE_SIZE = 5;

const createDefaultOrderFilters = (): TradeListFilters => ({
  ...DEFAULT_TRADE_LIST_FILTERS,
});

const createDefaultTradeHistoryFilters = (): TradeListFilters => ({
  ...DEFAULT_TRADE_LIST_FILTERS,
  status: "COMPLETED",
});

const SIDE_OPTIONS = [
  { label: "구분", value: "" },
  { label: "매수", value: "BUY" },
  { label: "매도", value: "SELL" },
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
  { label: "부분체결", value: "PARTIALLY_FILLED" },
  { label: "대기중", value: "PENDING" },
  { label: "취소", value: "CANCELED" },
];

const formatNumber = (value?: number | null) => {
  return formatAssetNumber(value);
};

const formatSignedNumber = (value?: number | null) => {
  return formatSignedAssetNumber(value);
};

const formatSignedPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};


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
      <span className="font-black text-gray-900">{assetLabel}</span>
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

const normalizeSymbolFilter = (
  keyword: string,
  marketSymbols: MarketSymbolMeta[]
) => {
  const rawKeyword = keyword.trim();

  if (!rawKeyword) return "";

  const upperKeyword = rawKeyword.toUpperCase();
  const lowerKeyword = rawKeyword.toLowerCase();
  const isEnglishLike = /^[A-Z0-9]+$/i.test(rawKeyword);

  const exactMatch = marketSymbols.find((market) => {
    return (
      market.symbol.toUpperCase() === upperKeyword ||
      market.baseAsset.toUpperCase() === upperKeyword ||
      market.displayNameKr === rawKeyword ||
      market.displayNameEn.toLowerCase() === lowerKeyword
    );
  });

  if (exactMatch) {
    return exactMatch.symbol;
  }

  const matchedMarkets = getMarketSearchMatches(rawKeyword, marketSymbols);

  if (matchedMarkets.length === 1) {
    return matchedMarkets[0].symbol;
  }

  if (matchedMarkets.length > 1) {
    return "";
  }

  if (isEnglishLike) {
    if (upperKeyword.endsWith("USDT")) {
      return upperKeyword;
    }

    return upperKeyword.length >= 3 ? `${upperKeyword}USDT` : "";
  }

  return "";
};

const getJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getCursorPage = <T,>(payload: unknown): CursorPage<T> => {
  const emptyPage: CursorPage<T> = {
    content: [],
    nextCursorId: null,
    hasNext: false,
  };

  if (!isRecord(payload)) return emptyPage;

  const data = isRecord(payload.data) ? payload.data : null;
  const nestedData = data && isRecord(data.data) ? data.data : null;

  const source =
    Array.isArray(payload.content) || "nextCursorId" in payload || "hasNext" in payload
      ? payload
      : data &&
        (Array.isArray(data.content) || "nextCursorId" in data || "hasNext" in data)
      ? data
      : nestedData;

  if (!source || !isRecord(source)) return emptyPage;

  return {
    content: Array.isArray(source.content) ? (source.content as T[]) : [],
    nextCursorId:
      typeof source.nextCursorId === "number" ? source.nextCursorId : null,
    hasNext: source.hasNext === true,
  };
};

const getArrayContent = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.content)) return payload.content as T[];

  return [];
};

const extractErrorMessage = (payload: unknown) => {
  if (!isRecord(payload)) return "";

  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;

  const data = isRecord(payload.data) ? payload.data : null;
  if (data && typeof data.message === "string") return data.message;

  return "";
};

const buildTradeListQuery = ({
  assetType,
  filters,
  marketSymbols,
  cursorId,
  fallbackStatus = "",
}: {
  assetType: "MOCK" | "TRADE_SPOT" | "TRADE_FUTURE" | "CONTEST";
  filters: TradeListFilters;
  marketSymbols: MarketSymbolMeta[];
  cursorId?: number | null;
  fallbackStatus?: string;
}) => {
  const params = new URLSearchParams();
  const status = filters.status || fallbackStatus;
  const normalizedSymbol = normalizeSymbolFilter(filters.symbol, marketSymbols);

  params.set("assetType", assetType);
  params.set("size", String(filters.size));

  if (cursorId !== null && cursorId !== undefined) {
    params.set("cursorId", String(cursorId));
  }

  if (normalizedSymbol) params.set("symbol", normalizedSymbol);
  if (filters.side) params.set("side", filters.side);
  if (status) params.set("status", status);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  return params.toString();
};

const isNoMockWalletMessage = (message: string) => {
  return (
    message.includes("현재 참여중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("생성된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.")
  );
};

const getProfitColorClass = (value?: number | null) => {
  if ((value ?? 0) > 0) return "text-red-500 font-black";
  if ((value ?? 0) < 0) return "text-blue-500 font-black";
  return "text-gray-900 font-black";
};

const getSideColorClass = (side: "BUY" | "SELL") => {
  return side === "BUY" ? "text-red-500 font-black" : "text-blue-500 font-black";
};

/**
 * 특정 심볼의 실시간 시세를 구독하여 해당 셀만 업데이트하는 컴포넌트
 */
function TickerCell({ 
  symbol, 
  fallbackPrice, 
  quantity, 
  buyAmount, 
  type = "price" 
}: { 
  symbol: string; 
  fallbackPrice: number; 
  quantity: number; 
  buyAmount: number;
  type?: "price" | "value" | "profit" | "roi" | "ratio" | "totalAsset";
  currentTotalAsset?: number;
}) {
  const realtimePrice = useTickerStore((state) => state.tickers[symbol]?.price ?? fallbackPrice);
  
  if (type === "price") return <>{formatAssetNumber(realtimePrice)}</>;
  
  const value = quantity * realtimePrice;
  if (type === "value") return <span className="font-bold text-gray-900">{formatAssetNumber(value)}</span>;
  
  const profit = value - buyAmount;
  if (type === "profit") return <span className={getProfitColorClass(profit)}>{formatSignedAssetNumber(profit)}</span>;
  
  const roi = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;
  if (type === "roi") return <span className={getProfitColorClass(profit)}>{formatSignedPercent(roi)}</span>;

  return null;
}

/**
 * 자산 요약 카드만 실시간으로 업데이트하는 래퍼 컴포넌트
 */
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
  
  // 시세 기반 실시간 계산
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchAssetTab = searchParams.get("assetTab");
  const searchDetailTab = searchParams.get("detailTab");

  const [assetTab, setAssetTab] = useState<AssetTab>(
    isAssetTab(searchAssetTab) ? searchAssetTab : "mock"
  );
  const [detailTab, setDetailTab] = useState<DetailTab>(
    isDetailTab(searchDetailTab) ? searchDetailTab : "holdings"
  );

  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [mockErrorMessage, setMockErrorMessage] = useState("");

  const [mockPortfolio, setMockPortfolio] = useState<MockPortfolio | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrderItem[]>([]);
  const [openOrdersNextCursorId, setOpenOrdersNextCursorId] = useState<
    number | null
  >(null);
  const [openOrdersHasNext, setOpenOrdersHasNext] = useState(false);
  const [orderHistories, setOrderHistories] = useState<OrderHistoryItem[]>([]);
  const [tradeHistories, setTradeHistories] = useState<TradeHistoryItem[]>([]);
  // 주문내역 / 거래내역은 각각 커서를 따로 관리해야 무한스크롤이 꼬이지 않습니다.
  const [ordersNextCursorId, setOrdersNextCursorId] = useState<number | null>(null);
  const [tradesNextCursorId, setTradesNextCursorId] = useState<number | null>(null);
  const [ordersHasNext, setOrdersHasNext] = useState(false);
  const [tradesHasNext, setTradesHasNext] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [isFetchingMoreOpenOrders, setIsFetchingMoreOpenOrders] =
    useState(false);
  const [isFetchingMoreOrders, setIsFetchingMoreOrders] = useState(false);
  const [isFetchingMoreTrades, setIsFetchingMoreTrades] = useState(false);
  const [ordersErrorMessage, setOrdersErrorMessage] = useState("");
  const [tradesErrorMessage, setTradesErrorMessage] = useState("");
  const [marketSymbols, setMarketSymbols] = useState<MarketSymbolMeta[]>([]);
  const [orderFilters, setOrderFilters] = useState<TradeListFilters>(
    createDefaultOrderFilters
  );
  const [tradeFilters, setTradeFilters] = useState<TradeListFilters>(
    createDefaultTradeHistoryFilters
  );
  const [orderSymbolInput, setOrderSymbolInput] = useState("");
  const [tradeSymbolInput, setTradeSymbolInput] = useState("");
  const [isSymbolInputFocused, setIsSymbolInputFocused] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 실시간 시세 웹소켓 연결
  useBinanceWebSocket();

  // 실시간 갱신 로직은 이제 개별 컴포넌트 내부로 이동하거나 
  // 필요한 최소 단위로 쪼개어 처리합니다.
  const [realtimeMockSummary, setRealtimeMockSummary] = useState<{
    totalAsset: number;
    totalProfit: number;
    totalRoi: number;
    totalCoinValue: number;
  } | null>(null);

  // 시세 변화 시 자산 요약 정보를 업데이트하는 로직은
  // 성능을 위해 메모이제이션되거나 전용 컴포넌트에서 처리하도록 구조를 변경합니다.
  // (여기서는 일단 무한 루프 방지 및 전체 리렌더링 차단을 위해 구독을 제거합니다)

  // SSE 체결 알림 수신 시 모든 자산 데이터 리프레시
  useEffect(() => {
    const handleTradeCompleted = () => {
      console.log("Real-time Assets Refreshing...");
      setRefreshTrigger((prev) => prev + 1);
    };

    const events = [
      "NOTIFICATION_MOCK_ORDER_COMPLETED",
      "NOTIFICATION_TRADE_ORDER_COMPLETED",
      "NOTIFICATION_CONTEST_ORDER_COMPLETED",
    ];

    const unsubs = events.map((event) => {
      const eventName = getNotificationSseBridgeEventName(event as any);
      window.addEventListener(eventName, handleTradeCompleted);
      return () => window.removeEventListener(eventName, handleTradeCompleted);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // URL 쿼리 파라미터 변화 감지 및 내부 상태 동기화 (뒤로가기/앞으로가기 대응)
  useEffect(() => {
    const urlAssetTab = isAssetTab(searchAssetTab) ? searchAssetTab : "mock";
    const urlDetailTab = isDetailTab(searchDetailTab) ? searchDetailTab : "holdings";

    // 현재 상태와 URL이 다를 때만 업데이트하여 루프 방지
    if (assetTab !== urlAssetTab) setAssetTab(urlAssetTab);
    if (detailTab !== urlDetailTab) setDetailTab(urlDetailTab);
  }, [searchAssetTab, searchDetailTab]);

  // 탭 변경 시 상태와 URL을 동시에 업데이트하는 도우미 함수
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

  useEffect(() => {
    let isActive = true;

    const loadMarketSymbols = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/v1/market/spot/symbols",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          return;
        }

        const json = await getJson(response);

        if (!isActive) return;

        setMarketSymbols(getArrayContent<MarketSymbolMeta>(json));
      } catch (error) {
        if (!isActive) return;
        console.error("마켓 심볼 목록 조회 실패:", error);
      }
    };

    void loadMarketSymbols();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (assetTab !== "mock") return;

    let isActive = true;

    const loadMockData = async () => {
      setIsLoadingMock(true);
      setMockErrorMessage("");

      try {
        const portfolioResponse = await fetch(
          "http://localhost:8080/api/v1/asset/mock/portfolio",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (portfolioResponse.status === 401 || portfolioResponse.status === 403) {
          router.replace("/login");
          return;
        }

        const portfolioJson = await getJson(portfolioResponse);
        const portfolioMessage = extractErrorMessage(portfolioJson);

        if (!isActive) return;

        if (portfolioResponse.ok) {
          const portfolioData =
            isRecord(portfolioJson) && "data" in portfolioJson
              ? (portfolioJson.data as MockPortfolio)
              : (portfolioJson as MockPortfolio);

          setMockPortfolio(portfolioData);
        } else {
          setMockPortfolio(null);
          setMockErrorMessage(
            isNoMockWalletMessage(portfolioMessage)
              ? "모의투자 계좌를 생성하면 자산 정보가 표시됩니다."
              : portfolioMessage || "모의투자 포트폴리오를 불러오지 못했습니다."
          );
          setOpenOrders([]);
          setOpenOrdersNextCursorId(null);
          setOpenOrdersHasNext(false);
          setIsFetchingMoreOpenOrders(false);
          setOrderHistories([]);
          setTradeHistories([]);
          setOrdersNextCursorId(null);
          setTradesNextCursorId(null);
          setOrdersHasNext(false);
          setTradesHasNext(false);
          setIsLoadingMock(false);
          return;
        }
      } catch (error) {
        if (!isActive) return;
        console.error("모의투자 포트폴리오 조회 실패:", error);
        setMockPortfolio(null);
        setMockErrorMessage("모의투자 포트폴리오를 불러오지 못했습니다.");
        setOpenOrders([]);
        setOpenOrdersNextCursorId(null);
        setOpenOrdersHasNext(false);
        setIsFetchingMoreOpenOrders(false);
        setOrderHistories([]);
        setTradeHistories([]);
        setOrdersNextCursorId(null);
        setTradesNextCursorId(null);
        setOrdersHasNext(false);
        setTradesHasNext(false);
      }

      try {
        const openOrdersResponse = await fetch(
          `http://localhost:8080/api/v1/spot/mock/orders/open?assetType=MOCK&size=${OPEN_ORDER_PAGE_SIZE}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (openOrdersResponse.status === 401 || openOrdersResponse.status === 403) {
          router.replace("/login");
          return;
        }

        if (!isActive) return;

        if (openOrdersResponse.ok) {
          const openOrdersJson = await getJson(openOrdersResponse);
          const page = getCursorPage<OpenOrderItem>(openOrdersJson);

          setOpenOrders(page.content);
          setOpenOrdersNextCursorId(page.nextCursorId);
          setOpenOrdersHasNext(page.hasNext);
          setIsFetchingMoreOpenOrders(false);
        } else {
          setOpenOrders([]);
          setOpenOrdersNextCursorId(null);
          setOpenOrdersHasNext(false);
          setIsFetchingMoreOpenOrders(false);
        }
      } catch (error) {
        if (!isActive) return;
        console.error("미체결 주문 조회 실패:", error);
        setOpenOrders([]);
        setOpenOrdersNextCursorId(null);
        setOpenOrdersHasNext(false);
        setIsFetchingMoreOpenOrders(false);
      }

      if (isActive) {
        setIsLoadingMock(false);
      }
    };

    void loadMockData();

    return () => {
      isActive = false;
    };
  }, [assetTab, router, refreshTrigger]);

  useEffect(() => {
    if (assetTab !== "mock" || detailTab !== "orders" || !mockPortfolio) return;

    let isActive = true;

    const loadInitialOrders = async () => {
      const query = buildTradeListQuery({
        assetType: "MOCK",
        filters: orderFilters,
        marketSymbols,
      });

      setIsLoadingOrders(true);
      setOrdersErrorMessage("");
      setOrderHistories([]);
      setOrdersNextCursorId(null);
      setOrdersHasNext(false);

      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/spot/mock/orders?${query}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.status === 401 || response.status === 403) {
          router.replace("/login");
          return;
        }

        const json = await getJson(response);

        if (!isActive) return;

        if (!response.ok) {
          setOrdersErrorMessage(
            extractErrorMessage(json) || "주문내역을 불러오지 못했습니다."
          );
          return;
        }

        const page = getCursorPage<OrderHistoryItem>(json);

        setOrderHistories(page.content);
        setOrdersNextCursorId(page.nextCursorId);
        setOrdersHasNext(page.hasNext);
      } catch (error) {
        if (!isActive) return;
        console.error("주문내역 초기 조회 실패:", error);
        setOrdersErrorMessage("주문내역을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingOrders(false);
        }
      }
    };

    void loadInitialOrders();

    return () => {
      isActive = false;
    };
  }, [assetTab, detailTab, mockPortfolio, orderFilters, router, marketSymbols, refreshTrigger]);

  useEffect(() => {
    if (assetTab !== "mock" || detailTab !== "trades" || !mockPortfolio) return;

    let isActive = true;

    const loadInitialTrades = async () => {
      const query = buildTradeListQuery({
        assetType: "MOCK",
        filters: tradeFilters,
        marketSymbols,
      });

      setIsLoadingTrades(true);
      setTradesErrorMessage("");
      setTradeHistories([]);
      setTradesNextCursorId(null);
      setTradesHasNext(false);

      try {
        const response = await fetch(
          `http://localhost:8080/api/v1/spot/mock/histories?${query}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.status === 401 || response.status === 403) {
          router.replace("/login");
          return;
        }

        const json = await getJson(response);

        if (!isActive) return;

        if (!response.ok) {
          setTradesErrorMessage(
            extractErrorMessage(json) || "거래내역을 불러오지 못했습니다."
          );
          return;
        }

        const page = getCursorPage<TradeHistoryItem>(json);

        setTradeHistories(page.content);
        setTradesNextCursorId(page.nextCursorId);
        setTradesHasNext(page.hasNext);
      } catch (error) {
        if (!isActive) return;
        console.error("거래내역 초기 조회 실패:", error);
        setTradesErrorMessage("거래내역을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingTrades(false);
        }
      }
    };

    void loadInitialTrades();

    return () => {
      isActive = false;
    };
  }, [assetTab, detailTab, mockPortfolio, router, tradeFilters, marketSymbols, refreshTrigger]);

  // SSE 이벤트를 리스닝하여 주문 체결 시 데이터를 갱신합니다.
  useEffect(() => {
    const handleSseRefresh = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    const events = [
      getNotificationSseBridgeEventName("NOTIFICATION_MOCK_ORDER_COMPLETED"),
      getNotificationSseBridgeEventName("NOTIFICATION_TRADE_ORDER_COMPLETED"),
      getNotificationSseBridgeEventName("NOTIFICATION_CONTEST_ORDER_COMPLETED"),
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleSseRefresh);
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleSseRefresh);
      });
    };
  }, []);

  useEffect(() => {
    if (assetTab !== "mock") return;
    if (
      detailTab !== "open" &&
      detailTab !== "orders" &&
      detailTab !== "trades"
    ) {
      return;
    }
    if (!scrollContainerRef.current) return;
    if (!loadMoreRef.current) return;

    const canLoadOpenOrders =
      detailTab === "open" &&
      openOrdersHasNext &&
      !isLoadingMock &&
      !isFetchingMoreOpenOrders &&
      openOrdersNextCursorId !== null;

    const canLoadOrders =
      detailTab === "orders" &&
      ordersHasNext &&
      !isLoadingOrders &&
      !isFetchingMoreOrders &&
      ordersNextCursorId !== null;

    const canLoadTrades =
      detailTab === "trades" &&
      tradesHasNext &&
      !isLoadingTrades &&
      !isFetchingMoreTrades &&
      tradesNextCursorId !== null;

    if (!canLoadOpenOrders && !canLoadOrders && !canLoadTrades) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) return;

        // 테이블 맨 아래가 보이면 다음 커서로 이어서 불러옵니다.
        if (detailTab === "open" && openOrdersNextCursorId !== null) {
          setIsFetchingMoreOpenOrders(true);

          const loadMoreOpenOrders = async () => {
            try {
              const params = new URLSearchParams();
              params.set("assetType", "MOCK");
              params.set("size", String(OPEN_ORDER_PAGE_SIZE));
              params.set("cursorId", String(openOrdersNextCursorId));

              const response = await fetch(
                `http://localhost:8080/api/v1/spot/mock/orders/open?${params.toString()}`,
                {
                  method: "GET",
                  credentials: "include",
                }
              );

              if (response.status === 401 || response.status === 403) {
                router.replace("/login");
                return;
              }

              const json = await getJson(response);

              if (!response.ok) {
                console.error(
                  "미체결내역 추가 조회 실패:",
                  extractErrorMessage(json) || "요청 실패"
                );
                setOpenOrdersHasNext(false);
                return;
              }

              const page = getCursorPage<OpenOrderItem>(json);

              setOpenOrders((prev) => [...prev, ...page.content]);
              setOpenOrdersNextCursorId(page.nextCursorId);
              setOpenOrdersHasNext(page.hasNext);
            } catch (error) {
              console.error("미체결내역 추가 조회 실패:", error);
              setOpenOrdersHasNext(false);
            } finally {
              setIsFetchingMoreOpenOrders(false);
            }
          };

          void loadMoreOpenOrders();
          return;
        }

        if (detailTab === "orders" && ordersNextCursorId !== null) {
          setIsFetchingMoreOrders(true);

          const loadMoreOrders = async () => {
            try {
              const query = buildTradeListQuery({
                assetType: "MOCK",
                filters: orderFilters,
                marketSymbols,
                cursorId: ordersNextCursorId,
              });

              const response = await fetch(
                `http://localhost:8080/api/v1/spot/mock/orders?${query}`,
                {
                  method: "GET",
                  credentials: "include",
                }
              );

              if (response.status === 401 || response.status === 403) {
                router.replace("/login");
                return;
              }

              const json = await getJson(response);

              if (!response.ok) {
                console.error(
                  "주문내역 추가 조회 실패:",
                  extractErrorMessage(json) || "요청 실패"
                );
                setOrdersHasNext(false);
                return;
              }

              const page = getCursorPage<OrderHistoryItem>(json);

              setOrderHistories((prev) => [...prev, ...page.content]);
              setOrdersNextCursorId(page.nextCursorId);
              setOrdersHasNext(page.hasNext);
            } catch (error) {
              console.error("주문내역 추가 조회 실패:", error);
              setOrdersHasNext(false);
            } finally {
              setIsFetchingMoreOrders(false);
            }
          };

          void loadMoreOrders();
          return;
        }

        if (detailTab === "trades" && tradesNextCursorId !== null) {
          setIsFetchingMoreTrades(true);

          const loadMoreTrades = async () => {
            try {
              const query = buildTradeListQuery({
                assetType: "MOCK",
                filters: tradeFilters,
                marketSymbols,
                cursorId: tradesNextCursorId,
              });

              const response = await fetch(
                `http://localhost:8080/api/v1/spot/mock/histories?${query}`,
                {
                  method: "GET",
                  credentials: "include",
                }
              );

              if (response.status === 401 || response.status === 403) {
                router.replace("/login");
                return;
              }

              const json = await getJson(response);

              if (!response.ok) {
                console.error(
                  "거래내역 추가 조회 실패:",
                  extractErrorMessage(json) || "요청 실패"
                );
                setTradesHasNext(false);
                return;
              }

              const page = getCursorPage<TradeHistoryItem>(json);

              setTradeHistories((prev) => [...prev, ...page.content]);
              setTradesNextCursorId(page.nextCursorId);
              setTradesHasNext(page.hasNext);
            } catch (error) {
              console.error("거래내역 추가 조회 실패:", error);
              setTradesHasNext(false);
            } finally {
              setIsFetchingMoreTrades(false);
            }
          };

          void loadMoreTrades();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: detailTab === "open" ? "0px" : "80px 0px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    assetTab,
    detailTab,
    openOrdersHasNext,
    openOrdersNextCursorId,
    ordersHasNext,
    ordersNextCursorId,
    tradesHasNext,
    tradesNextCursorId,
    isLoadingMock,
    isLoadingOrders,
    isLoadingTrades,
    isFetchingMoreOpenOrders,
    isFetchingMoreOrders,
    isFetchingMoreTrades,
    orderFilters,
    router,
    tradeFilters,
    marketSymbols,
  ]);

  const pieData = useMemo(() => {
    if (assetTab !== "mock" || !mockPortfolio) return [];

    const totalAsset = realtimeMockSummary?.totalAsset ?? mockPortfolio.totalAsset;

    const holdingsData = mockPortfolio.holdings
      .filter((item) => item.quantity > 0)
      .map((item, index) => {
        // 차트의 안정성을 위해 실시간 시세 대신 포트폴리오 로드 시점의 가격 사용
        const price = item.currentPrice;
        const totalValue = item.quantity * price;

        return {
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: mockPortfolio.totalAsset > 0 ? (totalValue / mockPortfolio.totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        };
      });

    const cashRatio =
      totalAsset > 0 ? (mockPortfolio.cashBalance / totalAsset) * 100 : 0;

    if (cashRatio > 0) {
      holdingsData.unshift({
        name: getDefaultQuoteAssetLabel(marketSymbols) || "현금",
        value: cashRatio,
        color: CHART_COLORS[0],
      });
    }

    return holdingsData.filter((item) => item.value > 0);
  }, [assetTab, marketSymbols, mockPortfolio]);

  const defaultQuoteAssetLabel = getDefaultQuoteAssetLabel(marketSymbols);
  const withQuoteAssetHeader = useCallback(
    (label: string) =>
      defaultQuoteAssetLabel ? `${label}(${defaultQuoteAssetLabel})` : label,
    [defaultQuoteAssetLabel]
  );

  const detailTable = useMemo<DetailTableData>(() => {
    if (detailTab === "holdings") {
      return {
        headers: [
          "자산",
          "보유수량",
          withQuoteAssetHeader("평균매수가"),
          withQuoteAssetHeader("현재가"),
          withQuoteAssetHeader("평가금액"),
          withQuoteAssetHeader("평가손익"),
          "수익률",
        ],
        headerClasses: [
          "text-center",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
        ],
        rows: (mockPortfolio?.holdings ?? []).map((item) => {
          return [
            cell(
              getAssetCellValue(
                getBaseAssetLabel(item.symbol, marketSymbols),
                item.symbol,
                marketSymbols
              ),
              "text-center"
            ),
            cell(formatNumber(item.quantity), "text-right"),
            cell(formatNumber(item.averageBuyPrice), "text-right"),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="price" />, 
              "text-right"
            ),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="value" />, 
              "text-right font-bold"
            ),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="profit" />, 
              "text-right"
            ),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="roi" />, 
              "text-right"
            ),
          ];
        }),
        emptyText: "보유 중인 자산이 없습니다.",
      };
    }

    if (detailTab === "pnl") {
      return {
        headers: [
          "자산",
          withQuoteAssetHeader("총매수"),
          withQuoteAssetHeader("총평가"),
          withQuoteAssetHeader("평가손익"),
          "수익률",
          "비중",
        ],
        headerClasses: [
          "text-center",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
        ],
        rows: (mockPortfolio?.holdings ?? []).map((item) => {
          return [
            cell(
              getAssetCellValue(
                getBaseAssetLabel(item.symbol, marketSymbols),
                item.symbol,
                marketSymbols
              ),
              "text-center"
            ),
            cell(formatNumber(item.buyAmount), "text-right"),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="value" />, 
              "text-right"
            ),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="profit" />, 
              "text-right"
            ),
            cell(
              <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="roi" />, 
              "text-right"
            ),
            cell(formatNumber(item.holdingRatio) + "%", "text-right"),
          ];
        }),
        emptyText: "손익현황을 표시할 자산이 없습니다.",
      };
    }

    if (detailTab === "orders") {
      return {
        headers: [
          "주문일시",
          "자산",
          "구분",
          "주문유형",
          withQuoteAssetHeader("주문가격"),
          "주문수량",
          withQuoteAssetHeader("주문금액"),
          "상태",
        ],
        headerClasses: [
          "text-center",
          "text-center",
          "text-center",
          "text-center",
          "text-right",
          "text-right",
          "text-right",
          "text-center",
        ],
        rows: orderHistories.map((item) => [
          cell(formatDateTime(item.orderedAt), "text-center text-gray-500"),
          cell(getAssetCellValue(item.displayNameKr, item.symbol, marketSymbols), "text-center"),
          cell(
            item.side === "BUY" ? "매수" : "매도",
            `text-center ${getSideColorClass(item.side)}`
          ),
          cell(formatOrderType(item.orderType), "text-center text-gray-600"),
          cell(
            formatNumber(item.avgFilledPrice ?? item.orderPrice),
            "text-right"
          ),
          cell(
            formatNumber(item.filledQuantity ?? item.orderQuantity),
            "text-right"
          ),
          cell(
            formatNumber(item.executedAmount ?? item.orderAmount),
            "text-right font-bold"
          ),
          cell(formatOrderStatus(item.orderStatus), "text-center font-bold"),
        ]),
        emptyText: ordersErrorMessage || "주문내역이 없습니다.",
      };
    }

    if (detailTab === "trades") {
      return {
        headers: [
          "체결일시",
          "자산",
          "구분",
          withQuoteAssetHeader("체결가"),
          "체결수량",
          withQuoteAssetHeader("총금액"),
          withQuoteAssetHeader("수수료"),
          withQuoteAssetHeader("실현손익"),
        ],
        headerClasses: [
          "text-center",
          "text-center",
          "text-center",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
          "text-right",
        ],
        rows: tradeHistories.map((item) => [
          cell(formatDateTime(item.executedAt || item.orderedAt), "text-center text-gray-500"),
          cell(getAssetCellValue(item.displayNameKr, item.symbol, marketSymbols), "text-center"),
          cell(
            item.side === "BUY" ? "매수" : "매도",
            `text-center ${getSideColorClass(item.side)}`
          ),
          cell(formatNumber(item.price), "text-right"),
          cell(formatNumber(item.quantity), "text-right"),
          cell(formatNumber(item.totalAmount), "text-right font-bold"),
          cell(formatNumber(item.fee), "text-right"),
          cell(
            formatSignedNumber(item.realizedProfit ?? 0),
            `text-right ${getProfitColorClass(item.realizedProfit)}`
          ),
        ]),
        emptyText: tradesErrorMessage || "거래내역이 없습니다.",
      };
    }

    return {
      headers: [
        "주문일시",
        "자산",
        "구분",
        withQuoteAssetHeader("주문가격"),
        "주문수량",
        "미체결수량",
        withQuoteAssetHeader("주문금액"),
        "상태",
      ],
      headerClasses: [
        "text-center",
        "text-center",
        "text-center",
        "text-right",
        "text-right",
        "text-right",
        "text-right",
        "text-center",
      ],
      rows: openOrders.map((item) => [
        cell(formatDateTime(item.orderedAt), "text-center text-gray-500"),
        cell(getAssetCellValue(item.displayNameKr, item.symbol, marketSymbols), "text-center"),
        cell(
          item.side === "BUY" ? "매수" : "매도",
          `text-center ${getSideColorClass(item.side)}`
        ),
        cell(formatNumber(item.orderPrice), "text-right"),
        cell(formatNumber(item.orderQuantity), "text-right"),
        cell(formatNumber(item.remainingQuantity), "text-right"),
        cell(formatNumber(item.orderAmount), "text-right font-bold"),
        cell(formatOrderStatus(item.orderStatus), "text-center font-bold"),
      ]),
      emptyText: "미체결내역이 없습니다.",
    };
  }, [
    detailTab,
    mockPortfolio,
    orderHistories,
    tradeHistories,
    openOrders,
    ordersErrorMessage,
    tradesErrorMessage,
    marketSymbols,
    withQuoteAssetHeader,
  ]);

  const isLoadingDetailTab =
    detailTab === "orders"
      ? isLoadingOrders
      : detailTab === "trades"
      ? isLoadingTrades
      : false;

  const isFetchingMoreCurrentTab =
    detailTab === "orders"
      ? isFetchingMoreOrders
      : detailTab === "trades"
      ? isFetchingMoreTrades
      : detailTab === "open"
      ? isFetchingMoreOpenOrders
      : false;

  const canLoadMoreCurrentTab =
    detailTab === "orders"
      ? ordersHasNext
      : detailTab === "trades"
      ? tradesHasNext
      : detailTab === "open"
      ? openOrdersHasNext
      : false;

  const isFilterableDetailTab = detailTab === "orders" || detailTab === "trades";

  const currentFilters = detailTab === "orders" ? orderFilters : tradeFilters;
  const currentSymbolInput = detailTab === "orders" ? orderSymbolInput : tradeSymbolInput;
  const currentStatusOptions =
    detailTab === "orders" ? ORDER_STATUS_OPTIONS : TRADE_STATUS_OPTIONS;
  const currentSymbolSuggestions = useMemo(
    () => getMarketSearchMatches(currentSymbolInput, marketSymbols),
    [currentSymbolInput, marketSymbols]
  );

  const updateCurrentFilters = (
    key: keyof TradeListFilters,
    value: string | number
  ) => {
    const nextValue = key === "size" ? Number(value) : String(value);

    if (detailTab === "orders") {
      setOrderFilters((prev) => ({
        ...prev,
        [key]: nextValue,
      }));
      return;
    }

    if (detailTab === "trades") {
      setTradeFilters((prev) => ({
        ...prev,
        [key]: nextValue,
      }));
    }
  };

  const updateCurrentSymbolInput = (value: string) => {
    if (detailTab === "orders") {
      setOrderSymbolInput(value);

      if (value.trim() === "") {
        setOrderFilters((prev) => ({
          ...prev,
          symbol: "",
        }));
      }

      return;
    }

    if (detailTab === "trades") {
      setTradeSymbolInput(value);

      if (value.trim() === "") {
        setTradeFilters((prev) => ({
          ...prev,
          symbol: "",
        }));
      }
    }
  };

  const resetCurrentFilters = () => {
    if (detailTab === "orders") {
      setOrderSymbolInput("");
      setOrderFilters(createDefaultOrderFilters());
      return;
    }

    if (detailTab === "trades") {
      setTradeSymbolInput("");
      setTradeFilters(createDefaultTradeHistoryFilters());
    }
  };

  const handleSelectSymbolSuggestion = (symbol: string) => {
    if (detailTab === "orders") {
      setOrderSymbolInput(symbol);
    }

    if (detailTab === "trades") {
      setTradeSymbolInput(symbol);
    }

    updateCurrentFilters("symbol", symbol);
    setIsSymbolInputFocused(false);
  };

  return (
    <main className="w-full space-y-6">

      <Tabs
        tabs={[
          { label: "트레이딩", value: "trade" },
          { label: "대회", value: "contest" },
          { label: "모의투자", value: "mock" },
        ]}
        activeTab={assetTab}
        onChange={(value) => handleAssetTabChange(value as AssetTab)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-16">
        {mockPortfolio ? (
          <RealtimeAssetSummary 
            portfolio={mockPortfolio} 
            className="lg:col-span-4"
            title={
              assetTab === "trade"
                ? "트레이딩 자산"
                : assetTab === "contest"
                ? "대회 자산"
                : "모의투자 자산"
            }
          />
        ) : (
          <AssetSummaryCard
            className="lg:col-span-4"
            summary={{
              title:
                assetTab === "trade"
                  ? "트레이딩 자산"
                  : assetTab === "contest"
                  ? "대회 자산"
                  : "모의투자 자산",
              cashBalance: 0,
              totalAsset: 0,
              totalBuyAmount: 0,
              totalCoinValue: 0,
              totalProfit: 0,
              totalRoi: 0,
            }}
          />
        )}

        <section className="lg:col-span-8 rounded-3xl bg-white dark:bg-gray-800 p-8 border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
          {assetTab !== "mock" ? (
            <EmptyState text="아직 해당 자산 데이터는 준비 중입니다." />
          ) : isLoadingMock ? (
            <EmptyState text="포트폴리오를 분석하는 중입니다..." />
          ) : !mockPortfolio ? (
            <EmptyState text={mockErrorMessage || "모의투자 데이터가 없습니다."} />
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
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={entry.color || CHART_COLORS[i]} />
                      ))}
                      <Label
                        value="보유 비중(%)"
                        position="center"
                        fill="#9ca3af"
                        style={{ fontSize: "14px", fontWeight: "bold" }}
                      />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value) => {
                        const parsedValue = Array.isArray(value)
                          ? Number(value[0])
                          : Number(value ?? 0);
                        const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;

                        return [`${safeValue.toFixed(2)}%`, "비중"];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-8 gap-y-4 w-full md:w-1/2 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3"
                  >
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div id="asset-detail-tabs">
        <FolderTabs
          tabs={[
            { id: "holdings", label: "보유자산", content: null },
            { id: "pnl", label: "손익현황", content: null },
            { id: "orders", label: "주문내역", content: null },
            { id: "trades", label: "거래내역", content: null },
            { id: "open", label: "미체결내역", content: null },
          ]}
          activeId={detailTab}
          onChange={(id) => handleDetailTabChange(id as DetailTab)}
        >
        {assetTab === "mock" && isFilterableDetailTab ? (
          <div className=" mb-5">
            <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl lg:flex-nowrap">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-white px-2 transition focus-within:border-[#0058FF] focus-within:ring-2 focus-within:ring-[#0058FF]">
                  <input
                    type="date"
                    value={currentFilters.startDate}
                    onChange={(event) => updateCurrentFilters("startDate", event.target.value)}
                    className="w-32 bg-transparent px-2 text-sm text-gray-900 outline-none cursor-pointer"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="date"
                    value={currentFilters.endDate}
                    onChange={(event) => updateCurrentFilters("endDate", event.target.value)}
                    className="w-32 bg-transparent px-2 text-sm text-gray-900 outline-none cursor-pointer"
                  />
                </div>

                <div className="">
                  <Select
                    options={SIDE_OPTIONS}
                    value={currentFilters.side}
                    onChange={(value) => updateCurrentFilters("side", value)}
                    size="md"
                    fullWidth={true}
                  />
                </div>

                <div className="w-30">
                  <Select
                    options={currentStatusOptions}
                    value={currentFilters.status}
                    onChange={(value) => updateCurrentFilters("status", value)}
                    size="md"
                    fullWidth={true}
                  />
                </div>

                <div className="relative w-48">
                  <input
                    type="text"
                    value={currentSymbolInput}
                    onChange={(event) => updateCurrentSymbolInput(event.target.value)}
                    onFocus={() => setIsSymbolInputFocused(true)}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setIsSymbolInputFocused(false);
                      }, 100);
                    }}
                    placeholder="종목검색 (SOL, 솔라나)"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#0058FF] focus:ring-2 focus:ring-[#0058FF]"
                  />

                  {isSymbolInputFocused &&
                  currentSymbolInput.trim() !== "" &&
                  currentSymbolSuggestions.length > 0 ? (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {currentSymbolSuggestions.map((market) => (
                        <button
                          key={market.symbol}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelectSymbolSuggestion(market.symbol);
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-blue-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {market.displayNameKr}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                              {getDisplaySymbolLabel(market.symbol, marketSymbols)}
                            </p>
                          </div>
                          <span className="ml-3 shrink-0 text-xs font-medium text-gray-400">
                            {market.baseAsset}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={resetCurrentFilters}
                  className="flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:bg-gray-100"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="px-0 pb-0">
          {assetTab !== "mock" ? (
            <EmptyState className="py-24" text="아직 해당 자산 데이터는 준비 중입니다." />
          ) : isLoadingMock || isLoadingDetailTab ? (
            <EmptyState className="py-24" text="데이터를 불러오는 중입니다." />
          ) : detailTable.rows.length === 0 ? (
            <EmptyState className="py-24" text={detailTable.emptyText} />
          ) : (
            <>
              {detailTab === "open" ||
              detailTab === "orders" ||
              detailTab === "trades" ? (
                <div
                  ref={scrollContainerRef}
                  className="max-h-[410px] overflow-y-auto"
                >
                  <DetailTable
                    headers={detailTable.headers}
                    headerClasses={detailTable.headerClasses}
                    rows={detailTable.rows}
                  />

                  <div className="px-6 py-4 text-center">
                    {canLoadMoreCurrentTab ? (
                      <>
                        <div ref={loadMoreRef} className="h-1" />
                        {isFetchingMoreCurrentTab && (
                          <p className="mt-3 text-sm font-medium text-gray-400">
                            내역을 더 불러오는 중입니다.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-gray-400">
                        마지막 내역까지 모두 불러왔습니다.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <DetailTable
                  headers={detailTable.headers}
                  headerClasses={detailTable.headerClasses}
                  rows={detailTable.rows}
                />
              )}
            </>
          )}
        </div>
        </FolderTabs>
      </div>
    </main>
  );
}

function EmptyState({ text, className = "py-20" }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <p className="text-gray-400 font-bold">{text}</p>
    </div>
  );
}

function DetailTable({
  headers,
  headerClasses,
  rows,
}: {
  headers: string[];
  headerClasses: string[];
  rows: DetailTableCell[][];
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm whitespace-nowrap">
        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 text-center dark:text-gray-400 font-bold border-b border-gray-200 dark:border-gray-700">
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                className={`py-4 px-6 first:pl-8 last:pr-8 tracking-tight ${
                  headerClasses[index] ?? "text-center"
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {row.map((item, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className={`py-4 px-6 first:pl-8 last:pr-8 ${item.className || ""}`}
                >
                  {item.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
