"use client";

import { type RefObject } from "react";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import { formatDateTime } from "@/lib/utils/date";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";

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

const formatNumber = (value: number | null | undefined) => {
  return formatAssetNumber(value, { fallback: "-" });
};

const formatStatus = (status: string) => {
  if (status === "PENDING") return "대기중";
  if (status === "PARTIALLY_FILLED") return "부분체결";
  if (status === "COMPLETED") return "체결완료";
  if (status === "CANCELED") return "취소";
  return status;
};

export default function UserOrderHistory({
  mode = "trade",
  historyTab = "filled",
  selectedOrderType = "all",
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
  const showCancelColumn =
    mode === "mock" &&
    historyTab === "unfilled" &&
    typeof onCancelOrder === "function";

  const columnCount = showCancelColumn ? 9 : 8;
  const selectedCoinMeta = coinMetaList.find((coin) => coin.symbol === selectedCoin);
  const quoteAssetName = selectedCoinMeta?.quoteAsset;

  const formatAssetName = (symbol: string) => {
    const coinMeta = coinMetaList.find((coin) => coin.symbol === symbol);

    return coinMeta?.baseAsset ?? symbol;
  };

  const getHeaderLabel = (label: string) => {
    return quoteAssetName ? `${label}(${quoteAssetName})` : label;
  };

  return (
    <footer className="bg-white border border-gray-200 flex flex-col mb-10 w-full shrink-0 p-6">
      <Tabs
        activeTab={historyTab}
        onChange={(value) => onHistoryTabChange?.(value as HistoryTab)}
        fullWidth={false}
        tabs={[
          { label: "체결 주문", value: "filled" },
          { label: "미체결 주문", value: "unfilled" },
        ]}
      />

      <div className="pt-6">
        <div className="mb-4">
          <Select
            options={ORDER_OPTIONS}
            value={selectedOrderType}
            onChange={(value) => onOrderTypeChange?.(value as OrderFilter)}
            size="sm"
          />
        </div>

        <div
          ref={scrollContainerRef}
          className="h-64 w-full overflow-x-auto overflow-y-auto border-t border-gray-200"
        >
          <table className="w-full text-[11px] whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
              <tr>
                <th className="py-2.5 px-3 text-center">주문일시</th>
                <th className="py-2.5 px-3 text-center">자산</th>
                <th className="py-2.5 px-3 text-center">구분</th>
                <th className="py-2.5 px-3 text-right">수량</th>
                <th className="py-2.5 px-3 text-right">{getHeaderLabel("가격")}</th>
                <th className="py-2.5 px-3 text-right">{getHeaderLabel("금액")}</th>
                <th className="py-2.5 px-3 text-right">{getHeaderLabel("수수료")}</th>
                <th className="py-2.5 px-3 text-center">상태</th>
                {showCancelColumn ? (
                  <th className="py-2.5 px-3 text-center">관리</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {mode !== "mock" ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-center text-gray-400 font-bold">
                    실전 주문내역은 아직 연결 전입니다.
                  </td>
                </tr>
              ) : !hasLoadedPortfolio ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-center text-gray-400 font-bold">
                    지갑 상태 확인 중...
                  </td>
                </tr>
              ) : !isParticipated ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-center text-gray-400 font-bold">
                    모의투자 계좌를 생성하면 내역이 표시됩니다.
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-center text-gray-400 font-bold">
                    주문/거래내역 불러오는 중...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-center text-red-400 font-bold">
                    {errorMessage}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-center text-gray-400 font-bold">
                    {historyTab === "unfilled"
                      ? "미체결 주문이 없습니다."
                      : "거래내역이 없습니다."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-3 text-center text-gray-500">
                      {formatDateTime(row.date)}
                    </td>

                    <td className="py-3 px-3 text-center font-black">
                      {formatAssetName(row.symbol)}
                    </td>

                    <td
                      className={`py-3 px-3 text-center font-bold ${
                        row.side === "BUY"
                          ? "text-trade-buy"
                          : "text-trade-sell"
                      }`}
                    >
                      {row.side === "BUY" ? "매수" : "매도"}
                    </td>

                    <td className="py-3 px-3 text-right font-medium">
                      {formatNumber(row.quantity)}
                    </td>

                    <td className="py-3 px-3 text-right font-medium">
                      {formatNumber(row.price)}
                    </td>

                    <td className="py-3 px-3 text-right font-black text-gray-900">
                      {formatNumber(row.totalAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-medium">
                      {formatNumber(row.fee)}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-gray-700">
                      {formatStatus(row.status)}
                    </td>

                    {showCancelColumn ? (
                      <td className="py-3 px-3 text-center">
                        <Button
                          type="button"
                          onClick={() => onCancelOrder?.(row.id)}
                          disabled={cancelingOrderId === row.id}
                          size="sm"
                          variant="white"
                        >
                          {cancelingOrderId === row.id ? "취소 중..." : "주문취소"}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {rows.length > 0 && (isFetchingMore || hasNext) ? (
            <div className="py-4">
              {isFetchingMore ? (
                <p className="text-center text-xxs font-bold text-gray-400">
                  {historyTab === "unfilled"
                    ? "미체결 주문을 더 불러오는 중..."
                    : "체결 주문을 더 불러오는 중..."}
                </p>
              ) : hasNext ? (
                <div ref={loadMoreRef} className="h-6" aria-hidden="true" />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
