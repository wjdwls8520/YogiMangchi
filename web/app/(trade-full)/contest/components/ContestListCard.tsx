"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cs";
import { Zap, Clock, XCircle, ArrowRight, ChevronDown } from "lucide-react";
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
        icon: <Zap className="w-5 h-5 text-violet-400" />,
        border: "hover:border-violet-500/50",
        shadow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]",
        title: "group-hover:text-violet-300",
        button: "bg-violet-500 text-white hover:bg-violet-400",
      };
    case "wait":
    case "approved":
      return {
        icon: <Clock className="w-5 h-5 text-amber-400" />,
        border: "border-l-4 border-l-amber-500/50",
        shadow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
        title: "text-slate-200",
        button: "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30",
      };
    case "reject":
      return {
        icon: <XCircle className="w-5 h-5 text-rose-400" />,
        border: "border-rose-900/30 opacity-75 hover:opacity-100",
        shadow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]",
        title: "text-slate-400 line-through decoration-rose-500/50",
        button: "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20",
      };
    default:
      return {
        icon: <Zap className="w-5 h-5 text-slate-400" />,
        border: "border-slate-700",
        shadow: "",
        title: "text-slate-200",
        button: "bg-slate-700/50 text-slate-300 hover:bg-slate-700/70",
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
        "group flex flex-col rounded-xl bg-slate-800/20 border border-slate-700/30 backdrop-blur-sm transition-all duration-300 overflow-hidden",
        theme.border,
        theme.shadow,
        isExpanded ? "bg-slate-800/40 border-slate-600/50" : "hover:bg-slate-800/30"
      )}
    >
      {/* Header Row */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className={cn("shrink-0 transition-transform duration-300", isExpanded ? "scale-110" : "group-hover:scale-110")}>
            {theme.icon}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className={cn(
              "text-[14px] font-bold tracking-tight transition-all leading-none",
              theme.title,
              !isExpanded && "truncate"
            )}>
              {contest.title}
            </h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
              {contest.period}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform duration-300", isExpanded && "rotate-180")} />
          <div className="shrink-0">
            {type !== "reject" && (
              <button
                type="button"
                disabled={isActionDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction?.(contest);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 min-w-[60px] justify-center active:scale-95",
                  theme.button
                )}
              >
                {actionLabel}
                {type === "apply" && !isActionLoading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accordion Content */}
      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden border-t border-white/5 bg-black/20">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">대회 일정</p>
                <p className="text-[12px] font-bold text-slate-300 leading-snug">{contest.period}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">신청 마감일</p>
                <p className="text-[12px] font-bold text-rose-300 leading-snug">
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

            <div className="space-y-1.5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">대회 설명</p>
              <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                {contest.description || "상세 설명이 등록되지 않은 대회입니다."}
              </p>
            </div>

            {type === "reject" ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">반려 사유</p>
                <p className="text-[12px] font-bold text-rose-300/90 leading-normal">
                  {contest.rejectReason ?? "사유 미정"}
                </p>
              </div>
            ) : contest.reward ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">대회 상금</p>
                <p className="text-[12px] font-bold text-emerald-300/90 leading-normal">
                  {contest.reward}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
