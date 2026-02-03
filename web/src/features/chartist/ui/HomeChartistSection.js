"use client";

import React from 'react';
import { chartists, sortChartists } from '../data/mockChartists';
import ChartistCard from './ChartistCard';
import './Chartist.css';

const HomeChartistSection = () => {
    // 수익금 순으로 정렬하여 상위 3명만 선택
    const topChartists = sortChartists(chartists, 'profit').slice(0, 3);

    return (
        <div className="chartistGrid">
            {topChartists.map((chartist, index) => (
                <ChartistCard
                    key={chartist.id}
                    chartist={chartist}
                    rank={index + 1}
                />
            ))}
        </div>
    );
};

export default HomeChartistSection;
