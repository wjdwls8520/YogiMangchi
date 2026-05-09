"use client";

import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireVerifiedUser } from "@/hooks/useWithAuth";
import { formatFuturesPositionSide } from "@/lib/utils/futures";
import { cn } from "@/lib/utils/cs";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import type {
  ContestFuturesLimitCloseOrderParams,
  FuturesMarketOrderResponse,
  FuturesPositionItem,
  FuturesLimitOrderResponse,
} from "@/types/futures";
import { useState } from "react";

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
  disabledMessage?: string;
  mode?: "light" | "dark";
};

const getPendingKey = (p: FuturesPositionItem) =>
  `${p.symbol}-${p.positionSide}`;

export default function OpenPositionsTab({
  openPositions,
  closingPositionId,
  isTradingEnabled,
  pendingCloseQuantityByPositionKey,
  onClosePosition,
  onSubmitLimitCloseOrder,
  disabledMessage = "현재는 청산이 가능한 상태가 아닙니다.",
  mode,
}: OpenPositionsTabProps) {
  const isDark = mode === "dark";
  const { alert, toast } = useFeedback();
  const requireVerifiedUser = useRequireVerifiedUser({
    loginRedirectMode: "push",
    verifyRedirectMode: "push",
  });
  const tickers = useTickerStore((s) => s.tickers);

  const [localClosingId, setLocalClosingId] = useState<number | null>(null);

  const handleMarketClose = async (p: FuturesPositionItem) => {
    if (!isTradingEnabled) {
      await alert(disabledMessage);
      return;
    }

    const isVerifiedUser = await requireVerifiedUser();
    if (!isVerifiedUser) return;

    const pendingQty = pendingCloseQuantityByPositionKey[getPendingKey(p)] ?? 0;
    const closeableQty = Math.max(0, p.filledQuantity - pendingQty);

    if (closeableQty <= 0) {
      await alert("이미 모든 수량에 대해 청산 주문이 대기 중입니다.");
      return;
    }

    setLocalClosingId(p.positionId);
    try {
      const res = await onClosePosition({
        positionId: p.positionId,
        closeQuantity: closeableQty,
      });

      toast({
        title: `${formatFuturesPositionSide(p.positionSide)} 시장가 청산 완료`,
        description:
          res.thisCloseRealizedPnl != null
            ? `실현손익 ${formatSignedAssetNumber(res.thisCloseRealizedPnl)}`
            : undefined,
        tone: "success",
      });
    } catch (error) {
      await alert(
        error instanceof Error
          ? error.message || "청산에 실패했습니다."
          : "청산에 실패했습니다."
      );
    } finally {
      setLocalClosingId(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-auto">
      {openPositions.length === 0 ? (
        <div className="flex h-full items-center justify-center py-16 text-sm font-bold text-gray-500">
          보유 중인 오픈 포지션이 없습니다.
        </div>
      ) : (
        <table className="w-full min-w-[1200px] border-separate border-spacing-0">
          <thead className={cn("sticky top-0 z-10", isDark ? "bg-[#161A1E]" : "bg-slate-50")}>
            <tr className={cn("text-[11px] font-bold uppercase tracking-wide", isDark ? "text-white/30" : "text-slate-400")}>
              <th className={cn("border-b px-4 py-3 text-left whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                자산
              </th>
              <th className={cn("border-b px-4 py-3 text-center whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                방향
              </th>
              <th className={cn("border-b px-4 py-3 text-right whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                수량
              </th>
              <th className={cn("border-b px-4 py-3 text-right whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                진입가
              </th>
              <th className={cn("border-b px-4 py-3 text-right whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                시장가
              </th>
              <th className={cn("border-b px-4 py-3 text-right whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                청산가
              </th>
              <th className={cn("border-b px-4 py-3 text-right whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                증거금
              </th>
              <th className={cn("border-b px-4 py-3 text-right whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                미실현손익(ROE%)
              </th>
              <th className={cn("border-b px-4 py-3 text-center whitespace-nowrap", isDark ? "border-white/5" : "border-gray-100")}>
                관리
              </th>
            </tr>
          </thead>
          <tbody>
            {openPositions.map((p) => {
              const ticker = tickers[p.symbol];
              const markPrice = ticker?.price ?? 0;

              // 미실현 손익 계산
              const pnl =
                markPrice > 0
                  ? p.positionSide === "LONG"
                    ? (markPrice - p.entryPrice) * p.filledQuantity
                    : (p.entryPrice - markPrice) * p.filledQuantity
                  : 0;

              const roe = p.totalMargin > 0 ? (pnl / p.totalMargin) * 100 : 0;
              const pendingQty =
                pendingCloseQuantityByPositionKey[getPendingKey(p)] ?? 0;

              return (
                <tr
                  key={p.positionId}
                  className={cn("border-b last:border-b-0", isDark ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-slate-50")}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className={cn("text-sm font-black", isDark ? "text-white" : "text-slate-900")}>{p.symbol}</p>
                    <p className={cn("text-[10px] font-medium", isDark ? "text-white/30" : "text-slate-400")}>
                      Isolated {p.leverage}x
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-[10px] font-black ${
                        p.positionSide === "LONG"
                          ? "bg-[#2EBD85]/15 text-[#2EBD85]"
                          : "bg-[#F6465D]/15 text-[#F6465D]"
                      }`}
                    >
                      {formatFuturesPositionSide(p.positionSide)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <p className={cn("text-sm font-bold", isDark ? "text-white/80" : "text-slate-900")}>
                      {formatAssetNumber(p.filledQuantity, {
                        standardMaxFractionDigits: 4,
                        smallMaxFractionDigits: 8,
                      })}
                    </p>
                    {pendingQty > 0 && (
                      <p className="text-[10px] font-medium text-yellow-500">
                        대기 {formatAssetNumber(pendingQty)}
                      </p>
                    )}
                  </td>
                  <td className={cn("px-4 py-4 text-right text-sm font-bold whitespace-nowrap", isDark ? "text-white/60" : "text-slate-600")}>
                    {formatAssetNumber(p.entryPrice)}
                  </td>
                  <td className={cn("px-4 py-4 text-right text-sm font-bold whitespace-nowrap", isDark ? "text-white/80" : "text-slate-900")}>
                    {markPrice > 0 ? formatAssetNumber(markPrice) : "-"}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-[#F6465D] whitespace-nowrap">
                    {formatAssetNumber(p.liquidationPrice)}
                  </td>
                  <td className={cn("px-4 py-4 text-right text-sm font-bold whitespace-nowrap", isDark ? "text-white/60" : "text-slate-600")}>
                    {formatAssetNumber(p.totalMargin)}
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <p
                      className={`text-sm font-bold ${
                        pnl >= 0 ? "text-[#2EBD85]" : "text-[#F6465D]"
                      }`}
                    >
                      {formatSignedAssetNumber(pnl)}
                    </p>
                    <p
                      className={`text-[11px] font-bold ${
                        roe >= 0 ? "text-[#2EBD85]" : "text-[#F6465D]"
                      }`}
                    >
                      ({roe >= 0 ? "+" : ""}
                      {roe.toFixed(2)}%)
                    </p>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      disabled={
                        closingPositionId === p.positionId ||
                        localClosingId === p.positionId
                      }
                      onClick={() => void handleMarketClose(p)}
                      className={cn(
                        "rounded px-3 py-1.5 text-[11px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        isDark 
                          ? "bg-white/10 text-white hover:bg-white/20" 
                          : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                      )}
                    >
                      {closingPositionId === p.positionId ||
                      localClosingId === p.positionId
                        ? "청산 중"
                        : "시장가 청산"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
