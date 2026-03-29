"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Tabs from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useTickerStore } from "@/stores/useTickerStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

type OrderType = "limit" | "market" | "auto";
type OrderTab = "buy" | "sell";

type OrderFormProps = {
  // mock mock, 일반 trading에서는 trade
  mode?: "mock" | "trade";
};

type OrderFormBodyProps = {
  mode: "mock" | "trade";
  orderTab: OrderTab;
  orderType: OrderType;
  onChangeOrderType: (nextType: OrderType) => void;
  selectedCoin: string;
  baseName: string;
  currentPrice: number;
};

function OrderFormBody({
  mode,
  orderTab,
  orderType,
  onChangeOrderType,
  selectedCoin,
  baseName,
  currentPrice,
}: OrderFormBodyProps) {
  const router = useRouter();

  const { isLogin, user } = useAuthStore();
  const {
    isParticipated,
    isLoadingPortfolio,
    executeMarketOrder,
    holdings,
    usdtBalance,
  } = useMockWalletStore();

  // key 리마운트 방식으로 selectedCoin / orderType 변경 시 자동 초기화되게 함
  const [orderPrice, setOrderPrice] = useState<number | string>(
    orderType === "limit" ? currentPrice : ""
  );
  const [orderQty, setOrderQty] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableHolding =
    holdings.find((item) => item.symbol === selectedCoin)?.quantity ?? 0;

  const numericQty = Number(orderQty);
  const numericPrice = Number(orderPrice);

  // 시장가일 때는 입력 가격이 아니라 현재가 기준으로 금액 계산
  const effectivePrice =
    orderType === "market" ? currentPrice : numericPrice;

  const estimatedTotal =
    Number.isFinite(effectivePrice) && Number.isFinite(numericQty)
      ? effectivePrice * numericQty
      : 0;

  const isQtyInvalid = !Number.isFinite(numericQty) || numericQty <= 0;
  const isPriceInvalid =
    orderType !== "market" &&
    (!Number.isFinite(numericPrice) || numericPrice <= 0);

  const isDisabled =
    isSubmitting ||
    isLoadingPortfolio ||
    mode !== "mock" ||
    orderType !== "market" ||
    isQtyInvalid ||
    isPriceInvalid;

  const buttonText =
    mode !== "mock"
      ? "실전 주문 준비 중"
      : orderType !== "market"
        ? "시장가만 지원"
        : isSubmitting
          ? "주문 처리 중..."
          : orderTab === "buy"
            ? "매수"
            : "매도";

  const handleSubmit = async () => {
    if (mode !== "mock") {
      alert("실전 주문 API는 아직 연결 전입니다.");
      return;
    }

    if (orderType !== "market") {
      alert("지금은 시장가 주문만 가능합니다.");
      return;
    }

    if (!isLogin || !user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!isParticipated) {
      alert("먼저 모의투자 계좌를 생성해 주세요.");
      return;
    }

    if (isQtyInvalid) {
      alert("주문 수량을 올바르게 입력해 주세요.");
      return;
    }

    if (orderTab === "buy") {
      if (estimatedTotal < 10) {
        alert("최소 주문 금액은 10 USDT 이상입니다.");
        return;
      }

      if (estimatedTotal > usdtBalance) {
        alert("주문 가능 금액이 부족합니다.");
        return;
      }
    }

    if (orderTab === "sell") {
      if (numericQty > availableHolding) {
        alert("보유 수량이 부족합니다.");
        return;
      }

      if (estimatedTotal < 10) {
        alert("매도 총액이 10 USDT 이상이어야 합니다.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const side = orderTab === "buy" ? "BUY" : "SELL";

      const result =
        side === "BUY"
          ? await executeMarketOrder({
              memberId: user.memberId,
              symbol: selectedCoin,
              side,
              totalAmount: estimatedTotal,
            })
          : await executeMarketOrder({
              memberId: user.memberId,
              symbol: selectedCoin,
              side,
              quantity: numericQty,
            });

      if (result.success) {
        alert(
          orderTab === "buy"
            ? "시장가 매수가 완료되었습니다."
            : "시장가 매도가 완료되었습니다."
        );

        setOrderQty("");
        return;
      }

      if (result.status === "login_required") {
        alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
        router.push("/login");
        return;
      }

      if (result.status === "not_participating") {
        alert("모의투자 계좌를 먼저 생성해 주세요.");
        return;
      }

      alert(result.message || "주문 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1 pt-6">
      <div className="flex gap-1">
        {[
          { label: "지정", value: "limit" as const },
          { label: "시장", value: "market" as const },
          { label: "자동", value: "auto" as const },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => onChangeOrderType(option.value)}
            className={`flex-1 py-2 text-xs font-black border transition-all ${
              orderType === option.value
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center text-[11px] font-black pt-2">
        <span className="text-gray-500 uppercase">주문가능</span>
        <span className="text-gray-900 font-black">
          0 <span className="text-gray-400 font-medium ml-1">USDT</span>
        </span>
      </div>

      <div className="space-y-3">
        {orderType !== "market" && (
          <div className="flex items-center gap-2">
            <label className="w-20 text-[11px] font-black text-gray-500">
              주문가격
            </label>
            <div className="flex-1 flex gap-1">
              <Input
                type="number"
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                className="text-right font-black h-10 bg-white border-gray-200 rounded-none flex-1"
              />
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  className="w-6 h-[19px] bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50"
                >
                  +
                </button>
                <button
                  type="button"
                  className="w-6 h-[19px] bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50"
                >
                  -
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="w-20 text-[11px] font-black text-gray-500">
            주문수량({baseName})
          </label>
          <div className="flex-1 space-y-1">
            <Input
              type="number"
              placeholder="0"
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
              className="text-right font-black h-10 bg-white border-gray-200 rounded-none w-full"
            />
            <div className="grid grid-cols-5 gap-1">
              {[10, 25, 50, 100, "최대"].map((p) => (
                <button
                  key={p.toString()}
                  type="button"
                  className="py-1.5 bg-white border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  {typeof p === "number" ? `${p}%` : p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 mt-auto">
        <div className="flex justify-between items-center mb-5 gap-11">
          <span className="text-xs font-bold text-gray-500">주문금액</span>
          <Input
            type="text"
            readOnly
            value={estimatedTotal.toLocaleString()}
            className="flex-1 bg-gray-50 border-gray-200 rounded-none h-10 text-right font-bold"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`w-full h-14 font-black text-lg rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            orderTab === "buy"
              ? "bg-[#E12343] hover:bg-red-700"
              : "bg-[#1763B6] hover:bg-blue-700"
          }`}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

export default function OrderForm({ mode = "trade" }: OrderFormProps) {
  const { selectedCoin, tickers, coinMetaList } = useTickerStore();
  const realtime = tickers[selectedCoin];
  const meta = coinMetaList.find((coin) => coin.symbol === selectedCoin);

  const [orderTab, setOrderTab] = useState<OrderTab>("buy");
  const [orderType, setOrderType] = useState<OrderType>(
    mode === "mock" ? "market" : "limit"
  );

  if (!realtime || !meta) {
    return (
      <div className="lg:col-span-5 bg-white border border-gray-200 h-[520px] animate-pulse" />
    );
  }

  const baseName = meta.baseAsset;

  // selectedCoin 또는 orderType이 바뀌면 내부 form state를 통째로 초기화
  const formResetKey = `${selectedCoin}-${orderType}-${orderTab}`;


  return (
    <div className="h-[520px] lg:col-span-5 bg-white border border-gray-200 p-6 flex flex-col lg:h-full">
      <Tabs
        activeTab={orderTab}
        onChange={(val) => setOrderTab(val as OrderTab)}
        fullWidth={true}
        tabs={[
          {
            label: `${baseName} 매수`,
            value: "buy",
            activeColor: "text-[#E12343] border-[#E12343]",
          },
          {
            label: `${baseName} 매도`,
            value: "sell",
            activeColor: "text-[#1763B6] border-[#1763B6]",
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
        currentPrice={realtime.price}
      />
    </div>
  );
}
