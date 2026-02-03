"use client";

import React from 'react';

const OrderBook = () => {
    // Mock Data
    const asks = [
        { price: 74500, volume: 12050, change: 1.91 },
        { price: 74400, volume: 5400, change: 1.78 },
        { price: 74300, volume: 8900, change: 1.64 },
        { price: 74200, volume: 15430, change: 1.50 },
    ];

    const bids = [
        { price: 74100, volume: 10200, change: 1.37 },
        { price: 74000, volume: 24500, change: 1.23 },
        { price: 73900, volume: 18900, change: 1.10 },
        { price: 73800, volume: 9800, change: 0.96 },
    ];

    const renderRow = (item, type) => {
        const barWidth = Math.min((item.volume / 30000) * 100, 100);
        return (
            <div className={`orderBookRow ${type}`} key={item.price} style={{ display: 'flex', borderBottom: '1px solid #f1f1f4', height: '40px', fontSize: '13px' }}>
                <div className="priceCell" style={{ flex: 1, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: type === 'ask' ? 'var(--trading-down-color)' : 'var(--trading-up-color)', fontWeight: '700', backgroundColor: type === 'ask' ? '#fcfdff' : '#fffcfc' }}>
                    {item.price.toLocaleString()}
                </div>
                <div className="volumeCell" style={{ flex: 1, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                    <div className="volumeBar" style={{ position: 'absolute', right: 0, top: 2, bottom: 2, width: `${barWidth}%`, backgroundColor: type === 'ask' ? 'rgba(18, 97, 196, 0.1)' : 'rgba(200, 74, 49, 0.1)' }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{item.volume.toLocaleString()}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="orderBookContainer" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="asks" style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden' }}>
                {asks.map(item => renderRow(item, 'ask'))}
            </div>
            <div className="currentPriceBar" style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '18px' }}>
                74,200
            </div>
            <div className="bids" style={{ flex: 1, overflow: 'hidden' }}>
                {bids.map(item => renderRow(item, 'bid'))}
            </div>
        </div>
    );
};

export default OrderBook;
