"use client";

import { useState } from "react";
import type { OngoingContest } from "./types";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

type ContestOngoingSectionProps = {
  isLoading?: boolean;
  contests: OngoingContest[];
  selectedContestId: number;
  onSelectContest: (contestId: number) => void;
  onMoveTrading?: (contestId: number) => void;
};

export default function ContestOngoingSection({
  isLoading = false,
  contests,
  onMoveTrading,
}: ContestOngoingSectionProps) {
  const [startIndex, setStartIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="h-40 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800" />
    );
  }

  if (contests.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          내 진행 중인 대회
        </h2>
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
            진행 중인 대회가 없습니다.
          </p>
        </div>
      </section>
    );
  }

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    // 테블릿(2개 노출) 및 PC(3개 노출) 모두를 지원하기 위해 최대 인덱스를 length - 2로 설정
    setStartIndex((prev) => Math.min(contests.length - 2, prev + 1));
  };

  const renderCard = (contest: OngoingContest, customClass?: string) => (
    <div
      key={contest.id}
      className={`flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-5 transition-all hover:border-gray-300 dark:hover:border-gray-700 ${customClass || ""}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200/50 dark:ring-blue-800/50 text-[10px] font-bold">
            {contest.statusText || "진행중"}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100 tracking-tight line-clamp-1">
          {contest.title}
        </h3>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 dark:border-gray-800/60">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">현재 수익률</p>
            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
              {typeof contest.myYield === "number" ? `${contest.myYield}%` : "-"}
            </p>
          </div>
          {/* <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">나의 순위</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              {typeof contest.myRank === "number" ? `${contest.myRank}위` : "-"}
            </p>
          </div> */}
        </div>
      </div>

      <button
        onClick={() => onMoveTrading?.(contest.id)}
        className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-500 active:scale-95"
      >
        대회장 입장
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
          내 진행 중인 대회
        </h2>

        {/* Carousel slide controls (visible on PC/Tablet if items > 2) */}
        {contests.length > 2 && (
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              disabled={startIndex === 0}
              className="p-1 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={startIndex >= contests.length - 2}
              className="p-1 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 1. Mobile view: Horizontal scroll displaying up to 3 items */}
      <div className="flex md:hidden overflow-x-auto gap-3 pb-2 scrollbar-custom">
        {contests.slice(0, 3).map((contest) => renderCard(contest, "w-[85%] shrink-0"))}
      </div>

      {/* 2. Tablet view: Horizontal Carousel grid displaying 2 items */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
        {contests.slice(startIndex, startIndex + 2).map((contest) => renderCard(contest))}
      </div>

      {/* 3. PC view: Horizontal Carousel grid displaying 3 items */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {contests.slice(startIndex, startIndex + 3).map((contest) => renderCard(contest))}
      </div>
    </section>
  );
}
