"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { getContestFuturesClosedPositions } from "@/lib/api/contest-futures";
import { getFuturesClosedPositions } from "@/lib/api/futures";
import { formatDateTime } from "@/lib/utils/date";
import {
  formatFuturesPositionSide,
} from "@/lib/utils/futures";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";
import type {
  FuturesPositionItem,
} from "@/types/futures";

type ClosedPositionsTabProps = {
  contestSeasonId?: number | null;
  activityVersion: number;
};

const PAGE_SIZE = 20;

export default function ClosedPositionsTab({
  contestSeasonId = null,
  activityVersion,
}: ClosedPositionsTabProps) {
  const { alert } = useFeedback();

  const [items, setItems] = useState<FuturesPositionItem[]>([]);
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
          size: PAGE_SIZE,
        };

        const response = contestSeasonId
          ? await getContestFuturesClosedPositions(contestSeasonId, filters)
          : await getFuturesClosedPositions(filters);

        if (append) {
          setItems((prev) => {
            const seenIds = new Set(prev.map((item) => item.positionId));
            const nextItems = response.content.filter(
              (item) => !seenIds.has(item.positionId)
            );
            return [...prev, ...nextItems];
          });
        } else {
          setItems(response.content);
        }

        setNextCursorId(response.nextCursorId);
        setHasNext(response.hasNext);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "청산 내역을 불러오지 못했습니다.";
        if (append) {
          await alert(msg);
        } else {
          setItems([]);
          setErrorMessage(msg);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [alert, contestSeasonId]
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
        if (entry?.isIntersecting) {
          void loadData({ append: true, cursorId: nextCursorId });
        }
      },
      {
        root,
        rootMargin: "120px 0px",
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNext, isLoading, isLoadingMore, loadData, nextCursorId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center py-16 text-sm font-bold text-gray-500">
        청산 내역을 불러오는 중입니다.
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
        청산 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[1200px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <th className="border-b border-gray-100 px-4 py-3 text-left">자산</th>
              <th className="border-b border-gray-100 px-4 py-3 text-center">방향</th>
              <th className="border-b border-gray-100 px-4 py-3 text-right">체결수량</th>
              <th className="border-b border-gray-100 px-4 py-3 text-right">진입가</th>
              <th className="border-b border-gray-100 px-4 py-3 text-right">청산가</th>
              <th className="border-b border-gray-100 px-4 py-3 text-right">실현손익</th>
              <th className="border-b border-gray-100 px-4 py-3 text-right">ROE%</th>
              <th className="border-b border-gray-100 px-4 py-3 text-right">수수료</th>
              <th className="border-b border-gray-100 px-4 py-3 text-center">종료일시</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const roe = p.totalMargin > 0 ? ((p.realizedPnl ?? 0) / p.totalMargin) * 100 : 0;
              return (
                <tr key={p.positionId} className="border-b border-gray-100 last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="text-sm font-black text-slate-900">{p.symbol}</p>
                    <p className="text-[10px] font-medium text-slate-400">Isolated {p.leverage}x</p>
                  </td>
                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-black ${p.positionSide === "LONG" ? "bg-[#2EBD85]/15 text-[#2EBD85]" : "bg-[#F6465D]/15 text-[#F6465D]"}`}>
                      {formatFuturesPositionSide(p.positionSide)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                    {formatAssetNumber(p.filledQuantity, { standardMaxFractionDigits: 4, smallMaxFractionDigits: 8 })}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-slate-600 whitespace-nowrap">
                    {formatAssetNumber(p.entryPrice)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-slate-900 whitespace-nowrap">
                    {formatAssetNumber(p.exitPrice)}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold whitespace-nowrap">
                    <span className={p.realizedPnl != null && p.realizedPnl >= 0 ? "text-[#2EBD85]" : "text-[#F6465D]"}>
                      {formatSignedAssetNumber(p.realizedPnl)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold whitespace-nowrap">
                    <span className={roe >= 0 ? "text-[#2EBD85]" : "text-[#F6465D]"}>
                      {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-bold text-gray-500 whitespace-nowrap">
                    {formatAssetNumber(p.totalFee)}
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
                    {formatDateTime(p.closedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hasNext && <div ref={loadMoreRef} className="h-4" />}
      </div>
      {isLoadingMore && <p className="py-2 text-center text-xs font-medium text-gray-500">더 불러오는 중...</p>}
    </div>
  );
}
