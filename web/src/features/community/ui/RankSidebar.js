"use client";

import React from 'react';
import './Community.css';
import Button from '../../../shared/ui/Button';
import UserAvatar from '../../../shared/ui/UserAvatar';

const RankSidebar = () => {
    // Mock Data from reference image
    const rankings = [
        { id: 1, name: "선비왕", return: "+636,785,609원 (174.01%)", avatar: null },
        { id: 2, name: "리차드슨의행복여행", return: "+326,635,235원 (85.74%)", avatar: null },
        { id: 3, name: "골드만샀수", return: "+320,639,157원 (77.29%)", avatar: null },
        { id: 4, name: "SBTT", return: "+274,986,828원 (132.30%)", avatar: null },
        { id: 5, name: "TomLee1004", return: "+224,954,597원 (45.47%)", avatar: null },
    ];

    return (
        <aside className="rankSidebar">
            <div>
                <h3 className="rankHeader">수익금 상위 투자자 TOP5</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>최근 1주일 기준</p>

                <div className="rankList">
                    {rankings.map((rank) => (
                        <div key={rank.id} className="rankItem">
                            <UserAvatar
                                username={rank.name}
                                size="small"
                            />
                            <div className="rankInfo">
                                <span className="rankName">{rank.name}</span>
                                <span className="rankReturn">{rank.return}</span>
                            </div>
                            <button className="followBtnSmall">팔로우</button>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default RankSidebar;
