"use client";

import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import { formatDateTime } from "@/lib/utils/date";

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
};

const ORDER_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "매수", value: "buy" },
  { label: "매도", value: "sell" },
];

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return value.toLocaleString();
};

const formatAssetName = (symbol: string) => {
  return symbol.replace("USDT", "");
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
}: UserOrderHistoryProps) {
  const showCancelColumn =
    mode === "mock" &&
    historyTab === "unfilled" &&
    typeof onCancelOrder === "function";

  const columnCount = showCancelColumn ? 9 : 8;

  return (
    <footer className="bg-white border border-gray-200 flex flex-col mb-10 w-full shrink-0 p-6">
      <Tabs
        activeTab={historyTab}
        onChange={(value) => onHistoryTabChange?.(value as HistoryTab)}
        fullWidth={false}
        tabs={[
          { label: "미체결 주문", value: "unfilled" },
          { label: "체결 주문", value: "filled" },
        ]}
      />

      <div className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <Select
            options={ORDER_OPTIONS}
            value={selectedOrderType}
            onChange={(value) => onOrderTypeChange?.(value as OrderFilter)}
            size="sm"
          />

          {showCancelColumn ? (
            <span className="text-xs font-bold text-gray-400">
              미체결 주문만 취소할 수 있습니다.
            </span>
          ) : null}
        </div>

        <div className="w-full overflow-x-auto border-t border-gray-200">
          <table className="w-full text-[11px] text-center whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
              <tr>
                <th className="py-2.5 px-3">주문일시</th>
                <th className="py-2.5 px-3 text-left">자산</th>
                <th className="py-2.5 px-3">구분</th>
                <th className="py-2.5 px-3 text-right">수량</th>
                <th className="py-2.5 px-3 text-right">가격</th>
                <th className="py-2.5 px-3 text-right">금액</th>
                <th className="py-2.5 px-3 text-right">수수료</th>
                <th className="py-2.5 px-3">상태</th>
                {showCancelColumn ? (
                  <th className="py-2.5 px-3">관리</th>
                ) : null}
              </tr>
            </thead>

            <tbody>
              {mode !== "mock" ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-gray-400 font-bold">
                    실전 주문내역은 아직 연결 전입니다.
                  </td>
                </tr>
              ) : !hasLoadedPortfolio ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-gray-400 font-bold">
                    지갑 상태 확인 중...
                  </td>
                </tr>
              ) : !isParticipated ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-gray-400 font-bold">
                    모의투자 계좌를 생성하면 내역이 표시됩니다.
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-gray-400 font-bold">
                    주문/거래내역 불러오는 중...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-red-400 font-bold">
                    {errorMessage}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-12 text-gray-400 font-bold">
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
                    <td className="py-3 px-3 text-gray-500">
                      {formatDateTime(row.date)}
                    </td>

                    <td className="py-3 px-3 text-left font-black">
                      {formatAssetName(row.symbol)}
                    </td>

                    <td
                      className={`py-3 px-3 font-bold ${
                        row.side === "BUY"
                          ? "text-[#E12343]"
                          : "text-[#1763B6]"
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

                    <td className="py-3 px-3 font-bold text-gray-700">
                      {formatStatus(row.status)}
                    </td>

                    {showCancelColumn ? (
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onCancelOrder?.(row.id)}
                          disabled={cancelingOrderId === row.id}
                          className="min-w-[64px] border border-gray-300 px-2 py-1 text-[10px] font-bold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                        >
                          {cancelingOrderId === row.id ? "취소 중..." : "주문취소"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </footer>
  );
}
