"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireVerifiedUser } from "@/hooks/useWithAuth";
import { getContestFuturesOrders } from "@/lib/api/contest-futures";
import { getFuturesOrders } from "@/lib/api/futures";
import { cn } from "@/lib/utils/cs";
import { formatDateTime } from "@/lib/utils/date";
import {
  formatFuturesOrderStatus,
  formatFuturesOrderType,
  formatFuturesPositionAction,
  formatFuturesPositionSide,
} from "@/lib/utils/futures";
import { formatAssetNumber } from "@/lib/utils/number";
import type {
  ContestFuturesOrderFilters,
  FuturesOrderItem,
  FuturesOrderStatus,
} from "@/types/futures";

type FuturesOrderListMode = "pending" | "orders" | "trades";

export type FuturesOrderListProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
  mode: FuturesOrderListMode;
  pageSize?: number;
  cancelingOrderId?: number | null;
  isTradingEnabled?: boolean;
  onCancelLimitOrder?: (orderId: number) => Promise<void>;
};

const DEFAULT_PAGE_SIZE = 20;

const MODE_CONFIG: Record<
  FuturesOrderListMode,
  {
    loadingText: string;
    emptyText: string;
    errorText: string;
    filters: Pick<ContestFuturesOrderFilters, "orderStatus">;
  }
> = {
  pending: {
    loadingText: "미체결 주문을 불러오는 중입니다.",
    emptyText: "미체결 주문이 없습니다.",
    errorText: "미체결 주문을 불러오지 못했습니다.",
    filters: { orderStatus: "PENDING" },
  },
  orders: {
    loadingText: "주문내역을 불러오는 중입니다.",
    emptyText: "주문내역이 없습니다.",
    errorText: "주문내역을 불러오지 못했습니다.",
    filters: { orderStatus: "" },
  },
  trades: {
    loadingText: "체결내역을 불러오는 중입니다.",
    emptyText: "체결내역이 없습니다.",
    errorText: "체결내역을 불러오지 못했습니다.",
    filters: { orderStatus: "COMPLETED" },
  },
};

const formatQuantity = (value?: number | null) =>
  formatAssetNumber(value, {
    fallback: "-",
    standardMaxFractionDigits: 4,
    smallMaxFractionDigits: 8,
  });

const formatMoney = (value?: number | null) =>
  formatAssetNumber(value, { fallback: "-" });

const getStatusClassName = (orderStatus?: FuturesOrderStatus | null) => {
  if (orderStatus === "COMPLETED") {
    return "bg-[#2EBD85]/15 text-[#2EBD85]";
  }

  if (orderStatus === "PENDING") {
    return "bg-[#F0B90B]/15 text-[#F0B90B]";
  }

  if (orderStatus === "PARTIALLY_FILLED") {
    return "bg-sky-500/15 text-sky-400";
  }

  if (orderStatus === "CANCELED") {
    return "bg-gray-500/15 text-gray-400";
  }

  return "bg-gray-500/15 text-gray-400";
};

