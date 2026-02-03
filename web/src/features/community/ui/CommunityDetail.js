"use client";

import React from 'react';
import CategorySidebar from './CategorySidebar';
import RankSidebar from './RankSidebar';
import PostDetail from './PostDetail';
import './Community.css'; // Ensure CSS is loaded

const CommunityDetail = ({ id }) => {
    return (
        <div className="communityContainer">
            {/* Left Sidebar */}
            <CategorySidebar />

            {/* Center Content (Detail View) */}
            <PostDetail id={id} />

            {/* Right Sidebar */}
            <RankSidebar />
        </div>
    );
};

export default CommunityDetail;
