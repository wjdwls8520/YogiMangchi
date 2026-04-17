"use client";

import type { OngoingContest } from "./types";

type ContestOngoingSectionProps = {
  isLoading?: boolean;
  contests: OngoingContest[];
  selectedContestId: number;
  onSelectContest: (contestId: number) => void;
};

const getRemainingLabel = (targetDateAt?: string) => {
  if (!targetDateAt) {
    return "";
  }

  const targetDate = new Date(targetDateAt);

  if (Number.isNaN(targetDate.getTime())) {
    return "";
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const targetStart = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const diff = Math.ceil(
    (targetStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff < 0) {
    return "일정이 종료되었습니다";
  }

  if (diff === 0) {
    return "오늘 마감";
  }

  return `D-${diff}`;
};

export default function ContestOngoingSection({
  isLoading = false,
  contests,
  selectedContestId,
  onSelectContest,
}: ContestOngoingSectionProps) {
  const activeContest = contests.find((contest) => contest.id === selectedContestId);
  const primaryLabel = activeContest?.primaryLabel ?? "나의 순위";
  const primaryValue =
    activeContest?.primaryValue ??
    (typeof activeContest?.myRank === "number" ? `${activeContest.myRank}위` : "-");
  const secondaryLabel = activeContest?.secondaryLabel ?? "수익률";
  const secondaryValue =
    activeContest?.secondaryValue ??
    (typeof activeContest?.myYield === "number" ? `${activeContest.myYield}%` : "-");
  const secondaryToneClass =
    activeContest?.secondaryTone === "positive"
      ? "text-red-500"
      : activeContest?.secondaryTone === "negative"
        ? "text-blue-500"
        : "text-gray-900";
  const tertiaryLabel = activeContest?.tertiaryLabel ?? "참가자";
  const tertiaryValue =
    activeContest?.tertiaryValue ??
    (typeof activeContest?.participants === "number"
      ? `${activeContest.participants}명`
      : "-");
  const contestStatusText = activeContest?.statusText ?? "참가 중";
  const remainingLabel = getRemainingLabel(activeContest?.targetDateAt);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          진행 중인 대회
        </h2>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm font-bold text-gray-400">
          진행 중인 대회 정보를 불러오는 중입니다.
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm font-bold text-gray-400">
          현재 라이브 진행 중인 대회가 없습니다.
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-100 bg-white p-6  lg:grid-cols-12">
        <div className="space-y-3 border-r border-gray-50 pr-6 lg:col-span-4">
          {contests.map((contest) => (
            <button
              key={contest.id}
              type="button"
              onClick={() => onSelectContest(contest.id)}
              className={`w-full rounded-2xl p-5 text-left transition-all ${
                selectedContestId === contest.id
                  ? "translate-x-2 bg-gray-900 text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <p className="mb-1 text-[10px] font-bold opacity-60">{contest.period}</p>
              <h3 className="truncate font-bold">{contest.title}</h3>
            </button>
          ))}
        </div>

        <div className="flex flex-col justify-between p-4 lg:col-span-8">
          {activeContest ? (
            <>
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h3 className="mb-2 text-2xl font-black">{activeContest.title}</h3>
                  <p className="font-medium italic text-gray-400">
                    {contestStatusText}
                    {remainingLabel ? ` · ${remainingLabel}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-2xl bg-blue-600 px-8 py-4 text-lg font-black text-white transition-all hover:scale-105 hover:bg-blue-700"
                >
                  투자 바로가기
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <p className="mb-1 text-xs font-bold uppercase text-gray-400">
                    {primaryLabel}
                  </p>
                  <p className="text-3xl font-black text-gray-900">{primaryValue}</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <p className="mb-1 text-xs font-bold uppercase text-gray-400">
                    {secondaryLabel}
                  </p>
                  <p className={`text-3xl font-black ${secondaryToneClass}`}>
                    {secondaryValue}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <p className="mb-1 text-xs font-bold uppercase text-gray-400">
                    {tertiaryLabel}
                  </p>
                  <p className="text-3xl font-black text-gray-900">{tertiaryValue}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      )}
    </section>
  );
}
