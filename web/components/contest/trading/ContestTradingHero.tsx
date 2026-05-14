"use client";

import Link from "next/link";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils/date";
import { formatAssetNumber } from "@/lib/utils/number";
import { getFuturesWalletStatusLabel } from "@/lib/utils/futures";
import { cn } from "@/lib/utils/cs";
import type { ContestParticipationSeason } from "@/lib/api/contest";
import type { FuturesWalletStatus } from "@/types/futures";

type ContestTradingHeroProps = {
  contestSeasonId: number;
  seasonInfo: ContestParticipationSeason | null;
  walletStatus: FuturesWalletStatus;
  pendingOpenOrderLockedAmount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
};

const getStatusTone = (status: FuturesWalletStatus["status"]) => {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300";
  }

  if (normalizedStatus === "EXPIRED") {
    return "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400";
  }

  return "bg-blue-50 text-brand-primary dark:bg-blue-500/10 dark:text-blue-300";
};

const HeroMetric = ({
  label,
  value,
  align = "left",
  accentClassName = "text-gray-900 dark:text-white",
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
  accentClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gray-50 px-5 py-4 dark:bg-zinc-800/70",
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      )}
    >
      <p className="text-center text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className={cn("mt-2 text-xl font-black", accentClassName)}>{value}</p>
    </div>
  );
};

export default function ContestTradingHero({
  contestSeasonId,
  seasonInfo,
  walletStatus,
  pendingOpenOrderLockedAmount,
  isLoading,
  isRefreshing,
  onRefresh,
}: ContestTradingHeroProps) {
  const seasonTitle = seasonInfo?.seasonTitle ?? `대회 시즌 #${contestSeasonId}`;
  const periodLabel = seasonInfo
    ? `${formatDateTime(seasonInfo.contestStartAt)} ~ ${formatDateTime(
        seasonInfo.contestEndAt
      )}`
    : "-";
  const availableBalance = Math.max(0, walletStatus.currentMoney);
  const lockedOrderAmount = Math.max(0, pendingOpenOrderLockedAmount);
  const accountBasisAmount =
    availableBalance + Math.max(0, walletStatus.marginInUse) + lockedOrderAmount;
  const walletStatusLabel = getFuturesWalletStatusLabel(walletStatus.status);

  return (
    <section className="card space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <Link
            href="/contest"
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
            대회 목록으로 돌아가기
          </Link>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary dark:bg-blue-500/10 dark:text-blue-300">
                대회 선물 거래
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  getStatusTone(walletStatus.status)
                )}
              >
                {walletStatusLabel}
              </span>
              {seasonInfo?.isLive ? (
                <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                  LIVE
                </span>
              ) : null}
            </div>

            <div>
              <h1 className="text-left text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                {seasonTitle}
              </h1>
              <p className="mt-2 text-left text-sm font-medium text-gray-400 dark:text-gray-500">
                시즌 ID {contestSeasonId} · {periodLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            type="button"
            size="sm"
            variant="white"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
          >
            <span className="inline-flex items-center gap-1.5">
              <RefreshCcw className="h-3.5 w-3.5" />
              {isRefreshing ? "새로고침 중..." : "새로고침"}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <HeroMetric
          label="계좌 기준금액"
          value={formatAssetNumber(accountBasisAmount)}
          align="right"
        />
        <HeroMetric
          label="가용 자금"
          value={formatAssetNumber(availableBalance)}
          align="right"
        />
        <HeroMetric
          label="사용 중 증거금"
          value={formatAssetNumber(walletStatus.marginInUse)}
          align="right"
        />
        <HeroMetric
          label="미체결 주문잠김"
          value={formatAssetNumber(lockedOrderAmount)}
          align="right"
        />
        <HeroMetric
          label="시드머니"
          value={formatAssetNumber(walletStatus.seedMoney)}
          align="right"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 md:grid-cols-3 dark:border-zinc-800">
        <HeroMetric
          label="계좌 만료일"
          value={walletStatus.expiredAt ? formatDateTime(walletStatus.expiredAt) : "-"}
          align="center"
        />
        <HeroMetric
          label="재시도 횟수"
          value={String(walletStatus.retryCount ?? 0)}
          align="center"
        />
        <HeroMetric
          label="계좌 상태"
          value={walletStatusLabel}
          align="center"
          accentClassName="text-brand-primary dark:text-blue-300"
        />
      </div>
    </section>
  );
}
