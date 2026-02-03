"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getChartistById } from '../data/mockChartists';
import UserAvatar from '../../../shared/ui/UserAvatar';
import BackButton from '../../../shared/ui/BackButton';
import PortfolioSection from './PortfolioSection';
import GuestBook from './GuestBook';
import './Chartist.css';

const ChartistProfile = ({ userId }) => {
    const router = useRouter();
    const chartist = getChartistById(userId);
    const [isFollowing, setIsFollowing] = useState(false);

    if (!chartist) {
        return (
            <div className="chartistContainer">
                <div className="errorState">
                    <p>존재하지 않는 차티스트입니다.</p>
                    <BackButton label="목록으로 돌아가기" onClick={() => router.push('/chartist')} />
                </div>
            </div>
        );
    }

    const handleFollowClick = () => {
        setIsFollowing(!isFollowing);
        alert(isFollowing ? `${chartist.name}님을 언팔로우했습니다.` : `${chartist.name}님을 팔로우했습니다!`);
    };

    const handleBackClick = () => {
        router.push('/chartist');
    };

    return (
        <div className="chartistContainer">
            {/* 뒤로가기 버튼 */}
            <BackButton label="목록으로" onClick={handleBackClick} />

            {/* 프로필 헤더 */}
            <div className="profileHeader">
                <div className="profileAvatarSection">
                    <UserAvatar
                        username={chartist.name}
                        avatarUrl={chartist.avatarUrl}
                        size="xlarge"
                    />
                </div>

                <div className="profileInfo">
                    <h1 className="profileName">{chartist.name}</h1>
                    <p className="profileTitle">{chartist.title}</p>
                    {chartist.bio && <p className="profileBio">{chartist.bio}</p>}

                    <button
                        className={`profileFollowBtn ${isFollowing ? 'following' : ''}`}
                        onClick={handleFollowClick}
                    >
                        {isFollowing ? '팔로잉' : '팔로우'}
                    </button>
                </div>
            </div>

            {/* 통계 카드 */}
            <div className="statsGrid">
                <div className="statCard">
                    <div className="statLabel">총 수익금</div>
                    <div className="statValue profit">{chartist.totalProfit}</div>
                </div>
                <div className="statCard">
                    <div className="statLabel">수익률</div>
                    <div className="statValue profit">+{chartist.returnRate}</div>
                </div>
                <div className="statCard">
                    <div className="statLabel">팔로워</div>
                    <div className="statValue">{chartist.followers.toLocaleString()}</div>
                </div>
                <div className="statCard">
                    <div className="statLabel">팔로잉</div>
                    <div className="statValue">{chartist.following.toLocaleString()}</div>
                </div>
            </div>

            {/* 포트폴리오 섹션 */}
            <PortfolioSection portfolio={chartist.portfolio} />

            {/* 방명록 섹션 */}
            <GuestBook guestbook={chartist.guestbook} userName={chartist.name} />
        </div>
    );
};

export default ChartistProfile;
