"use client";

import { cn } from "@/lib/utils/cs";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";

export type AssetSummary = {
  title: string;
  cashBalance: number;
  totalAsset: number;
  totalBuyAmount: number;
  totalCoinValue: number;
  totalProfit: number;
  totalRoi: number;
};

type AssetSummaryCardProps = {
  summary: AssetSummary;
  className?: string;
};

const formatSignedPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const getValueColorClass = (value: number) => {
  if (value > 0) return "text-red-400";
  if (value < 0) return "text-blue-400";
  return "text-white";
};

export default function AssetSummaryCard({
  summary,
  className,
}: AssetSummaryCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-white",
        className
      )}
    >
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white opacity-5 blur-2xl"></div>

      <div className="relative z-10 mb-8 flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-gray-300 backdrop-blur-sm">
          {summary.title}
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <p className="mb-1 text-sm font-medium text-gray-400">총 보유 자산</p>
          <h3 className="text-4xl font-black tracking-tight text-white">
            {formatAssetNumber(summary.totalAsset)}
          </h3>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-gray-400">보유 현금</p>
          <h3 className="text-2xl font-bold tracking-tight text-gray-200">
            {formatAssetNumber(summary.cashBalance)}
          </h3>
        </div>
      </div>

      <div className="relative z-10 mt-8 grid grid-cols-2 gap-y-5 border-t border-white/10 pt-6">
        <AssetSummaryMiniInfo
          label="총 매수금액"
          value={formatAssetNumber(summary.totalBuyAmount)}
        />
        <AssetSummaryMiniInfo
          label="총 평가금액"
          value={formatAssetNumber(summary.totalCoinValue)}
          align="right"
        />
        <AssetSummaryMiniInfo
          label="평가손익"
          value={formatSignedAssetNumber(summary.totalProfit)}
          valueColor={getValueColorClass(summary.totalProfit)}
        />
        <AssetSummaryMiniInfo
          label="수익률"
          value={formatSignedPercent(summary.totalRoi)}
          valueColor={getValueColorClass(summary.totalRoi)}
          align="right"
        />
      </div>
    </section>
  );
}

function AssetSummaryMiniInfo({
  label,
  value,
  align = "left",
  valueColor = "text-white",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
  valueColor?: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      <p className={`text-sm font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
