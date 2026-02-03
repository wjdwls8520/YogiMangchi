"use client";

import React from 'react';
import './IPO.css';

const IPOList = () => {
    // Mock Data
    const ipoData = [
        {
            id: 1,
            name: "LG CNS",
            sector: "IT 서비스",
            subDate: "2024.10.10 ~ 10.11",
            annDate: "2024.10.15"
        },
        {
            id: 2,
            name: "케이뱅크",
            sector: "인터넷 은행",
            subDate: "2024.10.21 ~ 10.22",
            annDate: "2024.10.24"
        },
        {
            id: 3,
            name: "더본코리아",
            sector: "외식 프랜차이즈",
            subDate: "2024.10.28 ~ 10.29",
            annDate: "2024.10.31"
        },
        {
            id: 4,
            name: "서울로보틱스",
            sector: "AI 소프트웨어",
            subDate: "2024.11.04 ~ 11.05",
            annDate: "2024.11.07"
        }
    ];

    return (
        <div className="ipoListGrid">
            {ipoData.map((item) => (
                <div key={item.id} className="ipoItem">
                    <div className="ipoInfo">
                        <span className="ipoName">{item.name}</span>
                        <span className="ipoSector">{item.sector}</span>
                    </div>
                    <div className="ipoDates">
                        <div className="ipoDateRow">
                            <span className="ipoDateLabel">청약</span>
                            <span className="ipoDateValue">{item.subDate}</span>
                        </div>
                        <div className="ipoDateRow">
                            <span className="ipoDateLabel">배정</span>
                            <span className="ipoDateValue">{item.annDate}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default IPOList;
