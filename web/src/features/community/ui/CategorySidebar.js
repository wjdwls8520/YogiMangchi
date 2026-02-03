"use client";

import React from 'react';
import './Community.css';

const CategorySidebar = () => {
    const categories = [
        { id: 'general', label: '전체글' },
        { id: 'free', label: '자유게시판' },
        { id: 'analysis', label: '분석공유' },
        { id: 'news', label: '뉴스' },
        { id: 'qna', label: '질문답변' },
    ];

    const activeId = 'general'; // Mock active state

    return (
        <aside className="categorySidebar">
            {categories.map((cat) => (
                <div
                    key={cat.id}
                    className={`categoryItem ${activeId === cat.id ? 'active' : ''}`}
                >
                    <span className="categoryIcon">
                        {/* SVGs based on Category ID */}
                        {cat.id === 'general' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        )}
                        {cat.id === 'free' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        )}
                        {cat.id === 'analysis' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        )}
                        {cat.id === 'news' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>
                        )}
                        {cat.id === 'qna' && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        )}
                    </span>
                    <span className="categoryLabel">{cat.label}</span>
                </div>
            ))}
        </aside>
    );
};

export default CategorySidebar;
