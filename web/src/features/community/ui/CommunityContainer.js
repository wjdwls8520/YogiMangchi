"use client";

import React from 'react';
import CategorySidebar from './CategorySidebar';
import RankSidebar from './RankSidebar';
import CommunityFeed from './CommunityFeed';
import './Community.css';

const CommunityContainer = () => {
    return (
        <div className="communityContainer">
            {/* Left Sidebar */}
            <CategorySidebar />

            {/* Center Feed */}
            <CommunityFeed />

            {/* Right Sidebar */}
            <RankSidebar />
        </div>
    );
};

export default CommunityContainer;
