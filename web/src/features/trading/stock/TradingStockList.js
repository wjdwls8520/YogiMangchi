"use client";

import React, { useState } from 'react';

const TradingStockList = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const stocks = [
        { code: '005930', name: '삼성전자', price: 74200, change: 1.5, volume: '100M' },
        { code: '000660', name: 'SK하이닉스', price: 135000, change: -0.8, volume: '30M' },
        { code: '035420', name: 'NAVER', price: 215000, change: 0.5, volume: '15M' },
        { code: '035720', name: '카카오', price: 54000, change: -1.2, volume: '25M' },
        { code: '373220', name: 'LG에너지솔루션', price: 420000, change: 2.1, volume: '5M' },
    ];

    const filteredStocks = stocks.filter(s => s.name.includes(searchTerm) || s.code.includes(searchTerm));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee' }}>
                <input
                    type="text"
                    placeholder="종목명/코드 검색"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#fff', borderBottom: '1px solid #eee', color: '#888', fontSize: '12px' }}>
                        <tr>
                            <th style={{ padding: '8px 4px 8px 16px', textAlign: 'left' }}>한글명</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>현재가</th>
                            <th style={{ padding: '8px 16px 8px 4px', textAlign: 'right' }}>전일대비</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStocks.map(stock => (
                            <tr key={stock.code} style={{ cursor: 'pointer', borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '12px 4px 12px 16px' }}>
                                    <div style={{ fontWeight: '600' }}>{stock.name}</div>
                                    <div style={{ fontSize: '11px', color: '#999' }}>{stock.code}</div>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: stock.change > 0 ? 'var(--trading-up-color)' : 'var(--trading-down-color)' }}>
                                    {stock.price.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 16px 12px 4px', textAlign: 'right', color: stock.change > 0 ? 'var(--trading-up-color)' : 'var(--trading-down-color)' }}>
                                    {stock.change > 0 ? '+' : ''}{stock.change}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradingStockList;
