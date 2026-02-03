"use client";

import React from 'react';
import TradingLayout from '../../features/trading/layout/TradingLayout';
import TradingChart from '../../features/trading/chart/TradingChart';
import OrderBook from '../../features/trading/order/OrderBook';
import OrderForm from '../../features/trading/order/OrderForm';
import TradingStockList from '../../features/trading/stock/TradingStockList';

export default function TradingPage() {
    return (
        <TradingLayout>
            {/* Left Column: Main Content */}
            <div className="tradingMain">
                {/* Top: Chart */}
                <div className="chartSection">
                    <TradingChart />
                </div>
                {/* Bottom: OrderBook & History */}
                <div className="bottomSection">
                    <div className="orderBookArea">
                        <OrderBook />
                    </div>
                    {/* Trade History or other info can go here */}
                    <div className="tradeHistoryArea" style={{ padding: '16px', fontSize: '13px', color: '#888', textAlign: 'center' }}>
                        체결내역 (준비중)
                    </div>
                </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="tradingSidebar">
                <div className="orderFormArea">
                    <OrderForm />
                </div>
                <div className="stockListArea">
                    <TradingStockList />
                </div>
            </div>
        </TradingLayout>
    );
}
