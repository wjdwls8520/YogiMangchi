"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { getContestFuturesClosedPositions } from "@/lib/api/contest-futures";
import { cn } from "@/lib/utils/cs";
import { formatDateTime } from "@/lib/utils/date";
import {
  formatFuturesPositionSide,
  getFuturesPositionTone,
} from "@/lib/utils/futures";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";
import type {
  ContestFuturesClosedPositionFilters,
  FuturesPositionItem,
} from "@/types/futures";

type ClosedPositionsTabProps = {
  contestSeasonId: number;
  activityVersion: number;
};

const DEFAULT_PAGE_SIZE = 20;

const getSignedValueClassName = (value?: number | null) => {
  if (!value || value === 0) return "text-white";
  return value > 0 ? "text-[#2EBD85]" : "text-[#F6465D]";
};

const formatPositionStatus = (status?: string) => {
  if (status === "CLOSE") return "종료";
  if (status === "OPEN") return "오픈";
  return "-";
};

export default function ClosedPositionsTab({
  contestSeasonId,
  activityVersion,
}: ClosedPositionsTabProps) {
  const { alert } = useFeedback();

  const [items, setItems] = useState<FuturesPositionItem[]>([]);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [symbolInput, setSymbolInput] = useState("");
  const [appliedSymbol, setAppliedSymbol] = useState("");

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(
    async ({
      append,
      cursorId,
      symbol,
    }: {
      append: boolean;
      cursorId?: number | null;
      symbol?: string;
    }) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setErrorMessage("");
      }

      try {
        const response = await getContestFuturesClosedPositions(
          contestSeasonId,
          {
            cursorId,
            symbol: symbol?.trim().toUpperCase() || undefined,
            size: DEFAULT_PAGE_SIZE,
          }
        );

        if (append) {
          setItems((prev) => {
            const seenIds = new Set(prev.map((p) => p.positionId));
            const newItems = response.content.filter(
              (p) => !seenIds.has(p.positionId)
            );
            return [...prev, ...newItems];
          });
        } else {
          setItems(response.content);
        }

        setNextCursorId(response.nextCursorId);
        setHasNext(response.hasNext);
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message || "종료 포지션 내역을 불러오지 못했습니다."
            : "종료 포지션 내역을 불러오지 못했습니다.";

        if (!append) {
          setItems([]);
          setErrorMessage(msg);
        } else {
          await alert(msg);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [alert, contestSeasonId]
  );

  useEffect(() => {
    void loadData({ append: false, symbol: appliedSymbol });
  }, [loadData, activityVersion, appliedSymbol]);

  // Infinite scroll
  useEffect(() => {
    if (!hasNext || nextCursorId === null || isLoading || isLoadingMore) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        void loadData({ append: true, cursorId: nextCursorId, symbol: appliedSymbol });
      },
      { rootMargin: "120px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNext, nextCursorId, isLoading, isLoadingMore, loadData, appliedSymbol]);

  const handleApplyFilter = () => {
    setAppliedSymbol(symbolInput.trim().toUpperCase());
  };

  const handleResetFilter = () => {
    setSymbolInput("");
    setAppliedSymbol("");
  };

  return (
    <div className="space-y-4 flex-1 min-h-0 flex flex-col">
      {/* Filter */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="text"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleApplyFilter();
          }}
          placeholder="심볼 검색 (BTCUSDT)"
          className="h-8 w-48 rounded border border-white/10 bg-[#1E2329] px-3 text-xs text-white outline-none focus:border-[#F0B90B]/50"
        />
        <button
          type="button"
          onClick={handleApplyFilter}
          className="h-8 rounded bg-[#2B3139] px-3 text-xs font-bold text-white hover:bg-[#353C46] transition-colors"
        >
          조회
        </button>
        {appliedSymbol && (
          <button
            type="button"
            onClick={handleResetFilter}
            className="h-8 rounded bg-transparent px-2 text-xs font-bold text-gray-500 hover:text-white transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
          종료 포지션을 불러오는 중입니다.
        </div>
      ) : errorMessage ? (
        <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
          {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
          종료 포지션 내역이 없습니다.
        </div>
      ) : (
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full min-w-[700px] border-separate border-spacing-0">
            <thead className="sticky top-0 bg-[#161A1E] z-10">
              <tr className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left border-b border-white/5">자산</th>
                <th className="px-4 py-3 text-center border-b border-white/5">방향</th>
                <th className="px-4 py-3 text-right border-b border-white/5">진입가</th>
                <th className="px-3 py-3 text-center border-b border-white/5">레버리지</th>
                <th className="px-4 py-3 text-right border-b border-white/5">누적 실현손익</th>
                <th className="px-4 py-3 text-center border-b border-white/5">종료일시</th>
              </tr>
            </thead>
            <tbody>
              {items.map((position) => (
                <tr
                  key={position.positionId}
                  className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-sm font-black text-white">
                    {position.symbol}
                  </td>
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 text-right text-sm font-bold text-white">
                    {formatAssetNumber(position.entryPrice)}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-black text-[#F0B90B]">
                    {position.leverage}x
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right text-sm font-black",
                      getSignedValueClassName(position.realizedPnl)
                    )}
                  >
                    {formatSignedAssetNumber(position.realizedPnl)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                    {formatDateTime(position.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {isLoadingMore ? (
        <p className="py-2 text-center text-xs font-medium text-gray-500">
          더 불러오는 중...
        </p>
      ) : hasNext ? (
        <div ref={loadMoreRef} className="h-4" aria-hidden="true" />
      ) : null}
    </div>
  );
}
