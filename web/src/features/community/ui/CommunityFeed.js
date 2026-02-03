"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PostCard from './PostCard';
import WriteForm from './WriteForm';
import { posts } from '../data/mockPosts';
import './Community.css';

const CommunityFeed = () => {
    const [activeTab, setActiveTab] = useState('popular');
    const [showWriteModal, setShowWriteModal] = useState(false);

    return (
        <div className="communityFeed">
            {/* Sticky Feed Header with Search */}
            <div className="feedHeader">
                <div className='feedHeaderInner'>
                    {/* Search Bar Removed - Moved to Global Header */}

                    <div className="feedTabs">
                        <div
                            className={`feedTab ${activeTab === 'popular' ? 'active' : ''}`}
                            onClick={() => setActiveTab('popular')}
                        >
                            주간 인기글
                        </div>
                        <div
                            className={`feedTab ${activeTab === 'latest' ? 'active' : ''}`}
                            onClick={() => setActiveTab('latest')}
                        >
                            최신글
                        </div>
                    </div>
                </div>
            </div>

            <div className='feedBody'>
                {/* Post List */}
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}

                {/* Load More Placeholder */}
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                    스크롤하여 더 보기...
                </div>
            </div>

            {/* Write FAB */}
            <button className="writeFab" aria-label="글쓰기" onClick={() => setShowWriteModal(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
            </button>

            {/* Write Modal - Global Overlay */}
            <WriteForm
                isOpen={showWriteModal}
                onClose={() => setShowWriteModal(false)}
            />

        </div>
    );
};

export default CommunityFeed;