export default function FuturesOrderList({
  contestSeasonId = null,
  activityVersion,
  mode,
  pageSize = DEFAULT_PAGE_SIZE,
  cancelingOrderId = null,
  isTradingEnabled = false,
  onCancelLimitOrder,
}: FuturesOrderListProps) {
  const config = MODE_CONFIG[mode];
  const { alert, toast } = useFeedback();
  const requireVerifiedUser = useRequireVerifiedUser({
    loginRedirectMode: "push",
    verifyRedirectMode: "push",
  });

  const [items, setItems] = useState<FuturesOrderItem[]>([]);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(
    async ({
      append,
      cursorId,
    }: {
      append: boolean;
      cursorId?: number | null;
    }) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setErrorMessage("");
      }

      try {
        const filters = {
          cursorId,
          ...config.filters,
          size: pageSize,
        };

        const response = contestSeasonId
          ? await getContestFuturesOrders(contestSeasonId, filters)
          : await getFuturesOrders(filters);

        if (append) {
          setItems((prev) => {
            const seenIds = new Set(prev.map((order) => order.orderId));
            const nextItems = response.content.filter(
              (order) => !seenIds.has(order.orderId)
            );

            return [...prev, ...nextItems];
          });
        } else {
          setItems(response.content);
        }

        setNextCursorId(response.nextCursorId);
        setHasNext(response.hasNext);
      } catch (error) {
        const nextErrorMessage =
          error instanceof Error ? error.message || config.errorText : config.errorText;

        if (append) {
          await alert(nextErrorMessage);
        } else {
          setItems([]);
          setErrorMessage(nextErrorMessage);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [alert, config.errorText, config.filters, contestSeasonId, pageSize]
  );

  useEffect(() => {
    void loadData({ append: false });
  }, [activityVersion, loadData]);

  useEffect(() => {
    if (!hasNext || nextCursorId === null || isLoading || isLoadingMore) {
      return;
    }

    const root = scrollContainerRef.current;
    const target = loadMoreRef.current;

    if (!root || !target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        void loadData({ append: true, cursorId: nextCursorId });
      },
      {
        root,
        rootMargin: "120px 0px",
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNext, isLoading, isLoadingMore, loadData, nextCursorId]);

  const handleCancelOrder = async (order: FuturesOrderItem) => {
    if (!onCancelLimitOrder) {
      return;
    }

    if (!isTradingEnabled) {
      await alert("현재는 주문을 취소할 수 있는 상태가 아닙니다.");
      return;
    }

    const isVerifiedUser = await requireVerifiedUser();

    if (!isVerifiedUser) {
      return;
    }

    try {
      await onCancelLimitOrder(order.orderId);
      toast({
        title: "지정가 주문이 취소되었습니다.",
        tone: "success",
      });
    } catch (error) {
      await alert(
        error instanceof Error
          ? error.message || "주문 취소에 실패했습니다."
          : "주문 취소에 실패했습니다."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
        {config.loadingText}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
        {errorMessage}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
        {config.emptyText}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto">
        {mode === "pending" ? (
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-[#161A1E]">
              <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="border-b border-white/5 px-4 py-3 text-left whitespace-nowrap">자산</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">방향</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">구분</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">유형</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">주문가</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">주문수량</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">잔여수량</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">증거금</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">수수료</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">주문일시</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody>{items.map((order) => renderPendingRow(order))}</tbody>
          </table>
        ) : mode === "orders" ? (
          <table className="w-full min-w-[1280px] border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-[#161A1E]">
              <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="border-b border-white/5 px-4 py-3 text-left whitespace-nowrap">자산</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">방향</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">구분</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">유형</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">상태</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">주문가</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">체결가</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">주문수량</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">체결수량</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">잔여수량</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">명목금액</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">수수료</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">주문일시</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">체결일시</th>
              </tr>
            </thead>
            <tbody>{items.map((order) => renderOrderHistoryRow(order))}</tbody>
          </table>
        ) : (
          <table className="w-full min-w-[1080px] border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-[#161A1E]">
              <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="border-b border-white/5 px-4 py-3 text-left whitespace-nowrap">자산</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">방향</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">구분</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">유형</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">체결가</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">체결수량</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">명목금액</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">증거금</th>
                <th className="border-b border-white/5 px-4 py-3 text-right whitespace-nowrap">수수료</th>
                <th className="border-b border-white/5 px-4 py-3 text-center whitespace-nowrap">체결일시</th>
              </tr>
            </thead>
            <tbody>{items.map((order) => renderTradeHistoryRow(order))}</tbody>
          </table>
        )}

        {hasNext ? (
          <div ref={loadMoreRef} className="h-4" aria-hidden="true" />
        ) : null}
      </div>

      {isLoadingMore ? (
        <p className="py-2 text-center text-xs font-medium text-gray-500">
          더 불러오는 중...
        </p>
      ) : null}
    </div>
  );

  function renderAssetCell(order: FuturesOrderItem) {
    return (
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-sm font-black text-white">{order.symbol}</p>
        {order.displayNameKr ? (
          <p className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
            {order.displayNameKr}
          </p>
        ) : null}
      </td>
    );
  }

  function renderSideCell(order: FuturesOrderItem) {
    return (
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span
          className={cn(
            "inline-flex rounded px-2 py-0.5 text-[10px] font-black whitespace-nowrap",
            order.positionSide === "LONG"
              ? "bg-[#2EBD85]/15 text-[#2EBD85]"
              : "bg-[#F6465D]/15 text-[#F6465D]"
          )}
        >
          {formatFuturesPositionSide(order.positionSide)}
        </span>
      </td>
    );
  }

  function renderActionCell(order: FuturesOrderItem) {
    return (
      <td className="px-4 py-3 text-center text-sm font-bold text-gray-300 whitespace-nowrap">
        {formatFuturesPositionAction(order.positionAction)}
      </td>
    );
  }

  function renderTypeCell(order: FuturesOrderItem) {
    return (
      <td className="px-4 py-3 text-center text-sm font-bold text-gray-300 whitespace-nowrap">
        {formatFuturesOrderType(order.orderType)}
      </td>
    );
  }

  function renderStatusCell(order: FuturesOrderItem) {
    return (
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <span
          className={cn(
            "inline-flex rounded px-2 py-0.5 text-[10px] font-black whitespace-nowrap",
            getStatusClassName(order.orderStatus)
          )}
        >
          {formatFuturesOrderStatus(order.orderStatus)}
        </span>
      </td>
    );
  }

  function renderPendingRow(order: FuturesOrderItem) {
    return (
      <tr
        key={order.orderId}
        className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
      >
        {renderAssetCell(order)}
        {renderSideCell(order)}
        {renderActionCell(order)}
        {renderTypeCell(order)}
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.orderPrice)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatQuantity(order.orderQuantity)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatQuantity(order.remainingQuantity)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.orderMargin)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.totalFee)}
        </td>
        <td className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
          {formatDateTime(order.createdAt)}
        </td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <button
            type="button"
            onClick={() => void handleCancelOrder(order)}
            disabled={cancelingOrderId === order.orderId}
            className="rounded bg-[#F6465D]/20 px-2.5 py-1 text-[11px] font-black text-[#F6465D] transition-colors hover:bg-[#F6465D]/30 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
          >
            {cancelingOrderId === order.orderId ? "취소 중" : "취소"}
          </button>
        </td>
      </tr>
    );
  }

  function renderOrderHistoryRow(order: FuturesOrderItem) {
    return (
      <tr
        key={order.orderId}
        className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
      >
        {renderAssetCell(order)}
        {renderSideCell(order)}
        {renderActionCell(order)}
        {renderTypeCell(order)}
        {renderStatusCell(order)}
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.orderPrice)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.executedPrice)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatQuantity(order.orderQuantity)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatQuantity(order.filledQuantity)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatQuantity(order.remainingQuantity)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.notionalAmount)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.totalFee)}
        </td>
        <td className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
          {formatDateTime(order.createdAt)}
        </td>
        <td className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
          {formatDateTime(order.executedAt)}
        </td>
      </tr>
    );
  }

  function renderTradeHistoryRow(order: FuturesOrderItem) {
    return (
      <tr
        key={order.orderId}
        className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
      >
        {renderAssetCell(order)}
        {renderSideCell(order)}
        {renderActionCell(order)}
        {renderTypeCell(order)}
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.executedPrice)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatQuantity(order.filledQuantity)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney((order.executedPrice ?? 0) * (order.filledQuantity ?? 0))}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.orderMargin)}
        </td>
        <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
          {formatMoney(order.totalFee)}
        </td>
        <td className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
          {formatDateTime(order.executedAt)}
        </td>
      </tr>
    );
  }
}
