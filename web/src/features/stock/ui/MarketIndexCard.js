"use client";

import React from 'react';
import './MarketIndexCard.css';

/**
 * Renders a market index card with a mini chart.
 * @param {object} props
 * @param {string} props.name - Index name (e.g. KOSPI)
 * @param {string} props.value - Current value (e.g. 2,500.00)
 * @param {string} props.change - Change amount (e.g. +12.34)
 * @param {string} props.changeRate - Change rate (e.g. +0.5%)
 * @param {boolean} props.isUp - True if positive change
 * @param {string} [props.chartPath] - SVG path data for the mini chart
 */
const MarketIndexCard = ({ name, value, change, changeRate, isUp, chartPath }) => {
    // Default dummy chart path if not provided
    const pathData = chartPath || "M0,50 Q20,40 40,30 T80,20 T120,40 T160,10 T200,5";

    return (
        <div className="marketIndexCard cursor">
            <div className="marketIndexCardHeader">
                <div>
                    <span className="marketIndexCardName">{name}</span>
                    <div className="marketIndexCardValue">{value}</div>
                </div>
                <div className={`marketIndexCardChange ${isUp ? 'up' : 'down'}`}>
                    {isUp ? '▲' : '▼'} {change} ({changeRate})
                </div>
            </div>

            <svg className={`marketIndexCardChart ${isUp ? 'up' : 'down'}`} viewBox="0 0 200 60" preserveAspectRatio="none">
                <path d={pathData} />
                {/* Simple gradient definition could be added here if needed */}
            </svg>
        </div>
    );
};

export default MarketIndexCard;
