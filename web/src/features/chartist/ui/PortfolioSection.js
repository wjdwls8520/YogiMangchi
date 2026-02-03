"use client";

import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Chartist.css';

const PortfolioSection = ({ portfolio }) => {
    const [isPublic, setIsPublic] = useState(portfolio?.isPublic || false);

    if (!portfolio) {
        return null;
    }

    const handleToggle = () => {
        setIsPublic(!isPublic);
        // TODO: API 호출로 서버에 공개/비공개 상태 저장
    };

    // 커스텀 툴팁
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="chartTooltip">
                    <p className="tooltipLabel">{payload[0].payload.name}</p>
                    <p className="tooltipValue">
                        {payload[0].value}%
                        {payload[0].payload.amount && ` (${payload[0].payload.amount})`}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="portfolioSection">
            <div className="portfolioHeader">
                <h2 className="portfolioTitle">포트폴리오</h2>
                <div className="portfolioToggle">
                    <span className="toggleLabel">{isPublic ? '공개' : '비공개'}</span>
                    <button
                        className={`toggleSwitch ${isPublic ? 'active' : ''}`}
                        onClick={handleToggle}
                        aria-label="포트폴리오 공개/비공개 토글"
                    >
                        <span className="toggleSlider"></span>
                    </button>
                </div>
            </div>

            {!isPublic ? (
                <div className="portfolioPrivate">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <p className="privateMessage">비공개 포트폴리오입니다</p>
                </div>
            ) : (
                <div className="chartContainer">
                    {/* 보유 종목 비중 (원형 차트) */}
                    <div className="chartBox">
                        <h3 className="chartTitle">보유 종목 비중</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={portfolio.holdings}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, value }) => `${name} ${value}%`}
                                    isAnimationActive={true}
                                >
                                    {portfolio.holdings.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={false}
                                    isAnimationActive={false}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 수익 기여도 (막대 차트) */}
                    <div className="chartBox">
                        <h3 className="chartTitle">수익 기여도</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={portfolio.profitContribution}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                                <XAxis type="number" stroke="var(--muted)" tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" stroke="var(--muted)" tickLine={false} axisLine={false} width={100} />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'transparent' }}
                                    isAnimationActive={false}
                                />
                                <Bar dataKey="profit" fill="#0088FE" radius={[0, 4, 4, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioSection;
