"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { chartists, sortChartists } from '../data/mockChartists';
import ChartistCard from './ChartistCard';
import './Chartist.css';

const ChartistList = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profit');

    // 정렬된 리스트
    const sortedChartists = sortChartists(chartists, activeTab);

    const tabs = [
        { id: 'profit', label: '수익금 높은순' },
        { id: 'return', label: '수익률 높은순' },
        { id: 'followers', label: '팔로워 많은순' }
    ];

    return (
        <div className="chartistContainer">
            {/* 헤더 */}
            <div className="chartistHeader">
                <h1 className="chartistPageTitle">차티스트</h1>
                <p className="chartistPageSubtitle">모의 투자 수익률 상위 투자자들을 만나보세요</p>
            </div>

            {/* 필터 탭 */}
            <div className="chartistTabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`chartistTab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 카드 그리드 */}
            <div className="chartistGrid">
                {sortedChartists.map((chartist, index) => (
                    <ChartistCard
                        key={chartist.id}
                        chartist={chartist}
                        rank={index + 1}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChartistList;
