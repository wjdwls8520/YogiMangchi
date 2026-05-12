"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Tabs from "@/components/ui/Tabs";
import { formatDateTime } from "@/lib/utils/date";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { cancelOrder, fetchOpenOrders, fetchOrders, fetchTradeHistories, type OrderItem } from "@/lib/api/trade";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils/cs";
import { X } from "lucide-react";

/* ────────────────── Types ────────────────── */

export type OrderHistoryMode = "mock" | "trade";
export type HistoryTab = "pending" | "orders"; // pending: 미체결, orders: 체결

export type OrderHistoryRow = {
  id: number;
  date: string | null;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number | null;
  price: number | null;
  totalAmount: number | null;
  fee: number | null;
  status: string;
};

type CursorPage<T> = {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
};

type UserOrderHistoryProps = {
  mode?: OrderHistoryMode;
  onClose?: () => void;
  showCloseButton?: boolean;
};

// CursorPage helper is no longer needed as trade.ts provides parseCursorResponse and parseArrayResponse

const formatStatus = (status: string) => {
  if (status === "PENDING") return "대기중";
  if (status === "PARTIALLY_FILLED") return "부분체결";
  if (status === "COMPLETED") return "체결완료";
  if (status === "CANCELED") return "취소";
  return status;
};

/* ────────────────── Component ────────────────── */

