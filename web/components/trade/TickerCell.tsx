"use client";

import { useTickerStore } from "@/stores/useTickerStore";
import { formatNumber, formatSignedNumber, formatSignedPercent } from "@/lib/utils/number";
import { getProfitColorClass } from "@/lib/utils/cs";

interface TickerCellProps {
  symbol: string;
  fallbackPrice: number;
  quantity: number;
  buyAmount: number;
  type?: "price" | "value" | "profit" | "roi";
}

export default function TickerCell({
  symbol,
  fallbackPrice,
  quantity,
  buyAmount,
  type = "price",
}: TickerCellProps) {
  const realtimePrice = useTickerStore((state) => state.tickers[symbol]?.price ?? fallbackPrice);

  if (type === "price") return <>{formatNumber(realtimePrice)}</>;

  const value = quantity * realtimePrice;
  if (type === "value") return <span className="font-bold text-gray-900">{formatNumber(value)}</span>;

  const profit = value - buyAmount;
  if (type === "profit") return <span className={getProfitColorClass(profit)}>{formatSignedNumber(profit)}</span>;

  const roi = buyAmount > 0 ? (profit / buyAmount) * 100 : 0;
  if (type === "roi") return <span className={getProfitColorClass(profit)}>{formatSignedPercent(roi)}</span>;

  return null;
}
