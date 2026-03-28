"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const ORDER_OPTIONS = [
  { label: "전체", value: "all" },
  { label: "매수", value: "buy" },
  { label: "매도", value: "sell" },
];

const MOCK_ORDERS = [
  { id: 1, date: "2026-03-24 14:20:11", asset: "비트코인(BTC)", type: "매수", orderQty: "0.015", unfulfilledQty: "0.015", orderPrice: "105,000,000", watchPrice: "-", status: "미체결" },
  { id: 2, date: "2026-03-24 12:10:05", asset: "이더리움(ETH)", type: "매도", orderQty: "1.500", unfulfilledQty: "0.500", orderPrice: "4,300,000", watchPrice: "-", status: "부분체결" },
];

export default function UserOrderHistory() {
  const [historyTab, setHistoryTab] = useState("unfilled"); 
  const [selectedOrderType, setSelectedOrderType] = useState<string | number>("all");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedOrders(MOCK_ORDERS.map(o => o.id));
    else setSelectedOrders([]);
  };

  const handleSelectOne = (id: number) => {
    if (selectedOrders.includes(id)) setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
    else setSelectedOrders([...selectedOrders, id]);
  };

  return (
    <footer className="bg-white border border-gray-200 flex flex-col mb-10 w-full shrink-0 p-6">
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
            value={selectedOrderType}
            onChange={setSelectedOrderType}
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
  );
}