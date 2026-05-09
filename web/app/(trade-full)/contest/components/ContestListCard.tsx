"use client";

import { cn } from "@/lib/utils/cs";
import { Zap, Clock, XCircle, ArrowRight } from "lucide-react";
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
        button: "group-hover:bg-violet-500 group-hover:text-white",
      };
    case "wait":
    case "approved":
      return {
        icon: <Clock className="w-5 h-5 text-amber-400" />,
        border: "border-l-4 border-l-amber-500/50",
        shadow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
        title: "text-slate-200",
        button: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      };
    case "reject":
      return {
        icon: <XCircle className="w-5 h-5 text-rose-400" />,
        border: "border-rose-900/30 opacity-75 hover:opacity-100",
        shadow: "hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]",
        title: "text-slate-400 line-through decoration-rose-500/50",
        button: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      };
    default:
      return {
        icon: <Zap className="w-5 h-5 text-slate-400" />,
        border: "border-slate-700",
        shadow: "",
        title: "text-slate-200",
        button: "bg-slate-700/50 text-slate-300",
      };
  }
};

export default function ContestListCard({
  contest,
  type,
  onAction,
  isActionLoading = false,
}: ContestListCardProps) {
  const theme = getThemeStyles(type);
  const actionLabel = isActionLoading ? "처리 중..." : contest.actionLabel ?? (type === "apply" ? "신청하기" : "상세보기");
  const isActionDisabled = isActionLoading || contest.actionDisabled === true || !onAction;

  return (
    <div 
      className={cn(
        "group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px]",
        theme.border,
        theme.shadow
      )}
      onClick={() => !isActionDisabled && onAction?.(contest)}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          {theme.icon}
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{contest.period}</span>
        </div>
        <h3 className={cn("text-sm font-bold tracking-tight transition-colors leading-snug", theme.title)}>
          {contest.title}
        </h3>
      </div>

      <div className="mt-3">
        {type === "reject" ? (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300/90 leading-normal">
            <span className="font-bold text-rose-400">사유:</span> {contest.rejectReason ?? "사유 미정"}
          </div>
        ) : (
          <button
            type="button"
            disabled={isActionDisabled}
            className={cn(
              "w-full py-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5",
              theme.button
            )}
          >
            {actionLabel}
            {type === "apply" && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
