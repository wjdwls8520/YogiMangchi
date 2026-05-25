"use client";

import { useEffect, useRef, useState } from "react";
import LeverageModal from "@/components/futures/trading/LeverageModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireVerifiedUser } from "@/hooks/useWithAuth";
import { formatAssetNumber, formatSignedAssetNumber } from "@/lib/utils/number";
import { formatFuturesPositionSide } from "@/lib/utils/futures";
import { useTickerStore } from "@/stores/useTickerStore";
import type {
  FuturesLimitOpenOrderParams,
  FuturesLimitCloseOrderParams,
  FuturesOpenOrderParams,
  FuturesWalletStatus,
  FuturesLeverageInfo,
  FuturesLimitOrderResponse,
  FuturesMarketOrderResponse,
  FuturesPositionItem,
  FuturesPositionSide,
} from "@/types/futures";
import { cn } from "@/lib/utils/cs";

/* ────────────────── types ────────────────── */

type OrderMainTab = "open" | "close";
type OrderExecutionType = "MARKET" | "LIMIT";

export type FuturesOrderPanelProps = {
  walletStatus: FuturesWalletStatus;
  leverageInfo: FuturesLeverageInfo | null;
  leverageInfoByKey: Record<string, FuturesLeverageInfo>;
  leverageErrorMessage: string;
  isLoadingLeverage: boolean;
  isUpdatingLeverage: boolean;
  updatingLeverageKey: string | null;
  isSubmitting: boolean;
  isTradingEnabled: boolean;
  positionSide: FuturesPositionSide;
  openPositions: FuturesPositionItem[];
  closingPositionId: number | null;
  pendingCloseQuantityByPositionKey: Record<string, number>;
  onPositionSideChange: (side: FuturesPositionSide) => void;
  onUpdatePositionLeverage: (
    symbol: string,
    positionSide: FuturesPositionSide,
    leverage: number
  ) => Promise<FuturesLeverageInfo>;
  onSubmitOpenOrder: (params: FuturesOpenOrderParams) => Promise<unknown>;
  onSubmitLimitOpenOrder: (params: FuturesLimitOpenOrderParams) => Promise<unknown>;
  onClosePosition: (params: { positionId: number; closeQuantity: number }) => Promise<FuturesMarketOrderResponse>;
  onSubmitLimitCloseOrder: (params: FuturesLimitCloseOrderParams) => Promise<FuturesLimitOrderResponse>;
  disabledMessage?: string;
  mode?: "trade" | "mock" | "contest";
  onOpenTransferModal?: () => void;
};

/* ────────────────── constants ────────────────── */

const TRADE_FEE_RATE = 0.0005;
const LIMIT_TRADE_FEE_RATE = 0.0003;
const LIQUIDATION_FEE_RATE = 0.0005;
const MIN_ORDER_NOTIONAL_AMOUNT = 10;
const ORDER_RATIO_OPTIONS = [
  { label: "10%", ratio: 0.1 },
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "100%", ratio: 1 },
];

/* ────────────────── helpers ────────────────── */

const sanitizeDecimalInput = (value: string) => {
  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart, ...rest] = normalized.split(".");
  return rest.length === 0 ? integerPart : `${integerPart}.${rest.join("")}`;
};

const toInputValue = (v: number, d = 8) =>
  Number.isFinite(v) && v > 0 ? v.toFixed(d).replace(/\.?0+$/, "") : "";

const formatQty = (v?: number | null) =>
  formatAssetNumber(v, { standardMaxFractionDigits: 4, smallMaxFractionDigits: 8 });

const getPendingKey = (p: FuturesPositionItem) =>
  `${p.symbol}-${p.positionSide}`;
const getLeverageKey = (symbol: string, side: FuturesPositionSide) =>
  `${symbol}-${side}`;

/* ────────────────── component ────────────────── */

