"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import SegmentTabs from "@/components/ui/SegmentTabs";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireLogin } from "@/hooks/useWithAuth";
import { useTickerStore } from "@/stores/useTickerStore";
import { useAuthStore } from "@/stores/useAuthStore";

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
  onSubmitMarketOrder?: (
    params: MarketOrderSubmitParams
  ) => Promise<OrderResult>;
  onSubmitLimitOrder?: (
    params: LimitOrderSubmitParams
  ) => Promise<OrderResult>;
};

type OrderFormBodyProps = {
  mode: OrderMode;
  orderTab: OrderTab;
  orderType: OrderType;
  onChangeOrderType: (nextType: OrderType) => void;
  selectedCoin: string;
  baseName: string;
  quoteName: string;
  currentPrice: number;
  isParticipated: boolean;
  isLoadingPortfolio: boolean;
  usdtBalance: number;
  holdings: OrderHolding[];
  onSubmitMarketOrder: (
    params: MarketOrderSubmitParams
  ) => Promise<OrderResult>;
  onSubmitLimitOrder: (
    params: LimitOrderSubmitParams
  ) => Promise<OrderResult>;
};

const MARKET_FEE_RATE = 0.0005;
const LIMIT_FEE_RATE = 0.0003;
const MIN_ORDER_AMOUNT = 10;

const formatNumber = (value: number, maximumFractionDigits = 2) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
};

const toInputValue = (value: number, maximumFractionDigits = 8) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, "");
};

const sanitizeDecimalInput = (value: string) => {
  const normalized = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = normalized.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
};

