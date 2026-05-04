"use client";

import { useCallback, useState } from "react";
import Button from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireVerifiedUser } from "@/hooks/useWithAuth";
import { useTickerStore } from "@/stores/useTickerStore";
import { cn } from "@/lib/utils/cs";
import { formatDateTime } from "@/lib/utils/date";
import {
  formatFuturesPositionSide,
  getFuturesPositionTone,
} from "@/lib/utils/futures";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";
import type {
  ContestFuturesLimitCloseOrderParams,
  FuturesLimitOrderResponse,
  FuturesMarketOrderResponse,
  FuturesPositionItem,
  FuturesPositionSide,
} from "@/types/futures";

type OpenPositionsTabProps = {
  openPositions: FuturesPositionItem[];
  closingPositionId: number | null;
  isTradingEnabled: boolean;
  pendingCloseQuantityByPositionKey: Record<string, number>;
  onClosePosition: (params: {
    positionId: number;
    closeQuantity: number;
  }) => Promise<FuturesMarketOrderResponse>;
  onSubmitLimitCloseOrder: (
    params: ContestFuturesLimitCloseOrderParams
  ) => Promise<FuturesLimitOrderResponse>;
};

const formatQuantity = (value?: number | null) =>
  formatAssetNumber(value, {
    standardMaxFractionDigits: 4,
    smallMaxFractionDigits: 8,
  });

const getPendingCloseQuantityKey = ({
  symbol,
  positionSide,
}: {
  symbol: string;
  positionSide: string;
}) => `${symbol}-${positionSide}`;

const sanitizeDecimalInput = (value: string) => {
  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
};

const formatSignedPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${formatAssetNumber(value, {
    standardMaxFractionDigits: 2,
  })}%`;
};

const getSignedValueClassName = (value?: number | null) => {
  if (!value || value === 0) {
    return "text-white";
  }

  return value > 0 ? "text-[#2EBD85]" : "text-[#F6465D]";
};

export default function OpenPositionsTab({
  openPositions,
  closingPositionId,
  isTradingEnabled,
  pendingCloseQuantityByPositionKey,
  onClosePosition,
  onSubmitLimitCloseOrder,
}: OpenPositionsTabProps) {
  const { alert, toast } = useFeedback();
  const tickers = useTickerStore((state) => state.tickers);
  const requireVerifiedUser = useRequireVerifiedUser({
    loginRedirectMode: "push",
    verifyRedirectMode: "push",
  });

  const [closeQuantities, setCloseQuantities] = useState<
    Record<number, string>
  >({});

  const getPendingCloseQuantity = useCallback(
    (position: FuturesPositionItem) => {
      const key = getPendingCloseQuantityKey({
        symbol: position.symbol,
        positionSide: position.positionSide,
      });
      return pendingCloseQuantityByPositionKey[key] ?? 0;
    },
    [pendingCloseQuantityByPositionKey]
  );

  const getCloseableQuantity = useCallback(
    (position: FuturesPositionItem) => {
      return Math.max(
        0,
        (position.filledQuantity ?? 0) - getPendingCloseQuantity(position)
      );
    },
    [getPendingCloseQuantity]
  );

  const handleCloseQuantityChange = (positionId: number, value: string) => {
    setCloseQuantities((prev) => ({
      ...prev,
      [positionId]: sanitizeDecimalInput(value),
    }));
  };

  const handleSetFullCloseQuantity = (position: FuturesPositionItem) => {
    setCloseQuantities((prev) => ({
      ...prev,
      [position.positionId]: String(getCloseableQuantity(position)),
    }));
  };

  const handleClosePosition = async (position: FuturesPositionItem) => {
    if (!isTradingEnabled) {
      await alert("현재는 청산 가능한 대회 기간이 아닙니다.");
      return;
    }

    const isVerifiedUser = await requireVerifiedUser();

    if (!isVerifiedUser) {
      return;
    }

    const inputValue = closeQuantities[position.positionId]?.trim();
    const closeableQuantity = getCloseableQuantity(position);
    const closeQuantity = inputValue ? Number(inputValue) : closeableQuantity;

    if (!Number.isFinite(closeQuantity) || closeQuantity <= 0) {
      await alert("청산 수량을 올바르게 입력해 주세요.");
      return;
    }

    if (closeQuantity > closeableQuantity) {
      await alert(
        "미체결 지정가 청산 주문을 제외한 청산 가능 수량을 초과했습니다."
      );
      return;
    }

    try {
      const response = await onClosePosition({
        positionId: position.positionId,
        closeQuantity,
      });

      setCloseQuantities((prev) => ({
        ...prev,
        [position.positionId]: "",
      }));

      const closeRealizedPnl = response.thisCloseRealizedPnl;

      toast({
        title: `${formatFuturesPositionSide(position.positionSide)} 포지션 청산이 완료되었습니다.`,
        description:
          closeRealizedPnl !== null && closeRealizedPnl !== undefined
            ? `실현손익 ${formatSignedAssetNumber(closeRealizedPnl)}`
            : `청산 수량 ${formatQuantity(closeQuantity)}`,
        tone: "success",
      });
    } catch (error) {
      await alert(
        error instanceof Error
          ? error.message || "포지션 청산에 실패했습니다."
          : "포지션 청산에 실패했습니다."
      );
    }
  };

  if (openPositions.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-center text-sm font-bold text-gray-500">
        현재 보유 중인 오픈 포지션이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1 min-h-0">
      <table className="w-full min-w-[1200px] border-separate border-spacing-0">
        <thead className="sticky top-0 bg-[#161A1E] z-10">
          <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 text-left border-b border-white/5 whitespace-nowrap">자산</th>
            <th className="px-4 py-3 text-center border-b border-white/5 whitespace-nowrap">방향</th>
            <th className="px-4 py-3 text-right border-b border-white/5 whitespace-nowrap">수량</th>
            <th className="px-4 py-3 text-right border-b border-white/5 whitespace-nowrap">진입가</th>
            <th className="px-3 py-3 text-center border-b border-white/5 whitespace-nowrap">레버리지</th>
            <th className="px-4 py-3 text-right border-b border-white/5 whitespace-nowrap">증거금</th>
            <th className="px-4 py-3 text-right border-b border-white/5 whitespace-nowrap">청산가</th>
            <th className="px-4 py-3 text-right border-b border-white/5 whitespace-nowrap">현재가</th>
            <th className="px-4 py-3 text-right border-b border-white/5 whitespace-nowrap">미실현손익</th>
            <th className="px-4 py-3 text-center border-b border-white/5 whitespace-nowrap">청산</th>
          </tr>
        </thead>
        <tbody>
          {openPositions.map((position) => {
            const tone = getFuturesPositionTone(position.positionSide);
            const markPrice = tickers[position.symbol]?.price ?? null;
            const hasMarkPrice = markPrice !== null && markPrice > 0;
            const pendingCloseQuantity = getPendingCloseQuantity(position);
            const closeableQuantity = getCloseableQuantity(position);

            const unrealizedPnl =
              hasMarkPrice && position.filledQuantity > 0
                ? position.positionSide === "LONG"
                  ? (markPrice - position.entryPrice) * position.filledQuantity
                  : (position.entryPrice - markPrice) * position.filledQuantity
                : null;

            const unrealizedRoi =
              unrealizedPnl !== null && position.totalMargin > 0
                ? (unrealizedPnl / position.totalMargin) * 100
                : null;

            return (
              <tr
                key={position.positionId}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-sm font-black text-white whitespace-nowrap">
                    {position.symbol}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                    {formatDateTime(position.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex rounded px-2 py-0.5 text-[10px] font-black",
                      position.positionSide === "LONG"
                        ? "bg-[#2EBD85]/15 text-[#2EBD85]"
                        : "bg-[#F6465D]/15 text-[#F6465D]"
                    )}
                  >
                    {formatFuturesPositionSide(position.positionSide)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-white whitespace-nowrap">
                    {formatQuantity(position.filledQuantity)}
                  </p>
                  {pendingCloseQuantity > 0 ? (
                    <p className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                      대기 {formatQuantity(pendingCloseQuantity)}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
                  {formatAssetNumber(position.entryPrice)}
                </td>
                <td className="px-3 py-3 text-center text-sm font-black text-[#F0B90B] whitespace-nowrap">
                  {position.leverage}x
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
                  {formatAssetNumber(position.totalMargin)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
                  {formatAssetNumber(position.liquidationPrice)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-white whitespace-nowrap">
                  {hasMarkPrice
                    ? formatAssetNumber(markPrice, {
                        standardMaxFractionDigits: 4,
                        smallMaxFractionDigits: 8,
                      })
                    : "-"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right text-sm font-black whitespace-nowrap",
                    getSignedValueClassName(unrealizedPnl)
                  )}
                >
                  <p className="whitespace-nowrap">
                    {formatSignedAssetNumber(unrealizedPnl, { fallback: "-" })}
                  </p>
                  <p className="text-[10px] font-bold whitespace-nowrap">
                    {formatSignedPercent(unrealizedRoi)}
                  </p>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={formatQuantity(closeableQuantity)}
                      value={closeQuantities[position.positionId] ?? ""}
                      onChange={(e) =>
                        handleCloseQuantityChange(
                          position.positionId,
                          e.target.value
                        )
                      }
                      disabled={closeableQuantity <= 0}
                      className="h-7 w-20 rounded border border-white/10 bg-[#1E2329] px-2 text-right text-[11px] font-bold text-white outline-none focus:border-[#F0B90B]/50 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      onClick={() => handleSetFullCloseQuantity(position)}
                      className="text-[10px] font-bold text-gray-500 transition-colors hover:text-white"
                    >
                      전량
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleClosePosition(position)}
                      disabled={
                        closingPositionId === position.positionId ||
                        closeableQuantity <= 0
                      }
                      className="rounded bg-[#F6465D]/20 px-2.5 py-1 text-[11px] font-black text-[#F6465D] transition-colors hover:bg-[#F6465D]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {closingPositionId === position.positionId
                        ? "청산 중"
                        : "청산"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
