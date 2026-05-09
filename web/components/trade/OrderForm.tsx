"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireLogin } from "@/hooks/useWithAuth";
import { cn } from "@/lib/utils/cs";

/* ────────────────── Types ────────────────── */

type OrderExecutionType = "MARKET" | "LIMIT";
type OrderMainTab = "buy" | "sell";
type OrderMode = "mock" | "trade";

type OrderResult = {
  success: boolean;
  status?: string;
  message?: string;
};

type OrderHolding = {
  symbol: string;
  quantity: number;
  availableQuantity?: number;
};

type OrderSubmitParams = {
  memberId: number;
  symbol: string;
  side: "BUY" | "SELL";
  price?: number;
  quantity?: number;
  totalAmount?: number;
};

export type OrderFormProps = {
  mode?: OrderMode;
  // Optional props for external data control (mostly for trade mode)
  isParticipated?: boolean;
  isLoadingPortfolio?: boolean;
  usdtBalance?: number;
  holdings?: OrderHolding[];
  onSubmitMarketOrder?: (params: OrderSubmitParams) => Promise<OrderResult>;
  onSubmitLimitOrder?: (params: OrderSubmitParams) => Promise<OrderResult>;
};

/* ────────────────── Constants ────────────────── */

const MARKET_FEE_RATE = 0.0005;
const LIMIT_FEE_RATE = 0.0003;
const MIN_ORDER_AMOUNT = 10;
const ORDER_RATIO_OPTIONS = [
  { label: "10%", ratio: 0.1 },
  { label: "25%", ratio: 0.25 },
  { label: "50%", ratio: 0.5 },
  { label: "100%", ratio: 1 },
];

/* ────────────────── Helpers ────────────────── */

const sanitizeDecimalInput = (value: string) => {
  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart, ...rest] = normalized.split(".");
  return rest.length === 0 ? integerPart : `${integerPart}.${rest.join("")}`;
};

const toInputValue = (v: number, d = 8) =>
  Number.isFinite(v) && v > 0 ? v.toFixed(d).replace(/\.?0+$/, "") : "";

/* ────────────────── Component ────────────────── */

