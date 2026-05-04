"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import UserOrderHistory, {
  type HistoryTab,
  type OrderFilter,
  type UserOrderHistoryRow,
} from "@/components/trade/UserOrderHistory";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { cancelOrder } from "@/lib/api/trade";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getCursorPage = <T,>(payload: unknown): CursorPage<T> => {
  if (!isRecord(payload)) {
    return {
      content: [],
      nextCursorId: null,
      hasNext: false,
    };
  }

  const data = isRecord(payload.data) ? payload.data : null;
  const nestedData = data && isRecord(data.data) ? data.data : null;

  const source =
    Array.isArray(payload.content) || "nextCursorId" in payload || "hasNext" in payload
      ? payload
      : data &&
          (Array.isArray(data.content) || "nextCursorId" in data || "hasNext" in data)
        ? data
        : nestedData;

  if (!source || !isRecord(source)) {
    return {
      content: [],
      nextCursorId: null,
      hasNext: false,
    };
  }

  return {
    content: Array.isArray(source.content) ? (source.content as T[]) : [],
    nextCursorId:
      typeof source.nextCursorId === "number" ? source.nextCursorId : null,
    hasNext: source.hasNext === true,
  };
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

const FILLED_ORDER_PAGE_SIZE = 10;
const OPEN_ORDER_PAGE_SIZE = 5;

export default function MockUserOrderHistory() {
  const { alert, confirm, toast } = useFeedback();
  const historyVersion = useMockWalletStore((state) => state.historyVersion);
  const isParticipated = useMockWalletStore((state) => state.isParticipated);
  const hasLoadedPortfolio = useMockWalletStore(
    (state) => state.hasLoadedPortfolio
  );
  const ownerMemberId = useMockWalletStore((state) => state.ownerMemberId);
  const loadMockWallet = useMockWalletStore((state) => state.loadMockWallet);

  const [historyTab, setHistoryTab] = useState<HistoryTab>("filled");
  const [selectedOrderType, setSelectedOrderType] =
    useState<OrderFilter>("all");
  const [rows, setRows] = useState<UserOrderHistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const buildBaseParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("assetType", "MOCK");

    if (selectedOrderType === "buy") {
      params.set("side", "BUY");
    }

    if (selectedOrderType === "sell") {
      params.set("side", "SELL");
    }

    return params;
  }, [selectedOrderType]);

  const mapHistoryRows = useCallback((orders: OpenOrderItem[]) => {
    return orders.map((item) => ({
      id: item.orderId,
      date: item.executedAt || item.orderedAt,
      symbol: item.symbol,
      side: item.side,
      quantity: item.filledQuantity ?? item.orderQuantity,
      price: item.avgFilledPrice ?? item.orderPrice,
      totalAmount: item.executedAmount ?? item.orderAmount,
      fee: item.totalFee,
      status: item.orderStatus,
    }));
  }, []);

  const mapOpenOrderRows = useCallback((orders: OpenOrderItem[]) => {
    return orders.map((item) => ({
      id: item.orderId,
      date: item.orderedAt,
      symbol: item.symbol,
      side: item.side,
      quantity: item.orderQuantity,
      price: item.orderPrice ?? item.avgFilledPrice,
      totalAmount: item.orderAmount ?? item.executedAmount,
      fee: item.totalFee,
      status: item.orderStatus,
    }));
  }, []);

  useEffect(() => {
    if (!hasLoadedPortfolio) {
      return;
    }

    if (!isParticipated) {
      setRows([]);
      setErrorMessage("");
      setIsLoading(false);
      setNextCursorId(null);
      setHasNext(false);
      setIsFetchingMore(false);
      return;
    }

    const loadRows = async () => {
      setIsLoading(true);
      setErrorMessage("");
      setNextCursorId(null);
      setHasNext(false);
      setIsFetchingMore(false);

      try {
        const params = buildBaseParams();

        let url = "";

        if (historyTab === "unfilled") {
          params.set("size", String(OPEN_ORDER_PAGE_SIZE));
          url = `http://localhost:8080/api/v1/spot/mock/orders/open?${params.toString()}`;
        } else {
          params.set("status", "COMPLETED");
          params.set("size", String(FILLED_ORDER_PAGE_SIZE));
          url = `http://localhost:8080/api/v1/spot/mock/orders?${params.toString()}`;
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

          if (isNoMockWalletMessage(message)) {
            setRows([]);
            setErrorMessage("");
            return;
          }

          // 메시지 인코딩이 깨져도 실제 지갑 상태를 다시 확인해서
          // 미참여 사용자라면 에러 대신 빈 상태로 처리한다.
          if (ownerMemberId !== null) {
            const walletResult = await loadMockWallet(ownerMemberId, true);

            if (walletResult.status === "not_participating") {
              setRows([]);
              setErrorMessage("");
              return;
            }
          }

          throw new Error(message || "주문/거래내역을 불러오지 못했습니다.");
        }

        if (historyTab === "unfilled") {
          const page = getCursorPage<OpenOrderItem>(payload);

          setRows(mapOpenOrderRows(page.content));
          setNextCursorId(page.nextCursorId);
          setHasNext(page.hasNext);
        } else {
          const page = getCursorPage<OpenOrderItem>(payload);

          setRows(mapHistoryRows(page.content));
          setNextCursorId(page.nextCursorId);
          setHasNext(page.hasNext);
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
    historyTab,
    selectedOrderType,
    historyVersion,
    hasLoadedPortfolio,
    isParticipated,
    refreshKey,
    ownerMemberId,
    loadMockWallet,
    buildBaseParams,
    mapHistoryRows,
    mapOpenOrderRows,
  ]);

  useEffect(() => {
    if (isLoading || isFetchingMore) return;
    if (!hasNext || nextCursorId === null) return;
    if (!scrollContainerRef.current) return;
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) return;

        setIsFetchingMore(true);

        const loadMoreRows = async () => {
          try {
            const params = buildBaseParams();
            params.set(
              "size",
              String(
                historyTab === "unfilled"
                  ? OPEN_ORDER_PAGE_SIZE
                  : FILLED_ORDER_PAGE_SIZE
              )
            );
            params.set("cursorId", String(nextCursorId));

            if (historyTab === "filled") {
              params.set("status", "COMPLETED");
            }

            const path =
              historyTab === "unfilled"
                ? "spot/mock/orders/open"
                : "spot/mock/orders";

            const response = await fetch(
              `http://localhost:8080/api/v1/${path}?${params.toString()}`,
              {
                method: "GET",
                credentials: "include",
              }
            );

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
              console.error(
                historyTab === "unfilled"
                  ? "미체결 주문 추가 조회 실패:"
                  : "체결 주문 추가 조회 실패:",
                extractErrorMessage(payload) || "요청 실패"
              );
              setHasNext(false);
              return;
            }

            const page = getCursorPage<OpenOrderItem>(payload);

            setRows((prev) => [
              ...prev,
              ...(historyTab === "unfilled"
                ? mapOpenOrderRows(page.content)
                : mapHistoryRows(page.content)),
            ]);
            setNextCursorId(page.nextCursorId);
            setHasNext(page.hasNext);
          } catch (error) {
            console.error(
              historyTab === "unfilled"
                ? "미체결 주문 추가 조회 실패:"
                : "체결 주문 추가 조회 실패:",
              error
            );
            setHasNext(false);
          } finally {
            setIsFetchingMore(false);
          }
        };

        void loadMoreRows();
      },
      {
        root: scrollContainerRef.current,
        rootMargin: historyTab === "unfilled" ? "0px" : "120px 0px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [
    historyTab,
    selectedOrderType,
    hasNext,
    nextCursorId,
    isLoading,
    isFetchingMore,
    buildBaseParams,
    mapHistoryRows,
    mapOpenOrderRows,
  ]);

  const handleCancelOrder = async (orderId: number) => {
    const confirmed = await confirm("해당 미체결 주문을 취소하시겠습니까?");

    if (!confirmed) {
      return;
    }

    try {
      setCancelingOrderId(orderId);
      setErrorMessage("");

      await cancelOrder(orderId, "MOCK");

      if (ownerMemberId !== null) {
        await loadMockWallet(ownerMemberId, true);
      }

      setRefreshKey((current) => current + 1);
      toast({
        title: "주문이 취소되었습니다.",
        tone: "success",
      });
    } catch (error) {
      console.error("미체결 주문 취소 실패:", error);
      await alert("주문 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCancelingOrderId(null);
    }
  };

  return (
    <UserOrderHistory
      mode="mock"
      historyTab={historyTab}
      selectedOrderType={selectedOrderType}
      rows={rows}
      isLoading={isLoading}
      errorMessage={errorMessage}
      hasLoadedPortfolio={hasLoadedPortfolio}
      isParticipated={isParticipated}
      hasNext={hasNext}
      isFetchingMore={isFetchingMore}
      loadMoreRef={loadMoreRef}
      scrollContainerRef={scrollContainerRef}
      onHistoryTabChange={setHistoryTab}
      onOrderTypeChange={setSelectedOrderType}
      onCancelOrder={handleCancelOrder}
      cancelingOrderId={cancelingOrderId}
    />
  );
}
