"use client";

import type { OngoingContest } from "./types";
import { TrendingUp, ArrowRight } from "lucide-react";

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
  if (isLoading) {
    return (
      <div className="h-48 w-full animate-pulse rounded-[2rem] bg-white/5 border border-white/10" />
    );
  }

  if (contests.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2 text-white">
        <TrendingUp className="w-6 h-6 text-emerald-500" />
        내 진행 중인 대회
      </h2>
      <div className="grid grid-cols-1 gap-6">
        {contests.map((contest) => (
          <div
            key={contest.id}
            className="group relative overflow-hidden rounded-[1.5rem] bg-slate-900/40 border border-emerald-500/20 p-6 md:p-8 backdrop-blur-xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.12)] hover:border-emerald-500/40"
          >
            {/* Gradient Glow Layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30 uppercase tracking-widest">
                    Live Now
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none">
                    {contest.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">현재 수익률</p>
                    <p className="text-2xl font-black text-emerald-400 tracking-tight leading-none">
                      {typeof contest.myYield === "number" ? `${contest.myYield}%` : "-"}
                    </p>
                  </div>
                  <div className="h-8 w-[1px] bg-white/5" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">나의 순위</p>
                    <p className="text-2xl font-black text-white tracking-tight leading-none">
                      {typeof contest.myRank === "number" ? `${contest.myRank}위` : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onMoveTrading?.(contest.id)}
                className="group/btn relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl bg-emerald-500 px-8 text-base font-black text-white transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/10"
              >
                <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover/btn:w-64 group-hover/btn:h-64 opacity-10"></span>
                <span className="relative z-10 flex items-center gap-2">
                  대회장 입장하기
                  <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
