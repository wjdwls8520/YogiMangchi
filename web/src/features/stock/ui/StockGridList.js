"use client";

import React from 'react';
import StockCard from './StockCard';
import './StockLayout.css';

const StockGridList = ({ stocks }) => {
    if (!stocks || stocks.length === 0) return null;

    return (
        <div className="stockListGrid">
            {stocks.map((stock) => (
                <StockCard key={stock.code} code={stock.code} name={stock.name} />
            ))}
        </div>
    );
};

export default StockGridList;
