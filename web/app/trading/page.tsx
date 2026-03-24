"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { HiOutlineSearch } from "react-icons/hi"; 
import MainCandleChart from "@/components/MainCandleChart";

export default function TradingPage() {
  const [orderTab, setOrderTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market" | "auto">("limit");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1600px] flex flex-col lg:flex-row gap-5 items-start">
        
        {/* 코인목록 */}
        <aside className="w-full lg:w-[320px] lg:sticky lg:top-6 border border-gray-200 flex flex-col shrink-0 lg:h-[calc(100vh-48px)] overflow-hidden pt-3 pb-3 rounded-[32px]">
          <div className="p-5 border-b border-gray-100">
            <div className="relative mb-4">
              <Input 
                placeholder="자산명/심볼 검색" 
                className="pl-10" 
              />
              <HiOutlineSearch className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex gap-4 text-[12px] font-black text-gray-400 border-b border-gray-100 pb-2">
              <button className="text-gray-900 border-b-2 border-gray-900 pb-2">원화</button>
              <button className="hover:text-gray-600">BTC</button>
              <button className="hover:text-gray-600">관심</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-white text-[10px] font-bold text-gray-400 shadow-sm z-10">
                <tr>
                  <th className="py-2 px-5 text-left font-bold">자산명</th>
                  <th className="py-2 px-2 text-right font-bold">현재가</th>
                  <th className="py-2 px-5 text-right font-bold">변동률</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(20)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors">
                    <td className="py-4 px-5 font-black">비트코인<br/><span className="text-[9px] text-gray-400 font-medium tracking-tighter">BTC</span></td>
                    <td className="py-4 text-right font-black text-[#E12343]">105,867,000</td>
                    <td className="py-4 px-5 text-right font-bold text-[#E12343]">-0.03%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 flex flex-col gap-5 w-full">
          
          {/* 헤더 */}
          <header className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-black italic">BTC</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#E12343]">105,867,000</span>
                <span className="text-sm font-bold text-[#E12343]">▼ 31,000 (-0.03%)</span>
              </div>
            </div>
            <div className="flex gap-6 text-[11px] font-bold">
               <div className="border-l border-gray-100 pl-4">
                  <p className="text-gray-400 mb-1">고가(24H)</p>
                  <p className="text-gray-900 font-black">109,240,000</p>
               </div>
               <div className="border-l border-gray-100 pl-4">
                  <p className="text-gray-400 mb-1">저가(24H)</p>
                  <p className="text-gray-900 font-black">104,120,000</p>
               </div>
               <div className="border-l border-gray-100 pl-4">
                  <p className="text-gray-400 mb-1">거래량(24H)</p>
                  <p className="text-gray-900 font-black">961.45 BTC</p>
               </div>
            </div>
          </header>

          {/* 차트 */}
          <section className="h-[450px] lg:h-[500px] bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden relative shrink-0">
             <div className="absolute inset-0 bg-gray-50/10 flex items-center justify-center">
                <MainCandleChart />
             </div>
          </section>

          {/* 4️⃣중단 3컬럼*/}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 shrink-0 items-stretch">
            
            {/* 체결 내역 */}
            <div className="lg:col-span-3 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-[650px] overflow-hidden">
               <div className="p-4 border-b border-gray-100 bg-gray-50/20 font-black text-xs">체결내역</div>
               <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-3 text-[10px] font-bold text-gray-400 mb-3 px-2 uppercase">
                     <span>시간</span>
                     <span className="text-center">가격(KRW)</span>
                     <span className="text-right">수량(BTC)</span>
                  </div>
                  <div className="space-y-2">
                     {[...Array(20)].map((_, i) => (
                       <div key={i} className="grid grid-cols-3 text-[11px] font-bold px-2">
                          <span className="text-gray-300 font-medium">17:06:24</span>
                          <span className={`text-center ${i % 3 === 0 ? "text-[#E12343]" : "text-[#1763B6]"}`}>105,867,000</span>
                          <span className="text-right text-gray-900 font-medium">0.00{i+1}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* 실시간 호가 정보 */}
            <div className="lg:col-span-4 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-[650px] overflow-hidden">
               <div className="grid grid-cols-2 p-4 border-b border-gray-100 font-black text-xs bg-gray-50/30">
                  <span>호가 (KRW)</span>
                  <span className="text-right">잔량 (BTC)</span>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {/* 매도 호가 */}
                  {[...Array(12)].map((_, i) => (
                    <div key={`ask-${i}`} className="flex justify-between items-center h-10 px-5 relative border-b border-gray-50/50 hover:bg-red-50/10 cursor-pointer">
                      <div className="absolute right-0 top-0 bottom-0 bg-red-50/20" style={{ width: `${(12-i)*8}%` }}></div>
                      <span className="relative z-10 text-[12px] font-black text-[#1763B6]">105,8{i}6,000</span>
                      <span className="relative z-10 text-[11px] font-bold text-gray-400">0.1245</span>
                    </div>
                  ))}
                  {/* 현재가 밴드 */}
                  <div className="h-14 bg-gray-900 flex items-center justify-between px-5 sticky top-0 bottom-0 z-10 shadow-lg">
                     <span className="text-sm font-black text-white">105,867,000</span>
                     <span className="text-[10px] font-bold text-red-400 tracking-tight">▲ 1.25%</span>
                  </div>
                  {/* 매수 호가 */}
                  {[...Array(12)].map((_, i) => (
                    <div key={`bid-${i}`} className="flex justify-between items-center h-10 px-5 relative border-b border-gray-50/50 hover:bg-blue-50/10 cursor-pointer">
                      <div className="absolute right-0 top-0 bottom-0 bg-blue-50/20" style={{ width: `${(i+1)*10}%` }}></div>
                      <span className="relative z-10 text-[12px] font-black text-[#E12343]">105,80{i},000</span>
                      <span className="relative z-10 text-[11px] font-bold text-gray-400">0.4502</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* 주문 입력 */}
            <div className="lg:col-span-5 bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 flex flex-col h-[650px]">
               <div className="flex gap-8 border-b border-gray-100 mb-8 font-black text-base shrink-0">
                  <button onClick={() => setOrderTab("buy")} className={`pb-4 transition-all ${orderTab === "buy" ? "text-[#E12343] border-b-[3px] border-[#E12343]" : "text-gray-300"}`}>BTC 매수</button>
                  <button onClick={() => setOrderTab("sell")} className={`pb-4 transition-all ${orderTab === "sell" ? "text-[#1763B6] border-b-[3px] border-[#1763B6]" : "text-gray-300"}`}>BTC 매도</button>
               </div>
               
               <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
                  {/* 주문 유형 (지정/시장/자동) */}
                  <div className="flex gap-1 p-1 bg-gray-50 rounded-[14px] border border-gray-100">
                    {["지정", "시장", "자동"].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setOrderType(t === "지정" ? "limit" : t === "시장" ? "market" : "auto")}
                        className={`flex-1 py-2 rounded-[10px] text-xs font-black transition-all ${((t === "지정" && orderType === "limit") || (t === "시장" && orderType === "market") || (t === "자동" && orderType === "auto")) ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
                      >{t}</button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-black pt-2 tracking-tight">
                     <span className="text-gray-400 uppercase">주문가능</span>
                     <span className="text-gray-900 font-black">0 <span className="text-gray-400 font-medium ml-1">KRW</span></span>
                  </div>

                  {/* 가격 입력 (+/- 버튼 포함) */}
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-gray-400 ml-1">주문가격 (KRW)</label>
                     <div className="flex gap-1">
                        <Input type="number" defaultValue={105867000} className="text-right font-black h-12 rounded-2xl bg-gray-50 border-none text-lg flex-1" />
                        <div className="flex flex-col gap-1 shrink-0">
                           <button className="w-8 h-[22px] bg-white border border-gray-100 rounded-md flex items-center justify-center text-xs font-bold hover:bg-gray-50">+</button>
                           <button className="w-8 h-[22px] bg-white border border-gray-200 rounded-md flex items-center justify-center text-xs font-bold hover:bg-gray-50">-</button>
                        </div>
                     </div>
                  </div>

                  {/* 수량 입력 */}
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-gray-400 ml-1">주문수량 (BTC)</label>
                     <Input type="number" placeholder="0" className="text-right font-black h-12 rounded-2xl bg-gray-50 border-none text-lg" />
                     <div className="grid grid-cols-5 gap-1 pt-1">
                        {[10, 25, 50, 100, '최대'].map(p => (
                          <button key={p.toString()} className="py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 hover:bg-gray-900 hover:text-white transition-all">{typeof p === 'number' ? `${p}%` : p}</button>
                        ))}
                     </div>
                  </div>

                  {/* 최종 주문 요약 */}
                  <div className="pt-8 border-t border-gray-50 mt-auto">
                     <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">총 주문금액</span>
                        <span className="text-2xl font-black text-gray-900">0 <span className="text-xs text-gray-400 font-medium ml-1">KRW</span></span>
                     </div>
                     <Button className={`w-full h-16 rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-95 ${orderTab === "buy" ? "bg-[#E12343] hover:bg-red-700 shadow-red-100" : "bg-[#1763B6] hover:bg-blue-700 shadow-blue-100"}`}>
                        {orderTab === "buy" ? "BTC 매수" : "BTC 매도"}
                     </Button>
                </div>
             </div>
          </div>
        </section>

        {/* 하단 자산 & 주문 내역 */}
        <footer className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100 min-h-[350px] mb-10 w-full shrink-0">
           <div className="flex gap-10 border-b border-gray-100 mb-8 font-black text-sm text-gray-400">
              <button className="pb-5 text-gray-900 border-b-[3px] border-gray-900 uppercase">채결주문</button>
              <button className="pb-5 hover:text-gray-600 transition-colors uppercase">미채결주문</button>
           </div>
           <div className="py-20 text-center flex flex-col items-center gap-4">
              <span className="text-4xl grayscale opacity-30">📂</span>
              <p className="text-sm font-bold text-gray-300">내역이 존재하지 않습니다.</p>
           </div>
        </footer>

      </main>
    </div>
  </div>
  );
}