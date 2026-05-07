"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireLogin } from "@/hooks/useWithAuth";
import { cn } from "@/lib/utils/cs";

/* ────────────────── types ────────────────── */

type OrderType = "limit" | "market";
type OrderTab = "buy" | "sell";
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

type MarketOrderSubmitParams = {
  memberId: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity?: number;
  totalAmount?: number;
};

type LimitOrderSubmitParams = {
  memberId: number;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
};

export type OrderFormProps = {
  mode?: OrderMode;
  isParticipated?: boolean;
  isLoadingPortfolio?: boolean;
  usdtBalance?: number;
  holdings?: OrderHolding[];
  onSubmitMarketOrder?: (params: MarketOrderSubmitParams) => Promise<OrderResult>;
  onSubmitLimitOrder?: (params: LimitOrderSubmitParams) => Promise<OrderResult>;
};

/* ────────────────── constants ────────────────── */

const MARKET_FEE_RATE = 0.0005;
const LIMIT_FEE_RATE = 0.0003;
const MIN_ORDER_AMOUNT = 10;
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

/* ────────────────── component ────────────────── */

export default function OrderForm({
  mode = "trade",
  isParticipated = false,
  isLoadingPortfolio = false,
  usdtBalance = 0,
  holdings = [],
  onSubmitMarketOrder,
  onSubmitLimitOrder,
}: OrderFormProps) {
  const router = useRouter();
  const { isLogin, user } = useAuthStore();
  const { alert, toast } = useFeedback();
  const requireLogin = useRequireLogin({ redirectMode: "push" });

  const selectedCoin = useTickerStore((s) => s.selectedCoin);
  const coinMetaList = useTickerStore((s) => s.coinMetaList);
  const realtime = useTickerStore((s) => s.tickers[s.selectedCoin]);
  const selectedOrderPrice = useTickerStore((s) => s.selectedOrderPrice);
  const setSelectedOrderPrice = useTickerStore((s) => s.setSelectedOrderPrice);

  const [orderTab, setOrderTab] = useState<OrderTab>("buy");
  const [execType, setExecType] = useState<OrderType>("market");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [orderAmount, setOrderAmount] = useState(""); // For market buy
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync price from clicks
  useEffect(() => {
    if (selectedOrderPrice === null) return;
    const priceStr = toInputValue(selectedOrderPrice);
    if (!priceStr) return;

    setExecType("limit");
    setOrderPrice(priceStr);
    setSelectedOrderPrice(null);
  }, [selectedOrderPrice, setSelectedOrderPrice]);

  const meta = coinMetaList.find((c) => c.symbol === selectedCoin);
  if (!meta) return <div className="h-full animate-pulse bg-[#161A1E]" />;

  const currentPrice = realtime?.price ?? 0;
  const isLimit = execType === "limit";
  const isBuy = orderTab === "buy";
  const isDark = true; // Trading pages are dark

  const selectedHolding = holdings.find((item) => item.symbol === selectedCoin);
  const availableHolding = selectedHolding?.availableQuantity ?? selectedHolding?.quantity ?? 0;

  const numPrice = Number(orderPrice);
  const numQty = Number(orderQuantity);
  const numAmount = Number(orderAmount);
  
  const refPrice = isLimit && numPrice > 0 ? numPrice : currentPrice;
  const currentFeeRate = isLimit ? LIMIT_FEE_RATE : MARKET_FEE_RATE;

  // Expected values
  const expectedBuyQuantity = (isBuy && !isLimit && currentPrice > 0 && numAmount > 0)
    ? (numAmount * (1 - currentFeeRate)) / currentPrice
    : 0;

  const expectedSellAmount = (!isBuy && currentPrice > 0 && numQty > 0)
    ? numQty * currentPrice * (1 - currentFeeRate)
    : 0;

  const expectedLimitAmount = (isLimit && numPrice > 0 && numQty > 0) ? numPrice * numQty : 0;
  const estRequired = expectedLimitAmount * (1 + currentFeeRate);

  const handleRatio = (ratio: number) => {
    if (isBuy) {
      if (isLimit) {
        const maxBuyNotional = usdtBalance / (1 + currentFeeRate);
        const maxBuyQty = refPrice > 0 ? maxBuyNotional / refPrice : 0;
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

    if (mode === "mock" && !isParticipated) {
      await alert("먼저 모의투자 계좌를 생성해 주세요.");
      return;
    }

    const side = isBuy ? "BUY" : "SELL";
    const memberId = user?.memberId;
    if (!memberId) return;

    setIsSubmitting(true);
    try {
      let result: OrderResult;
      if (isLimit) {
        if (!numPrice || numPrice <= 0) throw new Error("가격을 입력해 주세요.");
        if (!numQty || numQty <= 0) throw new Error("수량을 입력해 주세요.");
        if (expectedLimitAmount < MIN_ORDER_AMOUNT) throw new Error(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${meta.quoteAsset} 이상입니다.`);
        
        result = await onSubmitLimitOrder!({ memberId, symbol: selectedCoin, side, price: numPrice, quantity: numQty });
      } else {
        if (isBuy) {
          if (!numAmount || numAmount <= 0) throw new Error("금액을 입력해 주세요.");
          result = await onSubmitMarketOrder!({ memberId, symbol: selectedCoin, side, totalAmount: numAmount });
        } else {
          if (!numQty || numQty <= 0) throw new Error("수량을 입력해 주세요.");
          result = await onSubmitMarketOrder!({ memberId, symbol: selectedCoin, side, quantity: numQty });
        }
      }

      if (result.success) {
        toast({ title: isLimit ? "지정가 주문 완료" : "시장가 주문 완료", tone: "success" });
        setOrderAmount("");
        setOrderQuantity("");
      } else {
        throw new Error(result.message || "주문 실패");
      }
    } catch (e: any) {
      await alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isSubmitting || isLoadingPortfolio || currentPrice <= 0;
  const inputCls = "flex items-center bg-[#1E2329] rounded border border-transparent focus-within:border-[#F0B90B]/50 px-3 py-[6px] transition-colors";
  const labelCls = "text-[12px] font-medium text-gray-500 w-14 shrink-0";
  const fieldCls = "flex-1 bg-transparent text-right text-[13px] text-white outline-none font-bold";

  return (
    <section className="flex flex-col bg-[#161A1E] text-white h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <span className="text-xs font-black text-white/40 uppercase tracking-widest">
          {mode === "mock" ? "Mock Order" : "Spot Order"}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <span className="text-gray-500">Fee</span>
          <span className="text-[#F0B90B]">{(currentFeeRate * 100).toFixed(2)}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 shrink-0">
        <button
          onClick={() => setOrderTab("buy")}
          className={`py-2.5 text-center text-[13px] font-bold transition-colors ${isBuy ? "text-[#fb2c36] border-b-2 border-[#fb2c36]" : "text-gray-500 border-b-2 border-transparent hover:text-gray-300"}`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderTab("sell")}
          className={`py-2.5 text-center text-[13px] font-bold transition-colors ${!isBuy ? "text-[#0058FF] border-b-2 border-[#0058FF]" : "text-gray-500 border-b-2 border-transparent hover:text-gray-300"}`}
        >
          Sell
        </button>
      </div>

      <div className="px-4 pt-4 pb-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {/* Execution Type */}
        <div className="flex gap-5 text-[13px] font-bold">
          <button onClick={() => setExecType("market")} className={!isLimit ? "text-white" : "text-gray-500 hover:text-gray-300"}>시장가</button>
          <button onClick={() => setExecType("limit")} className={isLimit ? "text-white" : "text-gray-500 hover:text-gray-300"}>지정가</button>
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
            <span className="text-[12px] font-medium text-gray-500 ml-2">{meta.quoteAsset}</span>
          </div>
        ) : (
          <div className="flex items-center bg-[#1E2329] rounded px-3 py-[6px]">
            <span className={labelCls}>가격</span>
            <span className="flex-1 text-right text-[13px] text-gray-500 font-bold">Market Price</span>
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
            <span className="text-[12px] font-medium text-gray-500 ml-2">{meta.quoteAsset}</span>
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
            <span className="text-[12px] font-medium text-gray-500 ml-2">{meta.baseAsset}</span>
          </div>
        )}

        {/* Ratio Options */}
        <div className="flex gap-1.5">
          {ORDER_RATIO_OPTIONS.map((o) => (
            <button key={o.label} type="button" onClick={() => handleRatio(o.ratio)} className="flex-1 bg-[#2B3139] hover:bg-[#353C46] rounded-[4px] py-1 text-center text-[11px] font-bold text-gray-400">{o.label}</button>
          ))}
        </div>

        {/* Availability Info */}
        <div className="space-y-[6px] text-[12px] pt-2 border-t border-white/5">
          <div className="flex justify-between">
            <span className="text-gray-500">주문 가능</span>
            <span className="text-white font-bold">
              {isBuy 
                ? `${formatAssetNumber(usdtBalance)} ${meta.quoteAsset}` 
                : `${formatAssetNumber(availableHolding)} ${meta.baseAsset}`}
            </span>
          </div>
          
          {isBuy ? (
            <div className="flex justify-between">
              <span className="text-gray-500">예상 매수량</span>
              <span className="text-[#fb2c36] font-bold">
                {isLimit 
                  ? `${formatAssetNumber(numQty)} ${meta.baseAsset}`
                  : `${formatAssetNumber(expectedBuyQuantity)} ${meta.baseAsset}`}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-gray-500">예상 매도액</span>
              <span className="text-[#0058FF] font-bold">
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
