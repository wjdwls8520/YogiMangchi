"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import UserAvatar from '../../../shared/ui/UserAvatar';

const ChartistCard = ({ chartist, rank }) => {
    const router = useRouter();

    const handleCardClick = () => {
        router.push(`/chartist/${chartist.id}`);
    };

    const handleFollowClick = (e) => {
        e.stopPropagation();
        alert(`${chartist.name}님을 팔로우했습니다!`);
    };

    // 순위 배지 색상
    const getRankClass = () => {
        if (rank === 1) return 'rank-gold';
        if (rank === 2) return 'rank-silver';
        if (rank === 3) return 'rank-bronze';
        return '';
    };

    return (
        <div className="chartistCard" onClick={handleCardClick}>
            {/* 순위 배지 */}
            <div className={`chartistRank ${getRankClass()}`}>
                {rank}
            </div>

            {/* 프로필 아바타 */}
            <div className="chartistAvatarWrapper">
                <UserAvatar
                    username={chartist.name}
                    avatarUrl={chartist.avatarUrl}
                    size="large"
                />
            </div>

            {/* 유저 정보 */}
            <h3 className="chartistName">{chartist.name}</h3>
            <p className="chartistTitle">{chartist.title}</p>

            {/* 통계 */}
            <div className="chartistStats">
                <div className="chartistStat">
                    <span className="chartistStatLabel">수익률</span>
                    <span className="chartistStatValue positive">+{chartist.returnRate}</span>
                </div>
                <div className="chartistStat">
                    <span className="chartistStatLabel">팔로워</span>
                    <span className="chartistStatValue">{chartist.followers.toLocaleString()}</span>
                </div>
            </div>

            {/* 팔로우 버튼 */}
            <button className="chartistFollowBtn" onClick={handleFollowClick}>
                팔로우
            </button>
        </div>
    );
};

export default ChartistCard;
