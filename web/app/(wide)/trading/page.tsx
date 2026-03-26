"use client";

import { useState, useMemo } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Tabs from "@/components/ui/Tabs";
import { HiOutlineSearch } from "react-icons/hi"; 
import MainCandleChart from "@/components/MainCandleChart";

const ORDER_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "매수", value: "buy" },
  { label: "매도", value: "sell" },
  { label: "자동", value: "auto" },
];

// 가짜 코인 데이터 (소팅 테스트용)
const MOCK_COINS = [
  { id: 1, name: "비트코인", symbol: "BTC", price: 105867000, change: -0.03, volume: 101072 },
  { id: 2, name: "이더리움", symbol: "ETH", price: 4250000, change: 1.25, volume: 85200 },
  { id: 3, name: "리플", symbol: "XRP", price: 820, change: 5.12, volume: 120500 },
  { id: 4, name: "솔라나", symbol: "SOL", price: 215000, change: -2.10, volume: 65000 },
  { id: 5, name: "도지코인", symbol: "DOGE", price: 245, change: 0.00, volume: 45000 },
  ...Array(15).fill(null).map((_, i) => ({
    id: i + 6,
    name: `알트코인${i + 1}`,
    symbol: `ALT${i + 1}`,
    price: 150000 + (i * 10000), 
    change: i % 2 === 0 ? 1.45 : -2.15, 
    volume: 12000 + (i * 500)
  }))
];

// 가짜 하단 주문 데이터
const MOCK_ORDERS = [
  { id: 1, date: "2026-03-24 14:20:11", asset: "비트코인(BTC)", type: "매수", orderQty: "0.015", unfulfilledQty: "0.015", orderPrice: "105,000,000", watchPrice: "-", status: "미체결" },
  { id: 2, date: "2026-03-24 12:10:05", asset: "이더리움(ETH)", type: "매도", orderQty: "1.500", unfulfilledQty: "0.500", orderPrice: "4,300,000", watchPrice: "-", status: "부분체결" },
  { id: 3, date: "2026-03-24 09:05:33", asset: "리플(XRP)", type: "매수", orderQty: "1,000", unfulfilledQty: "1,000", orderPrice: "810", watchPrice: "815", status: "감시중" },
];