export default function FuturesOrderPanel({
  walletStatus,
  leverageInfo,
  leverageInfoByKey,
  leverageErrorMessage,
  isLoadingLeverage,
  isUpdatingLeverage,
  updatingLeverageKey,
  isSubmitting,
  isTradingEnabled,
  positionSide,
  openPositions,
  closingPositionId,
  pendingCloseQuantityByPositionKey,
  onPositionSideChange,
  onUpdatePositionLeverage,
  onSubmitOpenOrder,
  onSubmitLimitOpenOrder,
  onClosePosition,
  onSubmitLimitCloseOrder,
  disabledMessage = "현재 거래가 가능한 상태가 아닙니다.",
  mode = "trade",
  onOpenTransferModal,
}: FuturesOrderPanelProps) {
  const selectedCoin = useTickerStore((s) => s.selectedCoin);
  const coinMetaList = useTickerStore((s) => s.coinMetaList);
  const realtime = useTickerStore((s) => s.tickers[s.selectedCoin]);
  const selectedOrderPrice = useTickerStore((s) => s.selectedOrderPrice);
  const setSelectedOrderPrice = useTickerStore((s) => s.setSelectedOrderPrice);
  const { alert, confirm, toast } = useFeedback();
  const requireVerifiedUser = useRequireVerifiedUser({ loginRedirectMode: "push", verifyRedirectMode: "push" });

  const [mainTab, setMainTab] = useState<OrderMainTab>("open");
  const [execType, setExecType] = useState<OrderExecutionType>("LIMIT");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [selectedOpenRatio, setSelectedOpenRatio] = useState<number | null>(null);
  const [isLeverageModalOpen, setIsLeverageModalOpen] = useState(false);
  const orderPriceInputRef = useRef<HTMLInputElement>(null);
  const orderQuantityInputRef = useRef<HTMLInputElement>(null);

  // Close tab states
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [closeExecType, setCloseExecType] = useState<OrderExecutionType>("MARKET");
  const [closePrice, setClosePrice] = useState("");
  const [closeQuantity, setCloseQuantity] = useState("");

  // 호가/체결 클릭 → 가격 자동 입력
  useEffect(() => {
    if (selectedOrderPrice === null) return;
    const priceStr = toInputValue(selectedOrderPrice);
    if (!priceStr) return;

    const frameId = window.requestAnimationFrame(() => {
      if (mainTab === "open") {
        setExecType("LIMIT");
        setOrderPrice(priceStr);
      } else {
        setCloseExecType("LIMIT");
        setClosePrice(priceStr);
      }
      setSelectedOrderPrice(null);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [selectedOrderPrice, mainTab, setSelectedOrderPrice]);

  const meta = coinMetaList.find((c) => c.symbol === selectedCoin);
  if (!meta) return <div className="h-full animate-pulse bg-futures-trade" />;

  // 기획 정책: 본투자 선물거래 탭의 오더폼에도 대회선물거래에 사용하는 특화된 다크테마(bg-futures-trade 등)를 완벽하게 동일하게 적용합니다.
  const isContest = mode === "contest" || mode === "trade";
  const isDark = true;

  const currentPrice = realtime?.price ?? 0;
  const isRealtimeReady = currentPrice > 0;
  const getSideLeverageInfo = (side: FuturesPositionSide) =>
    leverageInfoByKey[getLeverageKey(selectedCoin, side)] ??
    (leverageInfo?.positionSide === side ? leverageInfo : undefined);
  const longLeverageInfo = getSideLeverageInfo("LONG");
  const shortLeverageInfo = getSideLeverageInfo("SHORT");
  const availableBalance = Math.max(0, walletStatus.currentMoney);

  /* ═══════ OPEN tab logic ═══════ */
  const isLimit = execType === "LIMIT";
  const currentFeeRate = isLimit ? LIMIT_TRADE_FEE_RATE : TRADE_FEE_RATE;

  const numPrice = Number(orderPrice);
  const numQty = Number(orderQuantity);
  const hasValidLimitPrice = Number.isFinite(numPrice) && numPrice > 0;
  const canCalculateOpenOrder = !isLimit || hasValidLimitPrice;
  const refPrice = canCalculateOpenOrder
    ? isLimit
      ? numPrice
      : currentPrice
    : 0;

  const showLimitPriceRequiredToast = () => {
    if (!isLimit || hasValidLimitPrice) {
      return false;
    }

    toast({
      title: "지정가를 입력해 주세요.",
      description: "수량 계산은 지정가 입력 후 가능합니다.",
      tone: "error",
    });

    window.requestAnimationFrame(() => {
      orderPriceInputRef.current?.focus();
    });

    return true;
  };

  const getOpenEstimate = (side: FuturesPositionSide) => {
    const sideLeverageInfo = getSideLeverageInfo(side);
    const leverage = sideLeverageInfo?.leverage ?? 0;
    
    // 수수료를 포함하여 가용 잔고 내에서 체결할 수 있는 진짜 최대 명목 금액
    const balanceMaxNotional =
      leverage > 0
        ? (availableBalance * leverage) / (1 + currentFeeRate * leverage)
        : 0;
        
    const leverageMaxNotional =
      sideLeverageInfo && sideLeverageInfo.availableOrderNotionalAmount > 0
        ? sideLeverageInfo.availableOrderNotionalAmount
        : balanceMaxNotional;
        
    // 부동소수점 오차로 인해 가용 자금을 초과하는 현상을 막기 위해 0.9999 등 미세하게 깎는 방법도 있으나
    // 금액이 작을 때를 고려해 안전마진 없이 정확하게 계산된 값을 활용하되, 미세한 절사를 추가합니다.
    const maxNotional =
      balanceMaxNotional > 0 && leverageMaxNotional > 0
        ? Math.min(balanceMaxNotional, leverageMaxNotional) * 0.999999
        : Math.max(balanceMaxNotional, leverageMaxNotional) * 0.999999;
        
    const maxQty = refPrice > 0 ? maxNotional / refPrice : 0;
    const orderQty =
      selectedOpenRatio !== null
        ? maxQty * selectedOpenRatio
        : numQty;
        
    const estNotional =
      Number.isFinite(orderQty) && orderQty > 0 && refPrice > 0
        ? orderQty * refPrice
        : 0;
    const estMargin = leverage > 0 ? estNotional / leverage : 0;
    const estFee = estNotional * currentFeeRate;
    const estRequired = estMargin + estFee;
    const estLiquidationPrice =
      estNotional > 0 && leverage > 0
        ? side === "LONG"
          ? refPrice * (1 - 1 / leverage + LIQUIDATION_FEE_RATE)
          : refPrice * (1 + 1 / leverage - LIQUIDATION_FEE_RATE)
        : null;

    return {
      side,
      leverage,
      maxQty,
      orderQty,
      estNotional,
      estRequired,
      estFee,
      estLiquidationPrice,
    };
  };

  const longOpenEstimate = getOpenEstimate("LONG");
  const shortOpenEstimate = getOpenEstimate("SHORT");
  const openEstimates = [longOpenEstimate, shortOpenEstimate];
  const getOpenEstimateBySide = (side: FuturesPositionSide) =>
    side === "LONG" ? longOpenEstimate : shortOpenEstimate;
  const hasMinOrderNotionalError =
    openEstimates.some(
      (estimate) =>
        estimate.estNotional > 0 &&
        estimate.estNotional < MIN_ORDER_NOTIONAL_AMOUNT
    );
  const hasBalanceExceeded = openEstimates.some(
    (estimate) =>
      estimate.estNotional > 0 &&
      estimate.estRequired > availableBalance
  );

  const handleOpenRatio = (ratio: number) => {
    if (showLimitPriceRequiredToast()) {
      return;
    }

    if (availableBalance <= 0) {
      toast({
        title: "자산 이체 필요",
        description: "선물 지갑 잔고가 0원입니다. 자산 이체 후 비율 입력이 가능합니다.",
        tone: "error",
      });
      return;
    }

    if (!longLeverageInfo && !shortLeverageInfo) {
      toast({
        title: "레버리지 확인 필요",
        description: "레버리지 정보를 불러온 뒤 비율 입력이 가능합니다.",
        tone: "error",
      });
      return;
    }

    setSelectedOpenRatio(ratio);
    setOrderQuantity("");
  };

  const activateManualOrderQuantityInput = () => {
    if (showLimitPriceRequiredToast()) {
      return;
    }

    setSelectedOpenRatio(null);
    window.requestAnimationFrame(() => {
      orderQuantityInputRef.current?.focus();
    });
  };

  const handleOpenSubmit = async (side: FuturesPositionSide) => {
    const openEstimate = getOpenEstimateBySide(side);
    const openQty = openEstimate.orderQty;

    if (!isTradingEnabled) { await alert(disabledMessage); return; }
    if (!(await requireVerifiedUser())) return;
    if (!getSideLeverageInfo(side)) { await alert(`${side} 레버리지 정보를 확인한 뒤 다시 시도해 주세요.`); return; }
    if (!isRealtimeReady) { await alert("실시간 시세 연결 후 다시 시도해 주세요."); return; }
    if (isLimit) {
      if (!numPrice || numPrice <= 0) { await alert("지정가를 입력해 주세요."); return; }
      if (side === "LONG" && numPrice >= currentPrice) { await alert("LONG 지정가는 현재가보다 낮아야 합니다."); return; }
      if (side === "SHORT" && numPrice <= currentPrice) { await alert("SHORT 지정가는 현재가보다 높아야 합니다."); return; }
    }
    if (!openQty || openQty <= 0) { await alert("수량을 입력해 주세요."); return; }
    if (openEstimate.estNotional < MIN_ORDER_NOTIONAL_AMOUNT) { await alert(`최소 명목금액 ${formatAssetNumber(MIN_ORDER_NOTIONAL_AMOUNT)} 이상이어야 합니다.`); return; }
    if (availableBalance <= 0) {
      if (await confirm("주문 가능 금액이 0원입니다.\n자산 이체하시겠습니까?")) {
        onOpenTransferModal?.();
      }
      return;
    }
    if (openEstimate.estRequired > availableBalance) {
      await alert("가용 자금을 초과했습니다.");
      return;
    }

    try {
      onPositionSideChange(side);

      if (isLimit) {
        await onSubmitLimitOpenOrder({ symbol: selectedCoin, positionSide: side, orderPrice: numPrice, orderQuantity: openQty });
      } else {
        await onSubmitOpenOrder({ symbol: selectedCoin, positionSide: side, orderQuantity: openQty });
      }
      toast({ title: `${formatFuturesPositionSide(side)} ${isLimit ? "지정가 진입 주문 등록" : "시장가 진입 완료"}`, tone: "success" });
      setOrderQuantity("");
      setSelectedOpenRatio(null);
    } catch (e) {
      await alert(e instanceof Error ? e.message || "주문 실패" : "주문 실패");
    }
  };

  /* ═══════ CLOSE tab logic ═══════ */
  const selectedPosition = openPositions.find((p) => p.positionId === selectedPositionId) ?? null;
  const pendingCloseQty = selectedPosition ? (pendingCloseQuantityByPositionKey[getPendingKey(selectedPosition)] ?? 0) : 0;
  const closeableQty = selectedPosition ? Math.max(0, selectedPosition.filledQuantity - pendingCloseQty) : 0;
  const isCloseLimit = closeExecType === "LIMIT";
  const numCloseQty = Number(closeQuantity);

  const handleCloseRatio = (ratio: number) => { if (closeableQty > 0) setCloseQuantity(toInputValue(closeableQty * ratio)); };

  const handleCloseSubmit = async () => {
    if (!selectedPosition) { await alert("청산할 포지션을 선택해 주세요."); return; }
    if (!isTradingEnabled) { await alert(disabledMessage); return; }
    if (!(await requireVerifiedUser())) return;
    const qty = numCloseQty;
    if (!qty || qty <= 0) { await alert("청산 수량을 입력해 주세요."); return; }
    if (qty > closeableQty) { await alert("청산 가능 수량을 초과했습니다."); return; }

    if (isCloseLimit) {
      const cp = Number(closePrice);
      if (!cp || cp <= 0) { await alert("지정가를 입력해 주세요."); return; }

      // 가격 방향 검증 (익절만 허용)
      if (selectedPosition.positionSide === "LONG" && cp <= currentPrice) {
        await alert("LONG 청산 지정가는 현재가보다 높아야 합니다. (익절)");
        return;
      }
      if (selectedPosition.positionSide === "SHORT" && cp >= currentPrice) {
        await alert("SHORT 청산 지정가는 현재가보다 낮아야 합니다. (익절)");
        return;
      }
    }

    const isConfirmed = await confirm(
      `${formatFuturesPositionSide(selectedPosition.positionSide)} 포지션 ${formatQty(qty)}개를 ${isCloseLimit ? '지정가' : '시장가'}로 청산하시겠습니까?`
    );
    if (!isConfirmed) return;

    try {
      if (isCloseLimit) {
        const cp = Number(closePrice);

        await onSubmitLimitCloseOrder({ positionId: selectedPosition.positionId, closeQuantity: qty, orderPrice: cp });
        toast({ title: `${formatFuturesPositionSide(selectedPosition.positionSide)} 지정가 청산 주문 등록`, tone: "success" });
      } else {
        const res = await onClosePosition({ positionId: selectedPosition.positionId, closeQuantity: qty });
        toast({
          title: `${formatFuturesPositionSide(selectedPosition.positionSide)} 시장가 청산 완료`,
          description: res.thisCloseRealizedPnl != null ? `실현손익 ${formatSignedAssetNumber(res.thisCloseRealizedPnl)}` : undefined,
          tone: "success",
        });
      }
      setCloseQuantity("");
      setClosePrice("");
    } catch (e) {
      await alert(e instanceof Error ? e.message || "청산 실패" : "청산 실패");
    }
  };

  const isFormDisabled = isSubmitting || isLoadingLeverage || isUpdatingLeverage || !isTradingEnabled || !isRealtimeReady;

  /* ═══════ shared UI pieces ═══════ */
  const inputCls = cn(
    "flex items-center rounded border transition-colors px-3 py-[8px] lg:py-[6px] focus-within:border-[#F0B90B]",
    isContest ? "bg-white/5 border-futures-border" : (isDark ? "bg-zinc-900 border-gray-700" : "bg-slate-50 border-gray-100")
  );
  const labelCls = cn(
    "text-[12px] font-medium w-14 shrink-0",
    isDark ? "text-gray-400" : "text-slate-400"
  );
  const fieldCls = cn(
    "flex-1 min-w-0 bg-transparent text-right text-[13px] outline-none font-bold",
    isDark ? "text-white" : "text-slate-900"
  );
  const mutedTextCls = isDark ? "text-gray-400" : "text-slate-400";
  const openEstimatePairCls = "flex min-w-0 items-center justify-end gap-x-1 overflow-x-auto whitespace-nowrap text-right text-[11px] font-bold tabular-nums no-scrollbar";
  const getOpenSideColorClass = (side: FuturesPositionSide) =>
    side === "LONG"
      ? (isContest ? "text-trade-long" : "text-[#2EBD85]")
      : (isContest ? "text-trade-short" : "text-[#F6465D]");
  const formatOpenBaseValue = (value?: number | null) =>
    value && value > 0 ? formatQty(value) : "--";
  const formatOpenQuoteValue = (value?: number | null) =>
    value && value > 0 ? formatAssetNumber(value) : "--";
  const renderOpenEstimateValues = ({
    longValue,
    shortValue,
    formatter,
  }: {
    longValue?: number | null;
    shortValue?: number | null;
    formatter: (value?: number | null) => string;
  }) => (
    <>
      <span className={getOpenSideColorClass("LONG")}>{formatter(longValue)}</span>
      <span className="text-gray-600">/</span>
      <span className={getOpenSideColorClass("SHORT")}>{formatter(shortValue)}</span>
    </>
  );
  const renderOpenEstimatePair = ({
    longValue,
    shortValue,
    formatter,
    unit,
  }: {
    longValue?: number | null;
    shortValue?: number | null;
    formatter: (value?: number | null) => string;
    unit: string;
  }) => (
    <span className={openEstimatePairCls}>
      {renderOpenEstimateValues({ longValue, shortValue, formatter })}
      <span className={mutedTextCls}>{unit}</span>
    </span>
  );

  return (
    <section className={cn("flex flex-col overflow-y-auto", isContest ? "bg-futures-trade text-white" : (isDark ? "bg-gray-800 text-gray-100" : "bg-white text-slate-900"))}>
      {/* Margin + Leverage Row */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b shrink-0", isContest ? "border-futures-border" : (isDark ? "border-gray-700" : "border-gray-100"))}>
        <span className={cn("text-xs font-semibold", isDark ? "text-gray-500" : "text-slate-400")}>Isolated</span>
        <button
          type="button"
          onClick={() => setIsLeverageModalOpen(true)}
          disabled={
            isLoadingLeverage ||
            isUpdatingLeverage ||
            Boolean(updatingLeverageKey) ||
            (!longLeverageInfo && !shortLeverageInfo)
          }
          className={cn(
            "rounded px-3 py-1 text-xs font-black text-[#F0B90B] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
            isDark ? "bg-zinc-900" : "bg-slate-100"
          )}
        >
          {isLoadingLeverage ? (
            "..."
          ) : (
            <span className="flex items-center gap-1.5">
              <span className={isContest ? "text-trade-long" : "text-[#2EBD85]"}>{longLeverageInfo?.leverage ?? "-"}x</span>
              <span className="text-gray-600 dark:text-gray-500">/</span>
              <span className={isContest ? "text-trade-short" : "text-[#F6465D]"}>{shortLeverageInfo?.leverage ?? "-"}x</span>
            </span>
          )}
        </button>
      </div>
      {leverageErrorMessage && <p className="px-4 py-1.5 text-[10px] font-semibold text-red-500 shrink-0">{leverageErrorMessage}</p>}

      {/* Open / Close Main Tabs */}
      <div className="grid grid-cols-2 shrink-0">
        <button
          type="button"
          onClick={() => setMainTab("open")}
          className={cn(
            "py-2.5 text-center text-[13px] font-bold transition-colors border-b-2",
            mainTab === "open"
              ? (isDark ? "text-white border-[#F0B90B]" : "text-slate-900 border-[#F0B90B]")
              : (isDark ? "text-gray-500 border-transparent hover:text-gray-300" : "text-slate-400 border-transparent hover:text-slate-600")
          )}
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => setMainTab("close")}
          className={cn(
            "py-2.5 text-center text-[13px] font-bold transition-colors border-b-2",
            mainTab === "close"
              ? (isDark ? "text-white border-[#F0B90B]" : "text-slate-900 border-[#F0B90B]")
              : (isDark ? "text-gray-500 border-transparent hover:text-gray-300" : "text-slate-400 border-transparent hover:text-slate-600")
          )}
        >
          Close
        </button>
      </div>

      {/* ═══════ OPEN TAB ═══════ */}
      {mainTab === "open" && (
        <div className="px-4 pt-4 pb-5 space-y-3">
          {/* Limit / Market */}
          <div className="flex gap-5 text-[13px] font-bold">
            <button onClick={() => setExecType("LIMIT")} className={isLimit ? (isDark ? "text-white" : "text-slate-900") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}>지정가</button>
            <button onClick={() => setExecType("MARKET")} className={!isLimit ? (isDark ? "text-white" : "text-slate-900") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}>시장가</button>
          </div>

          {/* Price */}
          {isLimit ? (
            <div className={inputCls}>
              <span className={labelCls}>가격</span>
              <input
                ref={orderPriceInputRef}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={orderPrice}
                onChange={(e) => setOrderPrice(sanitizeDecimalInput(e.target.value))}
                className={fieldCls}
              />
              <span className="text-[12px] font-medium ml-2 shrink-0 text-gray-500">{meta.quoteAsset}</span>
            </div>
          ) : (
            <div className={cn("flex items-center rounded border px-3 py-[6px]", isContest ? "bg-white/5 border-futures-border" : (isDark ? "bg-zinc-900 border-gray-700" : "bg-slate-50 border-gray-100"))}>
              <span className={labelCls}>가격</span>
              <span className={cn("flex-1 text-right text-[13px] font-bold", isDark ? "text-gray-500" : "text-slate-400")}>시장가</span>
            </div>
          )}

          {/* Quantity */}
          <div className={inputCls}>
            <span className={labelCls}>수량</span>
            {selectedOpenRatio !== null ? (
              <button
                type="button"
                onClick={activateManualOrderQuantityInput}
                className={cn(fieldCls, openEstimatePairCls)}
              >
                {renderOpenEstimateValues({
                  longValue: longOpenEstimate.orderQty,
                  shortValue: shortOpenEstimate.orderQty,
                  formatter: formatOpenBaseValue,
                })}
              </button>
            ) : (
              <input
                ref={orderQuantityInputRef}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={orderQuantity}
                onFocus={() => {
                  showLimitPriceRequiredToast();
                }}
                onChange={(e) => {
                  if (showLimitPriceRequiredToast()) {
                    return;
                  }

                  setSelectedOpenRatio(null);
                  setOrderQuantity(sanitizeDecimalInput(e.target.value));
                }}
                className={fieldCls}
              />
            )}
            <span className="text-[12px] font-medium ml-2 shrink-0 text-gray-500">{meta.baseAsset}</span>
          </div>

          {/* Ratio */}
          <div className="flex gap-1.5">
            {ORDER_RATIO_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => handleOpenRatio(o.ratio)}
                className={cn(
                  "flex-1 rounded-[4px] py-1 text-center text-[11px] font-bold transition-colors",
                  selectedOpenRatio === o.ratio
                    ? "bg-[#F0B90B]/15 text-[#F0B90B]"
                    : (isDark ? "bg-zinc-900 text-gray-400 hover:bg-zinc-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Validation */}
          {hasMinOrderNotionalError && <p className="text-[11px] font-semibold text-[#F6465D]">최소 명목금액 {formatAssetNumber(MIN_ORDER_NOTIONAL_AMOUNT)} 이상</p>}
          {hasBalanceExceeded && <p className="text-[11px] font-semibold text-[#F6465D]">가용 자금 초과</p>}

          {/* Info */}
          <div className="space-y-[6px] text-[12px] pt-1">
            <div className="flex items-center justify-between gap-3">
              <span className={mutedTextCls}>최대 수량</span>
              {renderOpenEstimatePair({
                longValue: longOpenEstimate.maxQty,
                shortValue: shortOpenEstimate.maxQty,
                formatter: formatOpenBaseValue,
                unit: meta.baseAsset,
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={mutedTextCls}>명목가치</span>
              {renderOpenEstimatePair({
                longValue: longOpenEstimate.estNotional,
                shortValue: shortOpenEstimate.estNotional,
                formatter: formatOpenQuoteValue,
                unit: meta.quoteAsset,
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={mutedTextCls}>비용</span>
              {renderOpenEstimatePair({
                longValue: longOpenEstimate.estRequired,
                shortValue: shortOpenEstimate.estRequired,
                formatter: formatOpenQuoteValue,
                unit: meta.quoteAsset,
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={mutedTextCls}>수수료 ({(currentFeeRate * 100).toFixed(2)}%)</span>
              {renderOpenEstimatePair({
                longValue: longOpenEstimate.estFee,
                shortValue: shortOpenEstimate.estFee,
                formatter: formatOpenQuoteValue,
                unit: meta.quoteAsset,
              })}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className={mutedTextCls}>예상 청산가</span>
              {renderOpenEstimatePair({
                longValue: longOpenEstimate.estLiquidationPrice,
                shortValue: shortOpenEstimate.estLiquidationPrice,
                formatter: formatOpenQuoteValue,
                unit: meta.quoteAsset,
              })}
            </div>
            <div className={cn("flex items-center justify-between gap-3 pt-1 border-t", isContest ? "border-futures-border" : (isDark ? "border-gray-700" : "border-gray-100"))}>
              <span className={mutedTextCls}>주문 가능</span>
              {renderOpenEstimatePair({
                longValue: availableBalance,
                shortValue: availableBalance,
                formatter: formatOpenQuoteValue,
                unit: meta.quoteAsset,
              })}
            </div>
          </div>

          {/* Long / Short Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={isFormDisabled}
              onClick={() => void handleOpenSubmit("LONG")}
              className={cn("flex-1 rounded py-3 text-[13px] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed", isContest ? "bg-trade-long hover:bg-trade-long/90" : "bg-[#2EBD85] hover:bg-[#2EBD85]/90")}
            >
              {isSubmitting ? "주문 중..." : "Open Long"}
            </button>
            <button
              type="button"
              disabled={isFormDisabled}
              onClick={() => void handleOpenSubmit("SHORT")}
              className={cn("flex-1 rounded py-3 text-[13px] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed", isContest ? "bg-trade-short hover:bg-trade-short/90" : "bg-[#F6465D] hover:bg-[#F6465D]/90")}
            >
              {isSubmitting ? "주문 중..." : "Open Short"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ CLOSE TAB ═══════ */}
      {mainTab === "close" && (
        <div className="px-4 pt-4 pb-5 space-y-3">
          {/* Position Selector */}
          <div>
            <label className={cn("text-[11px] font-bold mb-1.5 block", isContest ? "text-white/30" : "text-slate-400")}>포지션 선택</label>
            {openPositions.length === 0 ? (
              <p className={cn("text-xs py-6 text-center", isContest ? "text-white/20" : "text-slate-400")}>보유 중인 오픈 포지션이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {openPositions.map((p) => {
                  const isSelected = selectedPositionId === p.positionId;
                  const markPrice = realtime?.price ?? 0;
                  const pnl = markPrice > 0 && p.filledQuantity > 0
                    ? p.positionSide === "LONG" ? (markPrice - p.entryPrice) * p.filledQuantity : (p.entryPrice - markPrice) * p.filledQuantity
                    : null;
                  return (
                    <button
                      key={p.positionId}
                      type="button"
                      onClick={() => {
                        setSelectedPositionId(isSelected ? null : p.positionId);
                        setCloseQuantity("");
                        setClosePrice("");
                      }}
                      className={cn(
                        "w-full rounded px-3 py-2 text-left text-[12px] transition-colors border",
                        isSelected
                          ? "bg-[#F0B90B]/10 border-[#F0B90B]/30"
                          : (isContest ? "bg-white/5 border-futures-border hover:border-futures-border-strong" : "bg-slate-50 border-gray-100 hover:border-gray-200")
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-black", isContest ? "text-white" : "text-slate-900")}>{p.symbol}</span>
                          <span className={cn("rounded px-1 py-0.5 text-[10px] font-black", p.positionSide === "LONG" ? (isContest ? "bg-trade-long/15 text-trade-long" : "bg-[#2EBD85]/15 text-[#2EBD85]") : (isContest ? "bg-trade-short/15 text-trade-short" : "bg-[#F6465D]/15 text-[#F6465D]"))}>
                            {p.positionSide}
                          </span>
                          <span className="text-slate-400">{p.leverage}x</span>
                        </div>
                        <span className={cn("font-bold", pnl != null ? (pnl >= 0 ? (isContest ? "text-trade-long" : "text-[#2EBD85]") : (isContest ? "text-trade-short" : "text-[#F6465D]")) : "text-slate-400")}>
                          {pnl != null ? formatSignedAssetNumber(pnl) : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between mt-0.5 text-slate-400">
                        <span>수량 {formatQty(p.filledQuantity)}</span>
                        <span>진입가 {formatAssetNumber(p.entryPrice)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedPosition && (
            <>
              {/* Close Exec Type */}
              <div className="flex gap-5 text-[13px] font-bold pt-1">
                <button onClick={() => setCloseExecType("MARKET")} className={!isCloseLimit ? (isDark ? "text-white" : "text-slate-900") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}>시장가</button>
                <button onClick={() => setCloseExecType("LIMIT")} className={isCloseLimit ? (isDark ? "text-white" : "text-slate-900") : (isDark ? "text-gray-500 hover:text-gray-300" : "text-slate-400 hover:text-slate-600")}>지정가</button>
              </div>

              {/* Close Price (Limit only) */}
              {isCloseLimit && (
                <div className={inputCls}>
                  <span className={labelCls}>가격</span>
                  <input type="text" inputMode="decimal" placeholder="0" value={closePrice} onChange={(e) => setClosePrice(sanitizeDecimalInput(e.target.value))} className={fieldCls} />
                  <span className="text-[12px] font-medium ml-2 shrink-0 text-gray-500">{meta.quoteAsset}</span>
                </div>
              )}

              {/* Close Quantity */}
              <div className={inputCls}>
                <span className={labelCls}>수량</span>
                <input type="text" inputMode="decimal" placeholder="0" value={closeQuantity} onChange={(e) => setCloseQuantity(sanitizeDecimalInput(e.target.value))} className={fieldCls} />
                <span className="text-[12px] font-medium ml-2 shrink-0 text-gray-500">{meta.baseAsset}</span>
              </div>

              {/* Close Ratio */}
              <div className="flex gap-1.5">
                {ORDER_RATIO_OPTIONS.map((o) => (
                  <button key={o.label} type="button" onClick={() => handleCloseRatio(o.ratio)} className={cn("flex-1 rounded-[4px] py-1 text-center text-[11px] font-bold transition-colors", isDark ? "bg-zinc-900 text-gray-400 hover:bg-zinc-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{o.label}</button>
                ))}
              </div>

              {/* Close Info */}
              <div className="space-y-[6px] text-[12px]">
                <div className="flex justify-between"><span className={isDark ? "text-gray-400" : "text-slate-400"}>청산 가능</span><span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>{formatQty(closeableQty)} {meta.baseAsset}</span></div>
                {pendingCloseQty > 0 && <div className="flex justify-between"><span className={isDark ? "text-gray-400" : "text-slate-400"}>대기 수량</span><span className="text-yellow-600 font-bold">{formatQty(pendingCloseQty)}</span></div>}
              </div>

              {/* Close Button */}
              <button
                type="button"
                disabled={closingPositionId === selectedPosition.positionId || closeableQty <= 0 || !isTradingEnabled}
                onClick={() => void handleCloseSubmit()}
                className={cn("w-full rounded py-3 text-[13px] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed", selectedPosition.positionSide === "LONG" ? (isContest ? "bg-trade-short hover:bg-trade-short/90" : "bg-[#F6465D] hover:bg-[#F6465D]/90") : (isContest ? "bg-trade-long hover:bg-trade-long/90" : "bg-[#2EBD85] hover:bg-[#2EBD85]/90"))}
              >
                {closingPositionId === selectedPosition.positionId ? "청산 중..." : isCloseLimit ? "지정가 청산" : "시장가 청산"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Leverage Modal */}
      {isLeverageModalOpen && (longLeverageInfo || shortLeverageInfo) && (
        <LeverageModal
          symbol={selectedCoin}
          initialPositionSide={positionSide}
          leverageInfoBySide={{
            LONG: longLeverageInfo,
            SHORT: shortLeverageInfo,
          }}
          onPositionSideChange={onPositionSideChange}
          onConfirm={(side, leverage) =>
            onUpdatePositionLeverage(selectedCoin, side, leverage)
          }
          onClose={() => setIsLeverageModalOpen(false)}
        />
      )}
    </section>
  );
}
