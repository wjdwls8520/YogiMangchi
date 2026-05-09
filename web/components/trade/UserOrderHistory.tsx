"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Tabs from "@/components/ui/Tabs";
import { formatDateTime } from "@/lib/utils/date";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { cancelOrder } from "@/lib/api/trade";
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

/* ────────────────── Helpers ────────────────── */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getCursorPage = <T,>(payload: unknown): CursorPage<T> => {
  if (!isRecord(payload)) return { content: [], nextCursorId: null, hasNext: false };
  const data = isRecord(payload.data) ? payload.data : null;
  const source = data && isRecord(data.data) ? data.data : (isRecord(payload) ? payload : null);
  
  if (!source || !isRecord(source)) return { content: [], nextCursorId: null, hasNext: false };
  
  return {
    content: Array.isArray(source.content) ? (source.content as T[]) : [],
    nextCursorId: typeof source.nextCursorId === "number" ? source.nextCursorId : null,
    hasNext: source.hasNext === true,
  };
};

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
      const params = new URLSearchParams();
      params.set("assetType", "MOCK");
      params.set("size", "20");
      if (!isInitial && nextCursorId) {
        params.set("cursorId", nextCursorId.toString());
      }

      let url = "";
      if (activeTab === "pending") {
        url = `http://localhost:8080/api/v1/spot/mock/orders/open?${params.toString()}`;
      } else {
        params.set("status", "COMPLETED");
        url = `http://localhost:8080/api/v1/spot/mock/orders?${params.toString()}`;
      }

      const response = await fetch(url, { method: "GET", credentials: "include" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) throw new Error("데이터를 불러오지 못했습니다.");

      const page = getCursorPage<any>(payload);
      
      // Mapping API response to OrderHistoryRow
      const mappedContent: OrderHistoryRow[] = page.content.map((item: any) => {
        const isPending = item.orderStatus === "PENDING" || item.orderStatus === "PARTIALLY_FILLED" || item.status === "PENDING" || item.status === "PARTIALLY_FILLED";
        
        return {
          id: item.orderId || item.tradeId,
          date: item.executedAt || item.orderedAt || item.date,
          symbol: item.symbol,
          side: item.side,
          // 미체결일 때는 총 주문 수량(orderQuantity)을, 체결 완료 시에는 체결 수량(quantity/filledQuantity)을 우선함
          quantity: isPending ? (item.orderQuantity ?? item.quantity ?? item.filledQuantity) : (item.quantity ?? item.filledQuantity ?? item.orderQuantity),
          // 미체결일 때는 지정가(orderPrice)를, 체결 완료 시에는 체결가(price/avgFilledPrice)를 우선함
          price: isPending ? (item.orderPrice ?? item.price ?? item.avgFilledPrice) : (item.price ?? item.avgFilledPrice ?? item.orderPrice),
          totalAmount: item.totalAmount ?? item.executedAmount ?? item.orderAmount,
          fee: item.fee ?? item.totalFee,
          status: item.orderStatus ?? item.status,
        };
      });

      if (isInitial) {
        setRows(mappedContent);
      } else {
        setRows((prev) => [...prev, ...mappedContent]);
      }
      
      setNextCursorId(page.nextCursorId);
      setHasNext(page.hasNext);
    } catch (error) {
      setErrorMessage("데이터 로딩 실패");
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