export default function OrderForm({
  mode = "trade",
  ...props
}: OrderFormProps) {
  const router = useRouter();
  const { isLogin, user } = useAuthStore();
  const { alert, toast } = useFeedback();
  const requireLogin = useRequireLogin({ redirectMode: "push" });

  // Ticker Store
  const selectedCoin = useTickerStore((s) => s.selectedCoin);
  const coinMetaList = useTickerStore((s) => s.coinMetaList);
  const realtime = useTickerStore((s) => s.tickers[s.selectedCoin]);
  const selectedOrderPrice = useTickerStore((s) => s.selectedOrderPrice);
  const setSelectedOrderPrice = useTickerStore((s) => s.setSelectedOrderPrice);

  // Mock Wallet Store (Used only in mock mode unless props are provided)
  const mockStore = useMockWalletStore();
  
  // Decide which data to use (Props vs Store)
  const isMock = mode === "mock";
  const isParticipated = props.isParticipated ?? (isMock ? mockStore.isParticipated : false);
  const isLoadingPortfolio = props.isLoadingPortfolio ?? (isMock ? mockStore.isLoadingPortfolio : false);
  const usdtBalance = props.usdtBalance ?? (isMock ? mockStore.usdtBalance : 0);
  const holdings = props.holdings ?? (isMock ? mockStore.holdings : []);
  
  const [orderTab, setOrderTab] = useState<OrderMainTab>("buy");
  const [execType, setExecType] = useState<OrderExecutionType>("MARKET");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [orderAmount, setOrderAmount] = useState(""); // For market buy
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync price from clicks
  useEffect(() => {
    if (selectedOrderPrice === null) return;
    const priceStr = toInputValue(selectedOrderPrice);
    if (!priceStr) return;

    setExecType("LIMIT");
    setOrderPrice(priceStr);
    setSelectedOrderPrice(null);
  }, [selectedOrderPrice, setSelectedOrderPrice]);

  const meta = coinMetaList.find((c) => c.symbol === selectedCoin);
  if (!meta) return <div className="h-full animate-pulse bg-[#161A1E]" />;

  const currentPrice = realtime?.price ?? 0;
  const isLimit = execType === "LIMIT";
  const isBuy = orderTab === "buy";
  
  const selectedHolding = holdings.find((item) => item.symbol === selectedCoin);
  const availableHolding = selectedHolding?.availableQuantity ?? selectedHolding?.quantity ?? 0;

  // Calculations
  const numPrice = Number(orderPrice);
  const numQty = Number(orderQuantity);
  const numAmount = Number(orderAmount);
  
  const refPrice = isLimit && numPrice > 0 ? numPrice : currentPrice;
  const currentFeeRate = isLimit ? LIMIT_FEE_RATE : MARKET_FEE_RATE;

  // Buy Max
  const maxBuyNotional = usdtBalance / (1 + currentFeeRate);
  const maxBuyQty = refPrice > 0 ? maxBuyNotional / refPrice : 0;
  
  // Market Buy expected qty
  const expectedBuyQuantity = (isBuy && !isLimit && currentPrice > 0 && numAmount > 0)
    ? (numAmount * (1 - currentFeeRate)) / currentPrice
    : 0;

  // Sell expected amount
  const expectedSellAmount = (!isBuy && currentPrice > 0 && numQty > 0)
    ? numQty * currentPrice * (1 - currentFeeRate)
    : 0;

  // Limit required amount
  const expectedLimitAmount = (isLimit && numPrice > 0 && numQty > 0) ? numPrice * numQty : 0;
  const estRequired = expectedLimitAmount * (1 + currentFeeRate);

  const handleRatio = (ratio: number) => {
    if (isBuy) {
      if (isLimit) {
        setOrderQuantity(toInputValue(maxBuyQty * ratio));
      } else {
        setOrderAmount(toInputValue(usdtBalance * ratio, 2));
      }
    } else {
      setOrderQuantity(toInputValue(availableHolding * ratio));
    }
  };

  const handleSubmit = async () => {
    if (mode === "trade") {
      await alert("실전 주문 API는 아직 연결 전입니다.");
      return;
    }

    if (!isLogin || !user) {
      if (!(await requireLogin())) return;
    }

    if (isMock && !isParticipated) {
      await alert("먼저 모의투자 계좌를 생성해 주세요.");
      return;
    }

    const side = isBuy ? "BUY" : "SELL";
    const memberId = user?.memberId || mockStore.ownerMemberId;
    if (!memberId) return;

    setIsSubmitting(true);
    try {
      if (isLimit) {
        if (!numPrice || numPrice <= 0) throw new Error("가격을 입력해 주세요.");
        if (!numQty || numQty <= 0) throw new Error("수량을 입력해 주세요.");
        if (expectedLimitAmount < MIN_ORDER_AMOUNT) throw new Error(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${meta.quoteAsset} 이상입니다.`);
        if (isBuy && estRequired > usdtBalance) throw new Error("가용 자금이 부족합니다.");
        if (!isBuy && numQty > availableHolding) throw new Error("보유 수량이 부족합니다.");

        if (isMock) {
          await mockStore.executeLimitOrder({ memberId, symbol: selectedCoin, side, price: numPrice, quantity: numQty });
        } else if (props.onSubmitLimitOrder) {
          const res = await props.onSubmitLimitOrder({ memberId, symbol: selectedCoin, side, price: numPrice, quantity: numQty });
          if (!res.success) throw new Error(res.message || "주문 실패");
        }
        
        toast({ title: "지정가 주문 완료", tone: "success" });
      } else {
        // Market
        if (isBuy) {
          if (!numAmount || numAmount <= 0) throw new Error("금액을 입력해 주세요.");
          if (numAmount < MIN_ORDER_AMOUNT) throw new Error(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${meta.quoteAsset} 이상입니다.`);
          if (numAmount > usdtBalance) throw new Error("가용 자금이 부족합니다.");
        } else {
          if (!numQty || numQty <= 0) throw new Error("수량을 입력해 주세요.");
          if (expectedSellAmount < MIN_ORDER_AMOUNT) throw new Error(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${meta.quoteAsset} 이상입니다.`);
          if (numQty > availableHolding) throw new Error("보유 수량이 부족합니다.");
        }

        if (isMock) {
          await mockStore.executeMarketOrder(
            isBuy 
              ? { memberId, symbol: selectedCoin, side, totalAmount: numAmount }
              : { memberId, symbol: selectedCoin, side, quantity: numQty }
          );
        } else if (props.onSubmitMarketOrder) {
          const res = await props.onSubmitMarketOrder(
            isBuy 
              ? { memberId, symbol: selectedCoin, side, totalAmount: numAmount }
              : { memberId, symbol: selectedCoin, side, quantity: numQty }
          );
          if (!res.success) throw new Error(res.message || "주문 실패");
        }
        
        toast({ title: "시장가 주문 완료", tone: "success" });
      }
      
      setOrderAmount("");
      setOrderQuantity("");
    } catch (e: any) {
      await alert(e.message || "주문 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isLoadingPortfolio || currentPrice <= 0;
  
  /* ═══════ UI pieces ═══════ */
  const bgMain = "bg-white text-slate-900";
  const borderSub = "border-gray-100";
  const textMuted = "text-slate-400";
  const textTitle = "text-slate-400";
  
  const inputBg = "bg-slate-50 border-gray-200 focus-within:border-emerald-500/50";
  const inputText = "text-slate-900";
  
  const inputCls = `flex items-center rounded border px-2 sm:px-3 py-[8px] lg:py-[6px] transition-colors ${inputBg}`;
  const labelCls = `text-[11px] sm:text-[12px] font-medium w-8 sm:w-12 shrink-0 ${textMuted}`;
  const fieldCls = `flex-1 min-w-0 w-full bg-transparent text-right text-[12px] sm:text-[13px] outline-none font-bold ${inputText}`;

  return (
    <section className={`flex flex-col h-full min-w-0 ${bgMain}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b shrink-0 ${borderSub}`}>
        <span className={`text-[10px] sm:text-xs font-black ${textTitle}`}>
          {isMock ? "Mock Order" : "Spot Order"}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold">
          <span className={textMuted}>Fee</span>
          <span className={isMock ? "text-emerald-500" : "text-[#F0B90B]"}>{(currentFeeRate * 100).toFixed(2)}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 shrink-0">
        <button
          onClick={() => setOrderTab("buy")}
          className={`py-2 sm:py-2.5 text-center text-[12px] sm:text-[13px] font-bold transition-colors ${isBuy ? "text-[#fb2c36] border-b-2 border-[#fb2c36]" : `${textMuted} border-b-2 border-transparent hover:${inputText}`}`}
        >
          매수
        </button>
        <button
          onClick={() => setOrderTab("sell")}
          className={`py-2 sm:py-2.5 text-center text-[12px] sm:text-[13px] font-bold transition-colors ${!isBuy ? "text-[#0058FF] border-b-2 border-[#0058FF]" : `${textMuted} border-b-2 border-transparent hover:${inputText}`}`}
        >
          매도
        </button>
      </div>

      <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-w-0 custom-scrollbar">
        {/* Execution Type */}
        <div className="flex gap-4 sm:gap-5 text-[12px] sm:text-[13px] font-bold">
          <button onClick={() => setExecType("MARKET")} className={!isLimit ? inputText : `${textMuted} hover:${inputText}`}>시장가</button>
          <button onClick={() => setExecType("LIMIT")} className={isLimit ? inputText : `${textMuted} hover:${inputText}`}>지정가</button>
        </div>

        {/* Price */}
        {isLimit ? (
          <div className={inputCls}>
            <span className={labelCls}>가격</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0" 
              value={orderPrice} 
              onChange={(e) => setOrderPrice(sanitizeDecimalInput(e.target.value))} 
              className={fieldCls} 
            />
            <span className={`text-[11px] sm:text-[12px] font-medium ml-1.5 sm:ml-2 shrink-0 ${textMuted}`}>{meta.quoteAsset}</span>
          </div>
        ) : (
          <div className="flex items-center rounded px-2 sm:px-3 py-[6px] bg-slate-50 border border-gray-100">
            <span className={labelCls}>가격</span>
            <span className={`flex-1 text-right text-[12px] sm:text-[13px] font-bold min-w-0 ${textMuted}`}>시장가</span>
          </div>
        )}

        {/* Amount/Quantity Input */}
        {isBuy && !isLimit ? (
          <div className={inputCls}>
            <span className={labelCls}>금액</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0" 
              value={orderAmount} 
              onChange={(e) => setOrderAmount(sanitizeDecimalInput(e.target.value))} 
              className={fieldCls} 
            />
            <span className={`text-[11px] sm:text-[12px] font-medium ml-1.5 sm:ml-2 shrink-0 ${textMuted}`}>{meta.quoteAsset}</span>
          </div>
        ) : (
          <div className={inputCls}>
            <span className={labelCls}>수량</span>
            <input 
              type="text" 
              inputMode="decimal" 
              placeholder="0" 
              value={orderQuantity} 
              onChange={(e) => setOrderQuantity(sanitizeDecimalInput(e.target.value))} 
              className={fieldCls} 
            />
            <span className={`text-[11px] sm:text-[12px] font-medium ml-1.5 sm:ml-2 shrink-0 ${textMuted}`}>{meta.baseAsset}</span>
          </div>
        )}

        {/* Ratio Options */}
        <div className="flex gap-1.5">
          {ORDER_RATIO_OPTIONS.map((o) => (
            <button key={o.label} type="button" onClick={() => handleRatio(o.ratio)} className="flex-1 rounded-[4px] py-1 text-center text-[10px] sm:text-[11px] font-bold transition-colors bg-slate-100 hover:bg-slate-200 text-slate-500">{o.label}</button>
          ))}
        </div>

        {/* Availability Info */}
        <div className={`space-y-[6px] text-[11px] sm:text-[12px] pt-2 border-t ${borderSub}`}>
          <div className="flex justify-between min-w-0">
            <span className={`${textMuted} shrink-0`}>주문 가능</span>
            <span className={`${inputText} font-bold truncate ml-2`}>
              {isBuy 
                ? `${formatAssetNumber(usdtBalance)} ${meta.quoteAsset}` 
                : `${formatAssetNumber(availableHolding)} ${meta.baseAsset}`}
            </span>
          </div>
          
          {isBuy ? (
            <div className="flex justify-between min-w-0">
              <span className={`${textMuted} shrink-0`}>예상 매수량</span>
              <span className="text-[#fb2c36] font-bold truncate ml-2">
                {isLimit 
                  ? `${formatAssetNumber(numQty)} ${meta.baseAsset}`
                  : `${formatAssetNumber(expectedBuyQuantity)} ${meta.baseAsset}`}
              </span>
            </div>
          ) : (
            <div className="flex justify-between min-w-0">
              <span className={`${textMuted} shrink-0`}>예상 매도액</span>
              <span className="text-[#0058FF] font-bold truncate ml-2">
                {isLimit 
                  ? `${formatAssetNumber(expectedLimitAmount)} ${meta.quoteAsset}`
                  : `${formatAssetNumber(expectedSellAmount)} ${meta.quoteAsset}`}
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isFormDisabled}
            onClick={handleSubmit}
            className={cn(
              "w-full rounded py-3.5 text-[14px] font-black text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              isBuy ? "bg-[#fb2c36] hover:bg-[#fb2c36]/90" : "bg-[#0058FF] hover:bg-[#0058FF]/90"
            )}
          >
            {isSubmitting ? "Processing..." : isBuy ? `Buy ${meta.baseAsset}` : `Sell ${meta.baseAsset}`}
          </button>
        </div>
      </div>
    </section>
  );
}
