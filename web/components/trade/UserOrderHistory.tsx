"use client";

import { type RefObject, useState } from "react";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import { formatDateTime } from "@/lib/utils/date";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { cn } from "@/lib/utils/cs";

export type HistoryTab = "unfilled" | "filled";
export type OrderFilter = "all" | "buy" | "sell";

export type UserOrderHistoryRow = {
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

type UserOrderHistoryProps = {
  mode?: "mock" | "trade";
  historyTab?: HistoryTab;
  selectedOrderType?: OrderFilter;
  rows?: UserOrderHistoryRow[];
  isLoading?: boolean;
  errorMessage?: string;
  hasLoadedPortfolio?: boolean;
  isParticipated?: boolean;
  onHistoryTabChange?: (nextTab: HistoryTab) => void;
  onOrderTypeChange?: (nextFilter: OrderFilter) => void;
  onCancelOrder?: (orderId: number) => void | Promise<void>;
  cancelingOrderId?: number | null;
  hasNext?: boolean;
  isFetchingMore?: boolean;
  loadMoreRef?: RefObject<HTMLDivElement | null>;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

const ORDER_OPTIONS = [
  { label: "구분", value: "all" },
  { label: "매수", value: "buy" },
  { label: "매도", value: "sell" },
];

const formatStatus = (status: string) => {
  if (status === "PENDING") return "대기중";
  if (status === "PARTIALLY_FILLED") return "부분체결";
  if (status === "COMPLETED") return "체결완료";
  if (status === "CANCELED") return "취소";
  return status;
};

export default function UserOrderHistory({
  mode = "trade",
  historyTab: initialHistoryTab = "filled",
  selectedOrderType: initialOrderType = "all",
  rows = [],
  isLoading = false,
  errorMessage = "",
  hasLoadedPortfolio = true,
  isParticipated = true,
  onHistoryTabChange,
  onOrderTypeChange,
  onCancelOrder,
  cancelingOrderId = null,
  hasNext = false,
  isFetchingMore = false,
  loadMoreRef,
  scrollContainerRef,
}: UserOrderHistoryProps) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  
  const [internalTab, setInternalTab] = useState<HistoryTab>(initialHistoryTab);
  const [internalOrderType, setInternalOrderType] = useState<OrderFilter>(initialOrderType);

  const currentTab = onHistoryTabChange ? initialHistoryTab : internalTab;
  const currentOrderType = onOrderTypeChange ? initialOrderType : internalOrderType;

  const handleTabChange = (v: HistoryTab) => {
    setInternalTab(v);
    onHistoryTabChange?.(v);
  };

  const handleOrderTypeChange = (v: OrderFilter) => {
    setInternalOrderType(v);
    onOrderTypeChange?.(v);
  };
  
  const selectedCoinMeta = coinMetaList.find((coin) => coin.symbol === selectedCoin);
  const quoteAsset = selectedCoinMeta?.quoteAsset ?? "USDT";

  const getBaseAsset = (symbol: string) => coinMetaList.find(c => c.symbol === symbol)?.baseAsset ?? symbol;

  return (
    <section className="flex h-full flex-col bg-[#161A1E]">
      {/* Tabs */}
      <div className="shrink-0 px-4 py-2">
        <Tabs
          tabs={[
            { label: "체결 주문", value: "filled" },
            { label: "미체결 주문", value: "unfilled" },
          ]}
          activeTab={currentTab}
          onChange={(v) => handleTabChange(v as HistoryTab)}
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
              <th className="py-2 px-4 border-b border-white/5 text-center">구분</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">수량</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">가격({quoteAsset})</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">금액({quoteAsset})</th>
              <th className="py-2 px-4 border-b border-white/5 text-right">수수료({quoteAsset})</th>
              <th className="py-2 px-4 border-b border-white/5 text-center">상태</th>
              {currentTab === "unfilled" && <th className="py-2 px-4 border-b border-white/5 text-center">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-200">
            {mode === "trade" ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-500 font-bold">실전 주문내역은 아직 연결 전입니다.</td></tr>
            ) : !hasLoadedPortfolio ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-500 animate-pulse">Loading...</td></tr>
            ) : !isParticipated ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-500 font-bold">모의투자 계좌를 생성하면 내역이 표시됩니다.</td></tr>
            ) : isLoading && rows.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-500 animate-pulse">데이터 로딩 중...</td></tr>
            ) : errorMessage ? (
              <tr><td colSpan={9} className="py-10 text-center text-red-400 font-bold">{errorMessage}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="py-10 text-center text-gray-600 font-bold">내역이 없습니다.</td></tr>
            ) : (
              rows.map((row) => (
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
                  {currentTab === "unfilled" && (
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => onCancelOrder?.(row.id)}
                        disabled={cancelingOrderId === row.id}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        {cancelingOrderId === row.id ? "..." : "취소"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
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
