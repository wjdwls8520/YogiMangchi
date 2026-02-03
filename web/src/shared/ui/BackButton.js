"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import './BackButton.css';

/**
 * BackButton - 공통 뒤로가기 버튼 컴포넌트
 * 
 * @param {string} label - 버튼에 표시할 텍스트 (기본값: "뒤로가기")
 * @param {function} onClick - 클릭 이벤트 핸들러 (선택사항, 없으면 router.back() 사용)
 */
const BackButton = ({ label = "뒤로가기", onClick }) => {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.back();
        }
    };

    return (
        <button className="backButton" onClick={handleClick}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>{label}</span>
        </button>
    );
};

export default BackButton;
