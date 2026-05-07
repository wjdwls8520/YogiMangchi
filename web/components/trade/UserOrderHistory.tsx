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
import { cn } from "@/lib/utils/cs";

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
      const mappedContent: OrderHistoryRow[] = page.content.map((item: any) => ({
        id: item.orderId,
        date: item.orderedAt || item.date,
        symbol: item.symbol,
        side: item.side,
        quantity: item.orderQuantity ?? item.quantity,
        price: item.orderPrice ?? item.price,
        totalAmount: item.executedAmount ?? item.orderAmount ?? item.totalAmount,
        fee: item.totalFee ?? item.fee,
        status: item.orderStatus ?? item.status,
      }));

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

  return (
    <section className="flex h-full flex-col bg-[#161A1E]">
      {/* Tabs */}
      <div className="shrink-0 px-4 py-2">
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
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar" ref={scrollContainerRef}>
        {rows.length > 0 ? (
          <table className="w-full text-[11px] text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-[#1A1F26] text-gray-500 font-bold uppercase tracking-tighter">
              <tr>
                <th className="py-2 px-4 border-b border-white/5">주문일시</th>
                <th className="py-2 px-4 border-b border-white/5">자산</th>
                <th className="py-2 px-4 border-b border-white/5 text-center">구분</th>
                <th className="py-2 px-4 border-b border-white/5 text-right">수량</th>
                <th className="py-2 px-4 border-b border-white/5 text-right">가격({quoteAsset})</th>
                <th className="py-2 px-4 border-b border-white/5 text-right">금액({quoteAsset})</th>
                <th className="py-2 px-4 border-b border-white/5 text-right">수수료({quoteAsset})</th>
                <th className="py-2 px-4 border-b border-white/5 text-center">상태</th>
                {activeTab === "pending" && <th className="py-2 px-4 border-b border-white/5 text-center">관리</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-4 text-gray-500">{formatDateTime(row.date)}</td>
                  <td className="py-2 px-4 font-black">{getBaseAsset(row.symbol)}</td>
                  <td className={cn("py-2 px-4 text-center font-bold", row.side === "BUY" ? "text-[#fb2c36]" : "text-[#0058FF]")}>
                    {row.side === "BUY" ? "매수" : "매도"}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-gray-300">
                    {formatAssetNumber(row.quantity)}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums font-bold">
                    {row.price ? formatAssetNumber(row.price) : "시장가"}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums font-black text-gray-100">
                    {formatAssetNumber(row.totalAmount)}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-gray-400">
                    {formatAssetNumber(row.fee)}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-400">
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  {activeTab === "pending" && (
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleCancelOrder(row.id)}
                        disabled={cancelingOrderId === row.id}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
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
        
        {rows.length > 0 && (isFetchingMore || hasNext) && (
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
