"use client";

import React, { useState } from 'react';
import './RightSidebar.css';

const RightSidebar = () => {
    const [activeTab, setActiveTab] = useState(null); // 'myInvest', 'watch', 'recent' ...

    const toggleTab = (tabName) => {
        if (activeTab === tabName) {
            setActiveTab(null); // Close if clicking same
        } else {
            setActiveTab(tabName); // Open new
        }
    };

    const closePanel = () => setActiveTab(null);

    const menuItems = [
        { id: 'myInvest', label: '내 투자', icon: <MyInvestIcon /> },
        { id: 'watch', label: '관심', icon: <HeartIcon /> },
        { id: 'recent', label: '최근 본', icon: <ClockIcon /> },
        { id: 'realtime', label: '실시간', icon: <FireIcon /> },
    ];

    const getPanelTitle = () => {
        const item = menuItems.find(i => i.id === activeTab);
        return item ? item.label : '';
    };

    return (
        <div className="sidebarContainer">
            {/* Depth 1: Icon Bar */}
            <aside className="iconBar">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`iconButton ${activeTab === item.id ? 'iconButtonActive' : ''}`}
                        onClick={() => toggleTab(item.id)}
                    >
                        {item.icon}
                        <span className="iconLabel">{item.label}</span>
                    </button>
                ))}
            </aside>

            {/* Depth 2: Content Panel */}
            <div className={`contentPanel ${activeTab ? 'contentPanelOpen' : ''}`}>
                <div className="panelHeader">
                    <span>{getPanelTitle()}</span>
                    <button className="closeButton" onClick={closePanel}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                        </svg>
                    </button>
                </div>
                <div className="panelBody">
                    {/* Placeholder Content */}
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.5 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p>로그인이 필요해요</p>
                </div>
            </div>
        </div>
    );
};

// Icons (Simple SVGs)
const MyInvestIcon = () => (
    <svg className="svgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
);

const HeartIcon = () => (
    <svg className="svgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
);

const ClockIcon = () => (
    <svg className="svgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const FireIcon = () => (
    <svg className="svgIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.222 1.193-3.066"></path>
    </svg>
);

export default RightSidebar;
