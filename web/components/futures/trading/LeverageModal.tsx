"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { formatAssetNumber } from "@/lib/utils/number";
import type { FuturesLeverageInfo, FuturesPositionSide } from "@/types/futures";

type LeverageModalProps = {
  symbol: string;
  initialPositionSide: FuturesPositionSide;
  leverageInfoBySide: Record<FuturesPositionSide, FuturesLeverageInfo | null>;
  onPositionSideChange: (side: FuturesPositionSide) => void;
  onConfirm: (side: FuturesPositionSide, leverage: number) => Promise<unknown>;
  onClose: () => void;
};

const LEVERAGE_STEPS = [1, 2, 5, 10, 20, 50, 75, 100, 125];

export default function LeverageModal({
  symbol,
  initialPositionSide,
  leverageInfoBySide,
  onPositionSideChange,
  onConfirm,
  onClose,
}: LeverageModalProps) {
  const [activeSide, setActiveSide] = useState<FuturesPositionSide>(initialPositionSide);
  const currentInfo = leverageInfoBySide[activeSide];
  const [leverage, setLeverage] = useState(currentInfo?.leverage ?? 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentInfo) {
      setLeverage(currentInfo.leverage);
    }
  }, [currentInfo]);

  // 모달이 열려 있을 때 배경 스크롤 잠금
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  const maxLeverage = currentInfo?.maxLeverage ?? 125;

  const handleSideChange = (side: FuturesPositionSide) => {
    setActiveSide(side);
    onPositionSideChange(side);
  };

  const handleConfirm = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm(activeSide, leverage);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "레버리지 설정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-futures-border bg-futures-trade shadow-2xl">
        <div className="flex items-center justify-between border-b border-futures-border p-5">
          <h2 className="text-lg font-black text-white">레버리지 조정</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex gap-2 rounded-lg bg-black/30 p-1 border border-futures-border">
            <button
              onClick={() => handleSideChange("LONG")}
              className={`flex-1 rounded-md py-2 text-xs font-black transition-all ${
                activeSide === "LONG" ? "bg-trade-long text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              LONG
            </button>
            <button
              onClick={() => handleSideChange("SHORT")}
              className={`flex-1 rounded-md py-2 text-xs font-black transition-all ${
                activeSide === "SHORT" ? "bg-trade-short text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              SHORT
            </button>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-xs font-bold text-gray-400">{symbol}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#F0B90B]">{leverage}</span>
                <span className="text-sm font-bold text-gray-500">x</span>
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={maxLeverage}
              step={1}
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-black/40 accent-[#F0B90B]"
            />

            <div className="mt-4 grid grid-cols-5 gap-2">
              {LEVERAGE_STEPS.filter((s) => s <= maxLeverage).slice(0, 5).map((step) => (
                <button
                  key={step}
                  onClick={() => setLeverage(step)}
                  className={`rounded py-1.5 text-[10px] font-black transition-colors ${
                    leverage === step ? "bg-[#F0B90B] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {step}x
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg bg-white/5 p-4 text-xs border border-futures-border">
            <div className="flex justify-between">
              <span className="text-gray-400">최대 포지션 가치</span>
              <span className="font-bold text-white">
                {currentInfo ? formatAssetNumber(currentInfo.availableOrderNotionalAmount) : "-"} USDT
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-500">
              * 레버리지를 높이면 청산 가격이 현재가와 가까워져 위험이 증가합니다.
            </p>
          </div>

          {error && <p className="mt-4 text-center text-xs font-bold text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 bg-black/20 p-6 border-t border-futures-border">
          <Button variant="ghost" className="flex-1 !border-futures-border !text-gray-400 hover:!text-white hover:!bg-white/5" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="yellow"
            className="flex-1 bg-[#F0B90B] text-white hover:bg-[#F0B90B]/90 !border-none"
            onClick={handleConfirm}
            isLoading={isSubmitting}
          >
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
