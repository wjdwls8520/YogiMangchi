"use client";

import { useEffect, useState } from "react";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

type UserOrderHistoryProps = {
  mode?: "mock" | "trade";
};

type HistoryTab = "unfilled" | "filled";
type OrderFilter = "all" | "buy" | "sell";

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

type TableRow = {
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

const ORDER_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "매수", value: "buy" },
  { label: "매도", value: "sell" },
];

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getCursorContent = <T,>(payload: unknown): T[] => {
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.content)) return payload.content as T[];

  const data = isRecord(payload.data) ? payload.data : null;
  if (data && Array.isArray(data.content)) return data.content as T[];

  const nestedData = data && isRecord(data.data) ? data.data : null;
  if (nestedData && Array.isArray(nestedData.content)) {
    return nestedData.content as T[];
  }

  return [];
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

const isNoMockWalletMessage = (message: string) => {
  return (
    message.includes("현재 참여중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("활성화된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.")
  );
};

export default function UserOrderHistory({
  mode = "trade",
}: UserOrderHistoryProps) {
  const { historyVersion, isParticipated, hasLoadedPortfolio } =
    useMockWalletStore();

  const [historyTab, setHistoryTab] = useState<HistoryTab>("filled");
  const [selectedOrderType, setSelectedOrderType] =
    useState<OrderFilter>("all");

  const [rows, setRows] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (mode !== "mock") {
      setRows([]);
      return;
    }

    // 지갑 상태 확인 전에는 대기
    if (!hasLoadedPortfolio) {
      return;
    }

    // 모의투자 계좌가 없으면 API를 때리지 않고 빈 상태로 처리
    if (!isParticipated) {
      setRows([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    const loadRows = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams();
        params.set("assetType", "MOCK");

        if (selectedOrderType === "buy") {
          params.set("side", "BUY");
        }

        if (selectedOrderType === "sell") {
          params.set("side", "SELL");
        }

        let url = "";

        if (historyTab === "unfilled") {
          url = `http://localhost:8080/api/v1/trade/orders/open?${params.toString()}`;
        } else {
          params.set("status", "COMPLETED");
          params.set("size", "20");
          url = `http://localhost:8080/api/v1/trade/orders?${params.toString()}`;
        }

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const message = extractErrorMessage(payload);

          if (response.status === 401 || response.status === 403) {
            setRows([]);
            setErrorMessage("로그인이 만료되었습니다. 다시 로그인해 주세요.");
            return;
          }

          // 백엔드가 계좌 없음도 400으로 주고 있어서 프론트에서 빈 상태 처리
          if (isNoMockWalletMessage(message)) {
            setRows([]);
            setErrorMessage("");
            return;
          }

          throw new Error(message || "주문/거래내역을 불러오지 못했습니다.");
        }

        if (historyTab === "unfilled") {
          const orders = getArrayContent<OpenOrderItem>(payload);

          setRows(
            orders.map((item) => ({
              id: item.orderId,
              date: item.orderedAt,
              symbol: item.symbol,
              side: item.side,
              quantity: item.orderQuantity,
              price: item.orderPrice ?? item.avgFilledPrice,
              totalAmount: item.orderAmount ?? item.executedAmount,
              fee: item.totalFee,
              status: item.orderStatus,
            }))
          );
        } else {
          const orders = getCursorContent<OpenOrderItem>(payload);

          setRows(
            orders.map((item) => ({
              id: item.orderId,
              date: item.executedAt || item.orderedAt,
              symbol: item.symbol,
              side: item.side,
              quantity: item.filledQuantity ?? item.orderQuantity,
              price: item.avgFilledPrice ?? item.orderPrice,
              totalAmount: item.executedAmount ?? item.orderAmount,
              fee: item.totalFee,
              status: item.orderStatus,
            }))
          );
        }
      } catch (error) {
        console.error("주문/거래내역 조회 실패:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "주문/거래내역을 불러오지 못했습니다."
        );
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRows();
  }, [
    mode,
    historyTab,
    selectedOrderType,
    historyVersion,
    hasLoadedPortfolio,
    isParticipated,
  ]);

  return (
    <footer className="bg-white border border-gray-200 flex flex-col mb-10 w-full shrink-0 p-6">
      <Tabs
        activeTab={historyTab}
        onChange={(value) => setHistoryTab(value as HistoryTab)}
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
            onChange={(value) => setSelectedOrderType(value as OrderFilter)}
            size="sm"
          />

          <button
            type="button"
            disabled
            className="h-9 px-3 text-xs font-bold border border-gray-300 rounded-none text-gray-400 cursor-not-allowed"
          >
            선택 주문취소
          </button>
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
              </tr>
            </thead>

            <tbody>
              {mode !== "mock" ? (
                <tr>
                  <td colSpan={8} className="py-12 text-gray-400 font-bold">
                    실전 주문내역은 아직 연결 전입니다.
                  </td>
                </tr>
              ) : !hasLoadedPortfolio ? (
                <tr>
                  <td colSpan={8} className="py-12 text-gray-400 font-bold">
                    지갑 상태 확인 중...
                  </td>
                </tr>
              ) : !isParticipated ? (
                <tr>
                  <td colSpan={8} className="py-12 text-gray-400 font-bold">
                    모의투자 계좌를 생성하면 내역이 표시됩니다.
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-gray-400 font-bold">
                    주문/거래내역 불러오는 중...
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={8} className="py-12 text-red-400 font-bold">
                    {errorMessage}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-gray-400 font-bold">
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