function OrderFormBody({
  mode,
  orderTab,
  orderType,
  onChangeOrderType,
  selectedCoin,
  baseName,
  quoteName,
  currentPrice,
  isParticipated,
  isLoadingPortfolio,
  usdtBalance,
  holdings,
  onSubmitMarketOrder,
  onSubmitLimitOrder,
}: OrderFormBodyProps) {
  const router = useRouter();
  const { isLogin, user } = useAuthStore();
  const { alert, toast } = useFeedback();
  const requireLogin = useRequireLogin({ redirectMode: "push" });
  const selectedOrderPrice = useTickerStore((state) => state.selectedOrderPrice);
  const setSelectedOrderPrice = useTickerStore(
    (state) => state.setSelectedOrderPrice
  );

  useEffect(() => {
    if (selectedOrderPrice !== null) {
      setOrderPrice(toInputValue(selectedOrderPrice, 8));
      onChangeOrderType("limit");
      setSelectedOrderPrice(null);
    }
  }, [selectedOrderPrice, setSelectedOrderPrice, onChangeOrderType]);

  const [orderPrice, setOrderPrice] = useState(
    orderType === "limit" ? toInputValue(currentPrice, 8) : ""
  );
  const [orderQty, setOrderQty] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedHolding = holdings.find((item) => item.symbol === selectedCoin);
  const availableHolding =
    selectedHolding?.availableQuantity ?? selectedHolding?.quantity ?? 0;

  const isMarketOrder = orderType === "market";
  const isMarketBuy = isMarketOrder && orderTab === "buy";
  const isMarketSell = isMarketOrder && orderTab === "sell";
  const numericPrice = Number(orderPrice);
  const numericQty = Number(orderQty);
  const numericAmount = Number(orderAmount);
  const expectedBuyQuantity =
    currentPrice > 0 && Number.isFinite(numericAmount) && numericAmount > 0
      ? (numericAmount * (1 - MARKET_FEE_RATE)) / currentPrice
      : 0;
  const expectedSellAmount =
    currentPrice > 0 && Number.isFinite(numericQty) && numericQty > 0
      ? numericQty * currentPrice * (1 - MARKET_FEE_RATE)
      : 0;

  const availableDisplayValue = orderTab === "buy" ? usdtBalance : availableHolding;
  const availableUnit = orderTab === "buy" ? quoteName : baseName;
  const expectedLimitAmount =
    Number.isFinite(numericPrice) && numericPrice > 0 &&
    Number.isFinite(numericQty) && numericQty > 0
      ? numericPrice * numericQty
      : 0;
  const expectedLimitTotalCost = expectedLimitAmount * (1 + LIMIT_FEE_RATE);
  const isDisabled = isSubmitting || isLoadingPortfolio;
  const limitBuyPriceError =
    !isMarketOrder &&
    orderTab === "buy" &&
    Number.isFinite(numericPrice) &&
    numericPrice > 0 &&
    numericQty > 0 &&
    expectedLimitTotalCost > usdtBalance
      ? "주문 가능 금액을 초과했습니다."
      : "";

  const buttonText =
    mode !== "mock"
      ? "실전 주문 준비 중"
      : isSubmitting
        ? "주문 처리 중..."
        : orderTab === "buy"
          ? "매수"
          : "매도";

  const feeDescription = isMarketOrder
    ? `시장가 거래 수수료 ${(MARKET_FEE_RATE * 100).toFixed(2)}%`
    : `지정가 거래 수수료 ${(LIMIT_FEE_RATE * 100).toFixed(2)}%`;

  const handleSelectRatio = (ratio: number) => {
    if (isMarketBuy) {
      setOrderAmount(toInputValue(usdtBalance * ratio, 2));
      return;
    }

    if (isMarketSell) {
      setOrderQty(toInputValue(availableHolding * ratio));
      return;
    }

    const maxQty =
      orderTab === "buy"
        ? numericPrice > 0
          ? usdtBalance / (numericPrice * (1 + LIMIT_FEE_RATE))
          : 0
        : availableHolding;

    const nextQty = maxQty * ratio;
    setOrderQty(toInputValue(nextQty));
  };

  const handleSubmit = async () => {
    if (isMarketBuy) {
      if (!orderAmount.trim()) {
        await alert("주문금액을 입력하세요.");
        return;
      }
    } else if (isMarketSell) {
      if (!orderQty.trim()) {
        await alert("주문수량을 입력하세요.");
        return;
      }
    } else {
      if (!orderPrice.trim()) {
        await alert("주문가격을 입력하세요.");
        return;
      }

      if (!orderQty.trim()) {
        await alert("주문수량을 입력하세요.");
        return;
      }
    }

    if (mode !== "mock") {
      await alert("실전 주문 API는 아직 연결 전입니다.");
      return;
    }

    if (orderType !== "market") {
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
        await alert("주문가격을 올바르게 입력해 주세요.");
        return;
      }

      if (!Number.isFinite(numericQty) || numericQty <= 0) {
        await alert("주문수량을 올바르게 입력해 주세요.");
        return;
      }

      if (expectedLimitAmount < MIN_ORDER_AMOUNT) {
        await alert(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${quoteName} 이상입니다.`);
        return;
      }

      if (orderTab === "buy" && expectedLimitTotalCost > usdtBalance) {
        await alert("주문 가능 금액이 부족합니다. (수수료 포함)");
        return;
      }

      if (orderTab === "sell" && numericQty > availableHolding) {
        await alert("보유 수량이 부족합니다.");
        return;
      }
    }

    let currentUser = user;

    if (!isLogin || !currentUser) {
      const isAuthenticated = await requireLogin();

      if (!isAuthenticated) {
        return;
      }

      currentUser = useAuthStore.getState().user;

      if (!currentUser) {
        return;
      }
    }

    if (!isParticipated) {
      await alert("먼저 모의투자 계좌를 생성해 주세요.");
      return;
    }

    if (isMarketOrder && currentPrice <= 0) {
      await alert("현재가를 확인할 수 없어 주문할 수 없습니다.");
      return;
    }

    if (isMarketBuy) {
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        await alert("주문 금액을 올바르게 입력해 주세요.");
        return;
      }

      if (numericAmount < MIN_ORDER_AMOUNT) {
        await alert(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${quoteName} 이상입니다.`);
        return;
      }

      if (numericAmount > usdtBalance) {
        await alert("주문 가능 금액이 부족합니다.");
        return;
      }
    }

    if (isMarketSell) {
      if (!Number.isFinite(numericQty) || numericQty <= 0) {
        await alert("주문수량을 올바르게 입력해 주세요.");
        return;
      }

      if (expectedSellAmount < MIN_ORDER_AMOUNT) {
        await alert(`최소 주문 금액은 ${MIN_ORDER_AMOUNT} ${quoteName} 이상입니다.`);
        return;
      }

      if (numericQty > availableHolding) {
        await alert("보유 수량이 부족합니다.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const side = orderTab === "buy" ? "BUY" : "SELL";
      const result = isMarketOrder
        ? side === "BUY"
          ? await onSubmitMarketOrder({
              memberId: currentUser.memberId,
              symbol: selectedCoin,
              side,
              totalAmount: numericAmount,
            })
          : await onSubmitMarketOrder({
              memberId: currentUser.memberId,
              symbol: selectedCoin,
              side,
              quantity: numericQty,
            })
        : await onSubmitLimitOrder({
            memberId: currentUser.memberId,
            symbol: selectedCoin,
            side,
            price: numericPrice,
            quantity: numericQty,
          });

      if (result.success) {
        toast({
          title: isMarketOrder
            ? orderTab === "buy"
              ? "시장가 매수가 완료되었습니다."
              : "시장가 매도가 완료되었습니다."
            : orderTab === "buy"
              ? "지정가 매수 주문이 등록되었습니다."
              : "지정가 매도 주문이 등록되었습니다.",
          tone: "success",
        });

        setOrderAmount("");
        setOrderQty("");

        if (!isMarketOrder) {
          setOrderPrice(toInputValue(currentPrice, 2));
        }
        return;
      }

      if (result.status === "login_required") {
        await alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
        router.push("/login");
        return;
      }

      if (result.status === "not_participating") {
        await alert("모의투자 계좌를 먼저 생성해 주세요.");
        return;
      }

      await alert(result.message || "주문 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1 pt-6">
      <SegmentTabs
        activeTab={orderType}
        onChange={(value) => onChangeOrderType(value as OrderType)}
        tabs={[
          { label: "지정", value: "limit" as const },
          { label: "시장", value: "market" as const },
        ]}
      />

      <div className="flex justify-between items-center text-xs font-black pt-2">
        <span className="text-gray-500 uppercase">주문 가능</span>
        <span className="text-gray-900 font-black text-sm">
          {formatNumber(availableDisplayValue, orderTab === "buy" ? 2 : 8)}
          <span className="text-gray-400 font-medium ml-1">{availableUnit}</span>
        </span>
      </div>

      <div className="space-y-3">
        {!isMarketOrder && (
          <div className="flex items-center gap-2">
            <label className="w-20 text-xs font-black text-gray-500">
              주문가격
            </label>
            <div className="flex-1 space-y-1">
              <Input
                type="text"
                inputMode="decimal"
                value={orderPrice}
                onChange={(e) =>
                  setOrderPrice(sanitizeDecimalInput(e.target.value))
                }
                className={`text-right font-black h-10 bg-white border-gray-200 rounded-none flex-1 ${
                  limitBuyPriceError ? "text-red-500" : ""
                }`}
              />
              {limitBuyPriceError ? (
                <p className="text-xs font-bold text-red-500 text-right">
                  {limitBuyPriceError}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="w-20 text-xs font-black text-gray-500">
            {isMarketBuy ? "주문금액" : `주문수량(${baseName})`}
          </label>
          <div className="flex-1 space-y-1">
            {isMarketBuy ? (
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={orderAmount}
                  onChange={(e) =>
                    setOrderAmount(sanitizeDecimalInput(e.target.value))
                  }
                  className="text-right font-black h-10 bg-white border-gray-200 rounded-none w-full pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                  {quoteName}
                </span>
              </div>
            ) : (
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={orderQty}
                onChange={(e) =>
                  setOrderQty(sanitizeDecimalInput(e.target.value))
                }
                className="text-right font-black h-10 bg-white border-gray-200 rounded-none w-full"
              />
            )}
            <div className="grid grid-cols-5 gap-1">
                {[
                  { label: "10%", ratio: 0.1 },
                  { label: "20%", ratio: 0.2 },
                  { label: "50%", ratio: 0.5 },
                  { label: "75%", ratio: 0.75 },
                  { label: "최대", ratio: 1 },
                ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleSelectRatio(option.ratio)}
                  className="py-1.5 bg-white border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 mt-auto space-y-3">
        {isMarketOrder ? (
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-500">
              {orderTab === "buy" ? "예상매수" : "예상매도"}
            </span>
            <span className="font-black text-gray-900">
              {isMarketBuy ? (
                <>
                  {formatNumber(expectedBuyQuantity, 8)}
                  <span className="text-gray-400 font-medium ml-1">
                    {baseName}
                  </span>
                </>
              ) : (
                <>
                  {formatNumber(expectedSellAmount)}
                  <span className="text-gray-400 font-medium ml-1">{quoteName}</span>
                </>
              )}
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center gap-11">
            <span className="text-xs font-bold text-gray-500">주문금액(수수료 포함)</span>
            <div className="relative flex-1">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={toInputValue(expectedLimitTotalCost, 2)}
                readOnly={true}
                className="w-full bg-white border-gray-200 rounded-none h-10 text-right font-bold pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                {quoteName}
              </span>
            </div>
          </div>
        )}

        <p className="flex items-center gap-1 text-xs text-gray-400 leading-relaxed">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {feeDescription}
        </p>

        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`w-full h-14 font-black text-lg rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            orderTab === "buy"
              ? "bg-trade-buy hover:bg-trade-buy-hover"
              : "bg-trade-sell hover:bg-trade-sell-hover"
          }`}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

const defaultOrderResult: OrderResult = {
  success: false,
  status: "failed",
  message: "실전 주문 API는 아직 연결 전입니다.",
};

const defaultSubmitMarketOrder = async () => defaultOrderResult;
const defaultSubmitLimitOrder = async () => defaultOrderResult;

export default function OrderForm({
  mode = "trade",
  isParticipated = false,
  isLoadingPortfolio = false,
  usdtBalance = 0,
  holdings = [],
  onSubmitMarketOrder = defaultSubmitMarketOrder,
  onSubmitLimitOrder = defaultSubmitLimitOrder,
}: OrderFormProps) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const realtime = useTickerStore((state) => state.tickers[state.selectedCoin]);
  const meta = coinMetaList.find((coin) => coin.symbol === selectedCoin);

  const [orderTab, setOrderTab] = useState<OrderTab>("buy");
  const [orderType, setOrderType] = useState<OrderType>(
    mode === "mock" ? "market" : "limit"
  );

  if (!realtime || !meta) {
    return (
      <div className="lg:col-span-5 bg-white border border-gray-200 animate-pulse" />
    );
  }

  const baseName = meta.baseAsset;
  const quoteName = meta.quoteAsset;
  const formResetKey = `${selectedCoin}-${orderType}-${orderTab}`;

  return (
    <div className="lg:col-span-5 bg-white border border-gray-200 p-6 flex flex-col lg:h-full">
      <Tabs
        activeTab={orderTab}
        onChange={(val) => setOrderTab(val as OrderTab)}
        fullWidth={true}
        tabs={[
          {
            label: `${baseName} 매수`,
            value: "buy",
            activeColor: "text-trade-buy border-trade-buy",
          },
          {
            label: `${baseName} 매도`,
            value: "sell",
            activeColor: "text-trade-sell border-trade-sell",
          },
        ]}
      />

      <OrderFormBody
        key={formResetKey}
        mode={mode}
        orderTab={orderTab}
        orderType={orderType}
        onChangeOrderType={setOrderType}
        selectedCoin={selectedCoin}
        baseName={baseName}
        quoteName={quoteName}
        currentPrice={realtime.price}
        isParticipated={isParticipated}
        isLoadingPortfolio={isLoadingPortfolio}
        usdtBalance={usdtBalance}
        holdings={holdings}
        onSubmitMarketOrder={onSubmitMarketOrder}
        onSubmitLimitOrder={onSubmitLimitOrder}
      />
    </div>
  );
}
