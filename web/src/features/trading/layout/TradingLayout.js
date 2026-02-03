"use client";

import React from 'react';
import Header from '../../../shared/layout/Header';
import Footer from '../../../shared/layout/Footer';
import RightSidebar from '../../../shared/layout/RightSidebar';
import './Trading.css';

const TradingLayout = ({ title, price, change, children }) => {
    return (
        <div className="tradingPageWrapper">
            <Header />
            <div className="tradingPage">
                {/* Header */}
                <header className="tradingHeader">
                    <div className="stockInfo">
                        <span className="stockName">삼성전자</span>
                        <span className="stockCode">005930</span>
                    </div>
                    <div className="priceInfo">
                        <span className="currentPrice up">74,200</span>
                        <span className="priceChange up">+1.5%</span>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="tradingContent">
                    {children}
                </div>
            </div>
            {/* Right Sidebar (Floating Buttons) */}
            <RightSidebar />
            <Footer />
        </div>
    );
};

export default TradingLayout;