export default function TradingPage() {
  // 🌟 1. 각 탭 영역별로 독립적인 State 생성
  const [coinTab, setCoinTab] = useState("krw"); // 좌측 코인 목록 탭
  const [orderTab, setOrderTab] = useState<"buy" | "sell">("buy"); // 우측 매수/매도 탭
  const [historyTab, setHistoryTab] = useState("unfilled"); // 하단 미체결/체결 탭
  
  const [selectedOrder, setSelectedOrder] = useState<string | number>("all");
  const [orderType, setOrderType] = useState<"limit" | "market" | "auto">("limit");
  
  // 코인 리스트 소팅 상태
  const [sortConfig, setSortConfig] = useState<{ key: keyof typeof MOCK_COINS[0] | null, direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  
  // 하단 주문 테이블 체크박스 상태
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  // 소팅 로직
  const sortedCoins = useMemo(() => {
    let sortableItems = [...MOCK_COINS];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [sortConfig]);

  const requestSort = (key: keyof typeof MOCK_COINS[0]) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  // 체크박스 로직
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedOrders(MOCK_ORDERS.map(o => o.id));
    else setSelectedOrders([]);
  };

  const handleSelectOne = (id: number) => {
    if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    else setSelectedOrders([...selectedOrders, id]);
  };

  return (
    <div className="min-h-screen text-gray-900">
      <div className="mx-auto max-w-[1480px] flex flex-col lg:flex-row gap-3 items-start">
        
        {/* ================= 좌측 코인 목록 ================= */}
        <aside className="w-full lg:w-[360px] lg:sticky lg:top-4 bg-white border border-gray-200 flex flex-col shrink-0 lg:h-[calc(100vh-32px)] overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative mb-4">
              <Input placeholder="자산명/심볼 검색" className="pl-9 h-10 text-xs bg-gray-50 border border-gray-200 rounded-none" />
              <HiOutlineSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>
            {/* 🌟 2. coinTab 상태 연결 */}
            <Tabs 
              activeTab={coinTab}
              onChange={setCoinTab}
              fullWidth={true}
              tabs={[
                { label: "원화", value: "krw" },
                { label: "BTC", value: "btc" },
                { label: "보유", value: "have" },
                { label: "관심", value: "favorite" }
              ]}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-[11px] whitespace-nowrap">
              <thead className="sticky top-0 bg-white text-[10px] font-bold text-gray-500 border-b border-gray-200 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-left cursor-pointer hover:bg-gray-50" onClick={() => requestSort('name')}>
                    자산 {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-2 text-right cursor-pointer hover:bg-gray-50" onClick={() => requestSort('price')}>
                    현재 {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-2 text-right cursor-pointer hover:bg-gray-50" onClick={() => requestSort('change')}>
                    변동(당일) {sortConfig.key === 'change' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-gray-50" onClick={() => requestSort('volume')}>
                    거래금액 {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCoins.map((coin) => (
                  <tr key={coin.id} className="hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-black">{coin.name}</span>
                        <span className="text-[9px] text-gray-400 font-medium tracking-tighter">{coin.symbol}</span>
                      </div>
                    </td>
                    <td className={`py-3 px-2 text-right font-black ${coin.change > 0 ? "text-[#E12343]" : coin.change < 0 ? "text-[#1763B6]" : "text-gray-900"}`}>
                      {coin.price.toLocaleString()}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold ${coin.change > 0 ? "text-[#E12343]" : coin.change < 0 ? "text-[#1763B6]" : "text-gray-900"}`}>
                      {coin.change > 0 ? `+${coin.change}` : coin.change}%
                    </td>
                    <td className="py-3 px-3 text-right text-[10px] text-gray-500 font-medium">
                      {coin.volume.toLocaleString()}백만
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

        {/* ================= 우측 메인 콘텐츠 ================= */}
        <main className="flex-1 flex flex-col gap-3 w-full overflow-x-hidden">
          
          <header className="bg-white p-5 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-black italic">BTC</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#E12343]">105,867,000</span>
                <span className="text-sm font-bold text-[#E12343]">▼ 31,000 (-0.03%)</span>
              </div>
            </div>
            <div className="flex gap-6 text-[11px] font-bold">
               <div className="border-l border-gray-200 pl-4">
                  <p className="text-gray-400 mb-1">고가(24H)</p>
                  <p className="text-gray-900 font-black">109,240,000</p>
               </div>
               <div className="border-l border-gray-200 pl-4">
                  <p className="text-gray-400 mb-1">저가(24H)</p>
                  <p className="text-gray-900 font-black">104,120,000</p>
               </div>
               <div className="border-l border-gray-200 pl-4">
                  <p className="text-gray-400 mb-1">거래량(24H)</p>
                  <p className="text-gray-900 font-black">961.45 BTC</p>
               </div>
            </div>
          </header>

          <section className="w-full bg-white border border-gray-200 shrink-0">
            <MainCandleChart />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0 items-stretch">
            
            <div className="lg:col-span-3 bg-white border border-gray-200 flex flex-col h-[600px] overflow-hidden">
               <div className="p-3 border-b border-gray-200 bg-gray-50/50 font-black text-xs">체결내역</div>
               <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-3 text-[10px] font-bold text-gray-500 mb-3 px-1 uppercase">
                     <span>시간</span>
                     <span className="text-center">가격(KRW)</span>
                     <span className="text-right">수량(BTC)</span>
                  </div>
                  <div className="space-y-2">
                     {[...Array(20)].map((_, i) => (
                       <div key={i} className="grid grid-cols-3 text-[11px] font-bold px-1">
                          <span className="text-gray-400 font-medium">17:06:24</span>
                          <span className={`text-center ${i % 3 === 0 ? "text-[#E12343]" : "text-[#1763B6]"}`}>105,867,000</span>
                          <span className="text-right text-gray-900">0.00{i+1}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-gray-200 flex flex-col h-[600px] overflow-hidden">
               <div className="grid grid-cols-2 p-3 border-b border-gray-200 font-black text-xs bg-gray-50/50">
                  <span>호가 (KRW)</span>
                  <span className="text-right">잔량 (BTC)</span>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {[...Array(10)].map((_, i) => (
                    <div key={`ask-${i}`} className="flex justify-between items-center h-10 px-4 relative border-b border-gray-100 hover:bg-red-50/10 cursor-pointer">
                      <div className="absolute right-0 top-0 bottom-0 bg-red-50/30" style={{ width: `${(10-i)*8}%` }}></div>
                      <span className="relative z-10 text-[12px] font-black text-[#1763B6]">105,8{i}6,000</span>
                      <span className="relative z-10 text-[11px] font-bold text-gray-500">0.1245</span>
                    </div>
                  ))}
                  <div className="h-12 bg-gray-100 flex items-center justify-between px-4 sticky top-0 bottom-0 z-10 border-y border-gray-300">
                     <span className="text-sm font-black text-gray-900">105,867,000</span>
                     <span className="text-[10px] font-bold text-red-500 tracking-tight">▲ 1.25%</span>
                  </div>
                  {[...Array(10)].map((_, i) => (
                    <div key={`bid-${i}`} className="flex justify-between items-center h-10 px-4 relative border-b border-gray-100 hover:bg-blue-50/10 cursor-pointer">
                      <div className="absolute right-0 top-0 bottom-0 bg-blue-50/30" style={{ width: `${(i+1)*10}%` }}></div>
                      <span className="relative z-10 text-[12px] font-black text-[#E12343]">105,80{i},000</span>
                      <span className="relative z-10 text-[11px] font-bold text-gray-500">0.4502</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-gray-200 p-6 flex flex-col h-[600px]">
               {/* 🌟 3. orderTab 상태 연결 (강제 타입 변환 사용) */}
               <Tabs 
                  activeTab={orderTab}
                  onChange={(val) => setOrderTab(val as "buy" | "sell")} 
                  fullWidth={true}
                  tabs={[
                    { 
                      label: "BTC 매수", 
                      value: "buy", 
                      activeColor: "text-[#E12343] border-[#E12343]"
                    },
                    { 
                      label: "BTC 매도", 
                      value: "sell", 
                      activeColor: "text-[#1763B6] border-[#1763B6]"
                    }
                  ]}
                />
               
               <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1 pt-6">
                  <div className="flex gap-1">
                    {["지정", "시장", "자동"].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setOrderType(t === "지정" ? "limit" : t === "시장" ? "market" : "auto")}
                        className={`flex-1 py-2 text-xs font-black border transition-all ${((t === "지정" && orderType === "limit") || (t === "시장" && orderType === "market") || (t === "자동" && orderType === "auto")) ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                      >{t}</button>
                    ))}
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-black pt-2">
                     <span className="text-gray-500 uppercase">주문가능</span>
                     <span className="text-gray-900 font-black">0 <span className="text-gray-400 font-medium ml-1">KRW</span></span>
                  </div>

                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <label className="w-20 text-[11px] font-black text-gray-500">주문가격(KRW)</label>
                        <div className="flex-1 flex gap-1">
                           <Input type="number" defaultValue={105867000} className="text-right font-black h-10 bg-white border-gray-200 rounded-none flex-1" />
                           <div className="flex flex-col gap-0.5 shrink-0">
                              <button className="w-6 h-[19px] bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50">+</button>
                              <button className="w-6 h-[19px] bg-white border border-gray-200 flex items-center justify-center text-xs hover:bg-gray-50">-</button>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <label className="w-20 text-[11px] font-black text-gray-500">주문수량(BTC)</label>
                        <div className="flex-1 space-y-1">
                           <Input type="number" placeholder="0" className="text-right font-black h-10 bg-white border-gray-200 rounded-none w-full" />
                           <div className="grid grid-cols-5 gap-1">
                              {[10, 25, 50, 100, '최대'].map(p => (
                                <button key={p.toString()} className="py-1.5 bg-white border border-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-all">{typeof p === 'number' ? `${p}%` : p}</button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 mt-auto">
                     <div className="flex justify-between items-center mb-5 gap-11">
                        <span className="text-xs font-bold text-gray-500">주문금액</span>
                        <Input type="text" className="flex-1 bg-white border-gray-200 rounded-none h-10" />
                     </div>
                     <Button className={`w-full h-14 font-black text-lg rounded-none transition-all ${orderTab === "buy" ? "bg-[#E12343] hover:bg-red-700" : "bg-[#1763B6] hover:bg-blue-700"}`}>
                        {orderTab === "buy" ? "매수" : "매도"}
                     </Button>
                </div>
             </div>
          </div>
        </section>

        {/* ================= 하단 테이블 ================= */}
        <footer className="bg-white border border-gray-200 flex flex-col mb-10 w-full shrink-0 p-6">
           {/* 🌟 4. historyTab 상태 연결 및 value 고유값 부여 */}
           <Tabs 
              activeTab={historyTab}
              onChange={setHistoryTab}
              fullWidth={false} 
              tabs={[
                { label: "미체결 주문", value: "unfilled" },
                { label: "체결 주문", value: "filled" }
              ]}
            />
           
           <div className="pt-6">
              <div className="flex justify-between items-center mb-4">
                 <Select
                    options={ORDER_OPTIONS}
                    value={selectedOrder}
                    onChange={setSelectedOrder}
                    size="sm"
                  />
                 <Button variant="white" size="sm" className="border-gray-300 rounded-none text-xs font-bold h-9">
                   선택 주문취소
                 </Button>
              </div>

              <div className="w-full overflow-x-auto border-t border-gray-200">
                 <table className="w-full text-[11px] text-center whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                       <tr>
                          <th className="py-2.5 px-3">
                             <input type="checkbox" onChange={handleSelectAll} checked={selectedOrders.length === MOCK_ORDERS.length && MOCK_ORDERS.length > 0} className="cursor-pointer" />
                          </th>
                          <th className="py-2.5 px-3">주문일시</th>
                          <th className="py-2.5 px-3 text-left">자산</th>
                          <th className="py-2.5 px-3">구분</th>
                          <th className="py-2.5 px-3 text-right">주문수량</th>
                          <th className="py-2.5 px-3 text-right">미체결수량</th>
                          <th className="py-2.5 px-3 text-right">주문가격</th>
                          <th className="py-2.5 px-3 text-right">감시가격</th>
                          <th className="py-2.5 px-3">상태</th>
                       </tr>
                    </thead>
                    <tbody>
                       {MOCK_ORDERS.length > 0 ? MOCK_ORDERS.map((order) => (
                         <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-3">
                               <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => handleSelectOne(order.id)} className="cursor-pointer" />
                            </td>
                            <td className="py-3 px-3 text-gray-500">{order.date}</td>
                            <td className="py-3 px-3 text-left font-black">{order.asset}</td>
                            <td className={`py-3 px-3 font-bold ${order.type === '매수' ? 'text-[#E12343]' : 'text-[#1763B6]'}`}>{order.type}</td>
                            <td className="py-3 px-3 text-right font-medium">{order.orderQty}</td>
                            <td className="py-3 px-3 text-right font-black text-gray-900">{order.unfulfilledQty}</td>
                            <td className="py-3 px-3 text-right font-medium">{order.orderPrice}</td>
                            <td className="py-3 px-3 text-right font-medium">{order.watchPrice}</td>
                            <td className="py-3 px-3 font-bold text-gray-700">{order.status}</td>
                         </tr>
                       )) : (
                         <tr>
                           <td colSpan={9} className="py-12 text-gray-400 font-bold">내역이 존재하지 않습니다.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </footer>

      </main>
    </div>
  </div>
  );
}