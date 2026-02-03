"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

const TradingChart = ({ data }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef(null);

    // Mock Data if not provided (Samsung Electronics style)
    const initialData = [
        { time: '2023-12-20', open: 72000, high: 73000, low: 71500, close: 72500 },
        { time: '2023-12-21', open: 72500, high: 73500, low: 72000, close: 73000 },
        { time: '2023-12-22', open: 73000, high: 74000, low: 72800, close: 73800 },
        { time: '2023-12-26', open: 73800, high: 74500, low: 73500, close: 74200 },
        { time: '2023-12-27', open: 74200, high: 75000, low: 74000, close: 74800 },
        { time: '2023-12-28', open: 74800, high: 75500, low: 74500, close: 75200 },
        { time: '2024-01-02', open: 75200, high: 76000, low: 75000, close: 75800 },
        { time: '2024-01-03', open: 75800, high: 76500, low: 75500, close: 76200 },
        { time: '2024-01-04', open: 76200, high: 77000, low: 76000, close: 76800 },
        { time: '2024-01-05', open: 76800, high: 77500, low: 76500, close: 74200 }, // Drop
    ];

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#ffffff' },
                textColor: '#333',
            },
            width: chartContainerRef.current.clientWidth,
            height: 294, // Fixed height or responsive
            grid: {
                vertLines: { color: '#f0f0f0' },
                horzLines: { color: '#f0f0f0' },
            },
            crosshair: {
                mode: 1, // Magnet mode
            },
            timeScale: {
                borderColor: '#e1e1e1',
            },
            rightPriceScale: {
                borderColor: '#e1e1e1',
            },
        });

        chartRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#c84a31',   // Upbit Red
            downColor: '#1261c4', // Upbit Blue
            borderVisible: false,
            wickUpColor: '#c84a31',
            wickDownColor: '#1261c4',
        });

        candlestickSeries.setData(data || initialData);

        // Auto-fit content
        chart.timeScale().fitContent();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
    );
};

export default TradingChart;
