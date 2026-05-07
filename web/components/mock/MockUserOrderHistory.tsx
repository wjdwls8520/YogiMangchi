"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { cancelOrder } from "@/lib/api/trade";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { useTickerStore } from "@/stores/useTickerStore";
import { formatDateTime } from "@/lib/utils/date";
import { formatAssetNumber } from "@/lib/utils/number";
import Tabs from "@/components/ui/Tabs";
import { cn } from "@/lib/utils/cs";

/* ────────────────── types ────────────────── */

type OpenOrderItem = {
  orderId: number;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: string;
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
};

type CursorPage<T> = {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
};

type ActivityTab = "pending" | "orders";

/* ────────────────── helpers ────────────────── */

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

/* ────────────────── component ────────────────── */

export default function MockUserOrderHistory() {
  const { alert, confirm, toast } = useFeedback();
  const historyVersion = useMockWalletStore((state) => state.historyVersion);
  const isParticipated = useMockWalletStore((state) => state.isParticipated);
  const hasLoadedPortfolio = useMockWalletStore((state) => state.hasLoadedPortfolio);
  const ownerMemberId = useMockWalletStore((state) => state.ownerMemberId);
  const loadMockWallet = useMockWalletStore((state) => state.loadMockWallet);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const selectedCoin = useTickerStore((state) => state.selectedCoin);

  const [activeTab, setActiveTab] = useState<ActivityTab>("pending");
  const [rows, setRows] = useState<OpenOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pagination
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // SSE Refresh
  useEffect(() => {
    const eventName = getNotificationSseBridgeEventName("NOTIFICATION_MOCK_ORDER_COMPLETED");
    const handleOrderCompleted = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener(eventName, handleOrderCompleted);
    return () => window.removeEventListener(eventName, handleOrderCompleted);
  }, []);

  // Fetch Logic
  useEffect(() => {
    if (!hasLoadedPortfolio || !isParticipated) {
      setRows([]);
      return;
    }

    const loadRows = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setNextCursorId(null);
      setHasNext(false);

      try {
        const params = new URLSearchParams();
        params.set("assetType", "MOCK");
        params.set("size", "20");

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

        const page = getCursorPage<OpenOrderItem>(payload);
        setRows(page.content);
        setNextCursorId(page.nextCursorId);
        setHasNext(page.hasNext);
      } catch (error) {
        setErrorMessage("데이터 로딩 실패");
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRows();
  }, [activeTab, historyVersion, hasLoadedPortfolio, isParticipated, refreshKey]);

  // Cancel Logic
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
          activeTab={activeTab === "pending" ? "pending" : "orders"}
          onChange={(v) => setActiveTab(v as ActivityTab)}
          fullWidth={false}
          size="sm"
          variant="plain"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar" ref={scrollContainerRef}>
        <table className="w-full text-[11px] text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-[#1A1F26] text-gray-500 font-bold uppercase tracking-tighter">
            <tr>
              <th className="py-2 px-4 border-b border-white/5">주문일시</th>
              <th className="py-2 px-4 border-b border-white/5">자산</th>
              <th className="py-2 px-4 border-b border-white/5">구분</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">수량</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">가격({quoteAsset})</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">금액({quoteAsset})</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">수수료({quoteAsset})</th>
              <th className="py-2 px-4 border-b border-white/5 text-center">상태</th>
              {activeTab === "pending" && <th className="py-2 px-4 border-b border-white/5 text-center">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading && rows.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-500 animate-pulse">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-600 font-bold">내역이 없습니다.</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.orderId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2 px-4 text-gray-500">{formatDateTime(row.orderedAt)}</td>
                  <td className="py-2 px-4 font-black text-gray-200">{getBaseAsset(row.symbol)}</td>
                  <td className={cn("py-2 px-4 font-bold", row.side === "BUY" ? "text-[#fb2c36]" : "text-[#0058FF]")}>
                    {row.side === "BUY" ? "매수" : "매도"}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-gray-300">
                    {formatAssetNumber(row.orderQuantity)}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums font-bold">
                    {row.orderPrice ? formatAssetNumber(row.orderPrice) : "시장가"}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-gray-200 font-black">
                    {formatAssetNumber(row.executedAmount ?? row.orderAmount)}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-gray-400">
                    {formatAssetNumber(row.totalFee)}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-400">
                      {row.orderStatus}
                    </span>
                  </td>
                  {activeTab === "pending" && (
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleCancelOrder(row.orderId)}
                        disabled={cancelingOrderId === row.orderId}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        {cancelingOrderId === row.orderId ? "..." : "취소"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
