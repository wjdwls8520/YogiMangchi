'use client';

import React from 'react';
import './StockCard.css';

export default function StockCard({ code, name }) {
    // Mock data for display
    const mockData = {
        price: code === "005930" ? "70000" : "120000",
        change: "500",
        rate: "0.5",
        time: "153000"
    };

    // Time Formatter
    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        if (isNaN(timeStr) || timeStr.length !== 6) return timeStr;
        return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
    };

    return (
        <div className="stockCard cursor">
            <div className="cardTop">
                <span className="name">{name}</span>
                <div className="dotOffline"></div>
            </div>

            <div className="cardMid">
                <div className="price">
                    {Number(mockData.price).toLocaleString()}원
                </div>
                <div className={`change ${Number(mockData.change) > 0 ? 'up' : 'down'}`}>
                    {Number(mockData.change) > 0 ? '▲' : '▼'}
                    {Math.abs(Number(mockData.change)).toLocaleString()}
                    ({mockData.rate}%)
                </div>
            </div>
            <div className="time">{formatTime(mockData.time)} 기준</div>
        </div>
    );
}