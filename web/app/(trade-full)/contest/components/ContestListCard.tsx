"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cs";
import { ArrowRight, ChevronDown } from "lucide-react";
import type {
  ContestListCardType,
  ContestListItem,
} from "./types";

type ContestListCardProps = {
  contest: ContestListItem;
  type: ContestListCardType;
  onAction?: (contest: ContestListItem) => void;
  isActionLoading?: boolean;
};

const getThemeStyles = (type: ContestListCardType) => {
  switch (type) {
    case "apply":
      return {
        badge: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50",
        button: "bg-emerald-600 text-white hover:bg-emerald-500",
      };
    case "wait":
    case "approved":
      return {
        badge: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/50 dark:ring-amber-800/50",
        button: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
      };
    case "reject":
      return {
        badge: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200/50 dark:ring-rose-800/50",
        button: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50",
      };
    default:
      return {
        badge: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ring-1 ring-gray-200/50 dark:ring-gray-700/50",
        button: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
      };
  }
};

export default function ContestListCard({
  contest,
  type,
  onAction,
  isActionLoading = false,
}: ContestListCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = getThemeStyles(type);
  const actionLabel = isActionLoading ? "..." : (type === "apply" ? "신청" : contest.actionLabel ?? "확인");
  const isActionDisabled = isActionLoading || contest.actionDisabled === true || !onAction;

  return (
    <div 
      className={cn(
        "flex flex-col rounded-2xl border transition-all duration-200 bg-white dark:bg-gray-800 overflow-hidden",
        isExpanded 
          ? "border-gray-300 dark:border-gray-700" 
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
      )}
    >
      {/* Header Row */}
      <div 
        className="flex items-center justify-between p-5 cursor-pointer gap-4 select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0", theme.badge)}>
            {contest.accentLabel || (type === "apply" ? "모집중" : type === "wait" ? "대기" : "종료")}
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className={cn(
              "text-sm font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-snug",
              type === "reject" && "line-through text-gray-400 dark:text-gray-500",
              !isExpanded && "truncate"
            )}>
              {contest.title}
            </h3>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-tight">
              {contest.period}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {type !== "reject" && (
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onAction?.(contest);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 min-w-[54px] justify-center active:scale-95",
                theme.button,
                isActionDisabled && "opacity-60 cursor-not-allowed"
              )}
            >
              {actionLabel}
              {type === "apply" && !isActionLoading && <ArrowRight className="w-3 h-3" />}
            </button>
          )}
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isExpanded && "rotate-180")} />
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">대회 일정</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight">{contest.period}</p>
            </div>
            <div className="space-y-0.5 sm:text-right">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">신청 마감일</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 tracking-tight">
                {contest.recruitmentEndAt ? new Date(contest.recruitmentEndAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "-"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">대회 설명</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {contest.description || "상세 설명이 등록되지 않은 대회입니다."}
            </p>
          </div>

          {type === "reject" ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 space-y-0.5">
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">반려 사유</p>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200 leading-normal">
                {contest.rejectReason ?? "사유 미정"}
              </p>
            </div>
          ) : contest.reward ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 space-y-0.5">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">대회 상금</p>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-normal">
                {contest.reward}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
