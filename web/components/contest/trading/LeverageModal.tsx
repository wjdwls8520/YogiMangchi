"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import type { FuturesLeverageInfo, FuturesPositionSide } from "@/types/futures";

type LeverageModalProps = {
  symbol: string;
  initialPositionSide: FuturesPositionSide;
  leverageInfoBySide: Partial<Record<FuturesPositionSide, FuturesLeverageInfo>>;
  onPositionSideChange: (positionSide: FuturesPositionSide) => void;
  onConfirm: (
    positionSide: FuturesPositionSide,
    leverage: number
  ) => Promise<FuturesLeverageInfo>;
  onClose: () => void;
};

const SLIDER_MARKS = [1, 2, 3, 5, 10, 20, 25, 50, 75, 100, 125];
const POSITION_SIDE_OPTIONS: FuturesPositionSide[] = ["LONG", "SHORT"];

export default function LeverageModal({
  symbol,
  initialPositionSide,
  leverageInfoBySide,
  onPositionSideChange,
  onConfirm,
  onClose,
}: LeverageModalProps) {
  const { alert, confirm, toast } = useFeedback();
  const [activeSide, setActiveSide] =
    useState<FuturesPositionSide>(initialPositionSide);
  const activeLeverageInfo = leverageInfoBySide[activeSide];
  const fallbackMaxLeverage =
    leverageInfoBySide.LONG?.maxLeverage ??
    leverageInfoBySide.SHORT?.maxLeverage ??
    1;
  const currentLeverage = activeLeverageInfo?.leverage ?? 1;
  const maxLeverage = activeLeverageInfo?.maxLeverage ?? fallbackMaxLeverage;
  const [leverage, setLeverage] = useState(currentLeverage);
  const [inputValue, setInputValue] = useState(String(currentLeverage));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const safeLeverage = Math.min(Math.max(1, Math.round(leverage)), maxLeverage);
  const sliderPercent = maxLeverage > 1
    ? ((safeLeverage - 1) / (maxLeverage - 1)) * 100
    : 0;

  const visibleMarks = SLIDER_MARKS.filter((m) => m <= maxLeverage);
  if (!visibleMarks.includes(maxLeverage)) {
    visibleMarks.push(maxLeverage);
  }

  useEffect(() => {
    const nextLeverage = activeLeverageInfo?.leverage ?? 1;

    setLeverage(nextLeverage);
    setInputValue(String(nextLeverage));
  }, [activeLeverageInfo?.leverage, activeSide]);

  const handleChangeSide = (nextSide: FuturesPositionSide) => {
    setActiveSide(nextSide);
    onPositionSideChange(nextSide);
  };

  const setLeverageFromValue = useCallback(
    (value: number) => {
      const clamped = Math.min(Math.max(1, Math.round(value)), maxLeverage);
      setLeverage(clamped);
      setInputValue(String(clamped));
    },
    [maxLeverage]
  );

  const handleInputChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "");
    setInputValue(sanitized);

    const numericValue = Number(sanitized);

    if (Number.isFinite(numericValue) && numericValue >= 1 && numericValue <= maxLeverage) {
      setLeverage(numericValue);
    }
  };

  const handleInputBlur = () => {
    const numericValue = Number(inputValue);

    if (!Number.isFinite(numericValue) || numericValue < 1) {
      setLeverageFromValue(1);
    } else if (numericValue > maxLeverage) {
      setLeverageFromValue(maxLeverage);
    } else {
      setLeverageFromValue(numericValue);
    }
  };

  const getLeverageFromSliderPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return safeLeverage;

      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      return Math.round(1 + percent * (maxLeverage - 1));
    },
    [maxLeverage, safeLeverage]
  );

  const handleSliderInteraction = useCallback(
    (clientX: number) => {
      setLeverageFromValue(getLeverageFromSliderPosition(clientX));
    },
    [getLeverageFromSliderPosition, setLeverageFromValue]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleSliderInteraction(e.clientX);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      handleSliderInteraction(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleSliderInteraction]);

  const handleConfirm = async () => {
    if (safeLeverage === currentLeverage) {
      onClose();
      return;
    }

    const isConfirmed = await confirm(
      `${symbol} ${activeSide} 레버리지를 ${safeLeverage}x 로 변경하시겠습니까?`
    );

    if (!isConfirmed) return;

    setIsSubmitting(true);

    try {
      await onConfirm(activeSide, safeLeverage);
      toast({
        title: `${activeSide} 레버리지가 ${safeLeverage}x 로 설정되었습니다.`,
        tone: "success",
      });
    } catch (error) {
      await alert(
        error instanceof Error
          ? error.message || "레버리지 설정에 실패했습니다."
          : "레버리지 설정에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-[400px] rounded-2xl bg-[#1E2329] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-black text-white">레버리지 조정</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Symbol & Side Tabs */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <span className="font-bold text-white">{symbol}</span>
          <div className="grid w-44 grid-cols-2 rounded bg-[#2B3139] p-1">
            {POSITION_SIDE_OPTIONS.map((side) => {
              const isActive = activeSide === side;

              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => handleChangeSide(side)}
                  className={`rounded px-3 py-1.5 text-center text-xs font-black transition-colors ${
                    isActive
                      ? side === "LONG"
                        ? "bg-[#2EBD85] text-white"
                        : "bg-[#F6465D] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {side === "LONG" ? "롱" : "숏"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leverage Input */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLeverageFromValue(safeLeverage - 1)}
            disabled={safeLeverage <= 1}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2B3139] text-lg font-black text-white transition-colors hover:bg-[#353C46] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInputBlur();
                }
              }}
              className="w-full rounded-lg border border-[#F0B90B]/50 bg-transparent px-4 py-2 text-center text-2xl font-black text-[#F0B90B] outline-none focus:border-[#F0B90B]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
              x
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLeverageFromValue(safeLeverage + 1)}
            disabled={safeLeverage >= maxLeverage}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2B3139] text-lg font-black text-white transition-colors hover:bg-[#353C46] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {/* Slider */}
        <div className="mb-5">
          <div
            ref={sliderRef}
            className="relative h-6 cursor-pointer select-none"
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              handleSliderInteraction(e.clientX);
            }}
            onTouchStart={(e) => {
              isDraggingRef.current = true;
              handleSliderInteraction(e.touches[0].clientX);
            }}
          >
            {/* Track */}
            <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#2B3139]" />
            {/* Active Track */}
            <div
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#F0B90B]"
              style={{ width: `${sliderPercent}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${sliderPercent}%` }}
            >
              <div className="h-4 w-4 rounded-full border-2 border-[#F0B90B] bg-[#1E2329] shadow-md transition-transform hover:scale-110" />
            </div>
          </div>

          {/* Mark Buttons */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visibleMarks.map((mark) => (
              <button
                key={mark}
                type="button"
                onClick={() => setLeverageFromValue(mark)}
                className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                  safeLeverage === mark
                    ? "bg-[#F0B90B] text-[#1E2329]"
                    : "bg-[#2B3139] text-gray-400 hover:bg-[#353C46] hover:text-white"
                }`}
              >
                {mark}x
              </button>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div className="mb-5 rounded-lg bg-[#F0B90B]/10 px-4 py-3 text-xs leading-relaxed text-[#F0B90B]/80">
          레버리지를 높이면 청산 위험이 증가합니다. 최대 레버리지는{" "}
          <strong>{maxLeverage}x</strong>입니다.
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#F0B90B] py-3 text-sm font-black text-[#1E2329] transition-colors hover:bg-[#F0B90B]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "변경 중..." : `${safeLeverage}x 확인`}
        </button>
      </div>
    </div>
  );
}
