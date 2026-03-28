"use client";

import { useState, useEffect } from "react";
import Tabs from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useTickerStore } from "@/stores/useTickerStore";

export default function OrderForm() {
  const { selectedCoin, tickers, coinMetaList } = useTickerStore();
  const realtime = tickers[selectedCoin];
  const meta = coinMetaList.find(c => c.symbol === selectedCoin);

  // 로컬 폼 상태
  const [orderTab, setOrderTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market" | "auto">("limit");
  
  // 입력 필드 상태
  const [orderPrice, setOrderPrice] = useState<number | string>("");
  const [orderQty, setOrderQty] = useState<string>("");

  // 코인이 바뀔 때마다 주문 가격 인풋창을 현재가로 갱신해줍니다!
  useEffect(() => {
    if (realtime) setOrderPrice(realtime.price);
  }, [selectedCoin, realtime?.price]);

  if (!realtime || !meta) return <div className="lg:col-span-5 bg-white border border-gray-200 h-[520px] animate-pulse"></div>;

  const baseName = meta.baseAsset; // 예: BTC

  return (
    <div className="h-[520px] lg:col-span-5 bg-white border border-gray-200 p-6 flex flex-col lg:h-full">
        <Tabs 
          activeTab={orderTab}
          onChange={(val) => setOrderTab(val as "buy" | "sell")} 
          fullWidth={true}
          tabs={[
            { label: `${baseName} 매수`, value: "buy", activeColor: "text-[#E12343] border-[#E12343]" },
            { label: `${baseName} 매도`, value: "sell", activeColor: "text-[#1763B6] border-[#1763B6]" }
          ]}
        />
        
        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1 pt-6">
          <div className="flex gap-1">
            {["지정", "시장", "자동"].map((t) => (
              <button 
                key={t}
                onClick={() => setOrderType(t === "지정" ? "limit" : t === "시장" ? "market" : "auto")}
                className={`flex-1 py-2 text-xs font-black border transition-all ${
                  ((t === "지정" && orderType === "limit") || (t === "시장" && orderType === "market") || (t === "자동" && orderType === "auto")) 
                  ? "bg-gray-800 text-white border-gray-800" 
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >{t}</button>
            ))}
          </div>

          <div className="flex justify-between items-center text-[11px] font-black pt-2">
            <span className="text-gray-500 uppercase">주문가능</span>
            <span className="text-gray-900 font-black">0 <span className="text-gray-400 font-medium ml-1">USDT</span></span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px] font-black text-gray-500">주문가격</label>
              <div className="flex-1 flex gap-1">
                <Input 
                  type="number" 
                  value={orderPrice} 
                  onChange={(e) => setOrderPrice(e.target.value)}
                  className="text-right font-black h-10 bg-white border-gray-200 rounded-none flex-1" 
                />
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button className="w-6 h-[19px] bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50">+</button>
                  <button className="w-6 h-[19px] bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50">-</button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px] font-black text-gray-500">주문수량({baseName})</label>
              <div className="flex-1 space-y-1">
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="text-right font-black h-10 bg-white border-gray-200 rounded-none w-full" 
                />
                <div className="grid grid-cols-5 gap-1">
                  {[10, 25, 50, 100, '최대'].map(p => (
                    <button key={p.toString()} className="py-1.5 bg-white border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-all">
                      {typeof p === 'number' ? `${p}%` : p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 mt-auto">
            <div className="flex justify-between items-center mb-5 gap-11">
              <span className="text-xs font-bold text-gray-500">주문금액</span>
              {/* 총액 자동 계산: 가격 * 수량 */}
              <Input 
                type="text" 
                readOnly 
                value={(Number(orderPrice) * Number(orderQty) || 0).toLocaleString()} 
                className="flex-1 bg-gray-50 border-gray-200 rounded-none h-10 text-right font-bold" 
              />
            </div>
            <Button className={`w-full h-14 font-black text-lg rounded-none transition-all ${orderTab === "buy" ? "bg-[#E12343] hover:bg-red-700" : "bg-[#1763B6] hover:bg-blue-700"}`}>
              {orderTab === "buy" ? "매수" : "매도"}
            </Button>
          </div>
        </div>
    </div>
  );
}