export default function UserOrderHistory({
  mode = "trade",
  onClose,
  showCloseButton = false,
}: UserOrderHistoryProps) {
  const { alert, confirm, toast } = useFeedback();
  
  // Stores
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  
  // Mock Specific Stores
  const historyVersion = useMockWalletStore((state) => state.historyVersion);
  const isParticipated = useMockWalletStore((state) => state.isParticipated);
  const hasLoadedPortfolio = useMockWalletStore((state) => state.hasLoadedPortfolio);
  const ownerMemberId = useMockWalletStore((state) => state.ownerMemberId);
  const loadMockWallet = useMockWalletStore((state) => state.loadMockWallet);

  // States
  const [activeTab, setActiveTab] = useState<HistoryTab>("orders");
  const [rows, setRows] = useState<OrderHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pagination
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // SSE Refresh (Mock Only for now)
  useEffect(() => {
    if (mode !== "mock") return;
    const eventName = getNotificationSseBridgeEventName("NOTIFICATION_MOCK_ORDER_COMPLETED");
    const handleOrderCompleted = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener(eventName, handleOrderCompleted);
    return () => window.removeEventListener(eventName, handleOrderCompleted);
  }, [mode]);

  // Fetch Logic
  const loadRows = useCallback(async (isInitial = true) => {
    if (mode === "trade") {
      setRows([]);
      return;
    }

    if (!hasLoadedPortfolio || !isParticipated) {
      setRows([]);
      return;
    }

    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsFetchingMore(true);
    }
    
    setErrorMessage("");

    try {
      let content: OrderItem[] = [];
      let nextCursor: number | null = null;
      let hasMore = false;

      if (activeTab === "pending") {
        // 미체결 주문 조회 (배열 응답)
        const response = await fetchOpenOrders({
          assetType: "MOCK",
          size: 50, // 미체결은 보통 한 번에 다 보여주거나 넉넉히 가져옴
        });
        content = response;
      } else {
        // 전체/체결 주문 조회 (status 필터 제거하여 500 에러 방지)
        const response = await fetchOrders({
          assetType: "MOCK",
          size: 20,
          cursorId: !isInitial ? nextCursorId : null,
        });
        content = response.content;
        nextCursor = response.nextCursorId;
        hasMore = response.hasNext;
      }

      // Mapping API response (OrderItem or similar) to OrderHistoryRow
      const mappedContent: OrderHistoryRow[] = content.map((item: any) => {
        return {
          id: item.orderId || item.tradeId || item.id,
          date: item.executedAt || item.orderedAt || item.date,
          symbol: item.symbol,
          side: item.side,
          // 주문 내역에서는 사용자가 원래 주문했던 수량과 가격을 보여주는 것이 직관적입니다.
          quantity: item.orderQuantity ?? item.quantity ?? item.filledQuantity ?? 0,
          price: item.orderPrice ?? item.price ?? item.avgFilledPrice ?? 0,
          // 금액과 수수료는 실제 체결된 결과(executed)를 보여줍니다. (취소 시 0)
          totalAmount: item.executedAmount ?? item.totalAmount ?? item.orderAmount ?? 0,
          fee: item.totalFee ?? item.fee ?? 0,
          status: item.orderStatus || item.status,
        };
      });

      if (isInitial) {
        setRows(mappedContent);
      } else {
        setRows((prev) => [...prev, ...mappedContent]);
      }
      
      setNextCursorId(nextCursor);
      setHasNext(hasMore);
    } catch (error) {
      console.error("UserOrderHistory loadRows failed:", error);
      setErrorMessage("데이터를 불러오지 못했습니다.");
      if (isInitial) setRows([]);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [mode, activeTab, hasLoadedPortfolio, isParticipated, nextCursorId]);

  // Infinite Scroll Trigger (Desktop Only)
  useEffect(() => {
    // 모바일에서는 20개까지만 보여주기 위해 무한 스크롤 비활성화
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isFetchingMore && !isLoading) {
          void loadRows(false);
        }
      },
      { threshold: 0.1, root: scrollContainerRef.current }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasNext, isFetchingMore, isLoading, loadRows]);

  useEffect(() => {
    void loadRows(true);
  }, [activeTab, historyVersion, hasLoadedPortfolio, isParticipated, refreshKey, mode]);

  // Cancel Logic (Mock Only for now)
  const handleCancelOrder = async (orderId: number) => {
    if (!(await confirm("해당 주문을 취소하시겠습니까?"))) return;
    try {
      setCancelingOrderId(orderId);
      await cancelOrder(orderId, "MOCK");
      if (ownerMemberId !== null) await loadMockWallet(ownerMemberId, true);
      setRefreshKey((c) => c + 1);
      toast({ title: "주문 취소 완료", tone: "success" });
    } catch {
      await alert("취소 실패");
    } finally {
      setCancelingOrderId(null);
    }
  };

  const getBaseAsset = (symbol: string) => coinMetaList.find(c => c.symbol === symbol)?.baseAsset ?? symbol;
  const quoteAsset = coinMetaList.find(c => c.symbol === selectedCoin)?.quoteAsset ?? "USDT";
  
  const bgMain = "bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100";
  const theadBg = "bg-slate-50 dark:bg-gray-900 text-slate-500 dark:text-gray-500";
  const borderSub = "border-gray-100 dark:border-gray-700";
  const tbodyDivide = "divide-gray-100 dark:divide-gray-700 text-slate-700 dark:text-gray-300";
  const rowHover = "hover:bg-slate-50 dark:hover:bg-gray-700/50";
  const textMuted = "text-slate-400 dark:text-gray-500";
  const textQty = "text-slate-600 dark:text-gray-400";
  const textAmount = "text-slate-900 dark:text-gray-100";
  const textFee = "text-slate-400 dark:text-gray-500";
  const statusBadge = "bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400";
  const btnCancel = "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600";
  const isDark = useUIStore((state) => state.isDarkMode);

  return (
    <section className={cn("flex flex-col h-full overflow-hidden", bgMain)}>
      {/* Tabs */}
      <div className="shrink-0 px-6 py-2 border-b border-gray-50">
        <Tabs
          tabs={[
            { label: "체결 주문", value: "orders" },
            { label: "미체결 주문", value: "pending" },
          ]}
          activeTab={activeTab}
          onChange={(v) => setActiveTab(v as HistoryTab)}
          fullWidth={false}
          size="sm"
          variant="plain"
          mode={isDark ? "dark" : "light"}
        />
      </div>

      {/* Content - internal scroll for Bottom Sheet */}
      <div className="flex-1 min-h-0 overflow-auto bg-white dark:bg-gray-800 scrollbar-light" ref={scrollContainerRef}>
        {rows.length > 0 ? (
          <table className="w-full min-w-max text-[11px] text-left border-separate border-spacing-0 whitespace-nowrap">
            <thead className={`sticky top-0 z-10 font-bold uppercase tracking-tighter ${theadBg}`}>
              <tr>
                <th className={`py-2 px-6 border-b ${borderSub}`}>주문일시</th>
                <th className={`py-2 px-6 border-b ${borderSub}`}>자산</th>
                <th className={`py-2 px-6 border-b ${borderSub} text-center`}>구분</th>
                <th className={`py-2 px-6 border-b ${borderSub} text-right`}>수량</th>
                <th className={`py-2 px-6 border-b ${borderSub} text-right`}>가격({quoteAsset})</th>
                <th className={`py-2 px-6 border-b ${borderSub} text-right`}>금액({quoteAsset})</th>
                <th className={`py-2 px-6 border-b ${borderSub} text-right`}>수수료({quoteAsset})</th>
                <th className={`py-2 px-6 border-b ${borderSub} text-center`}>상태</th>
                {activeTab === "pending" && <th className={`py-2 px-6 border-b ${borderSub} text-center`}>관리</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${tbodyDivide}`}>
              {rows.map((row) => (
                <tr key={row.id} className={`transition-colors ${rowHover}`}>
                  <td className={`py-3 lg:py-2 px-6 ${textMuted}`}>{formatDateTime(row.date)}</td>
                  <td className="py-2 px-6 font-black">{getBaseAsset(row.symbol)}</td>
                  <td className={cn("py-2 px-6 text-center font-bold", row.side === "BUY" ? "text-[#fb2c36]" : "text-[#0058FF]")}>
                    {row.side === "BUY" ? "매수" : "매도"}
                  </td>
                  <td className={`py-2 px-6 text-right tabular-nums ${textQty}`}>
                    {formatAssetNumber(row.quantity, { smallMaxFractionDigits: 8, fallback: "-" })}
                  </td>
                  <td className="py-2 px-6 text-right tabular-nums font-bold">
                    {row.price && row.price !== 0 ? formatAssetNumber(row.price) : "시장가"}
                  </td>
                  <td className={`py-2 px-6 text-right tabular-nums font-black ${textAmount}`}>
                    {formatAssetNumber(row.totalAmount)}
                  </td>
                  <td className={`py-2 px-6 text-right tabular-nums ${textFee}`}>
                    {formatAssetNumber(row.fee, { smallMaxFractionDigits: 8 })}
                  </td>
                  <td className="py-2 px-6 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusBadge}`}>
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  {activeTab === "pending" && (
                    <td className="py-2 px-6 text-center">
                      <button
                        onClick={() => handleCancelOrder(row.id)}
                        disabled={cancelingOrderId === row.id}
                        className={cn(
                          "rounded px-2 py-1 text-[10px] font-bold transition-all",
                          btnCancel
                        )}
                      >
                        {cancelingOrderId === row.id ? "..." : "취소"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-20 px-4 text-center">
            {mode === "trade" ? (
              <p className="text-sm font-bold text-gray-500">실전 주문내역은 아직 연결 전입니다.</p>
            ) : !hasLoadedPortfolio ? (
              <p className="text-sm font-bold text-gray-500 animate-pulse">Loading...</p>
            ) : !isParticipated ? (
              <p className="text-sm font-bold text-gray-500">모의투자 계좌를 생성하면 내역이 표시됩니다.</p>
            ) : isLoading ? (
              <p className="text-sm font-bold text-gray-500 animate-pulse">데이터 로딩 중...</p>
            ) : errorMessage ? (
              <p className="text-sm font-bold text-red-400">{errorMessage}</p>
            ) : (
              <p className="text-sm font-bold text-gray-600">내역이 없습니다.</p>
            )}
          </div>
        )}
        
        {rows.length > 0 && (isFetchingMore || (hasNext && typeof window !== "undefined" && window.innerWidth >= 1024)) && (
          <div className="py-4 flex justify-center">
            {isFetchingMore ? (
              <p className="text-xxs font-bold text-gray-400 animate-pulse">불러오는 중...</p>
            ) : hasNext ? (
              <div ref={loadMoreRef} className="h-4 w-full" />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
