import React from 'react';
import { useLikeToggle } from '../hooks/useLikeToggle';

/**
 * 공통 좋아요 버튼 컴포넌트
 * @param {number} initialCount - 초기 좋아요 개수
 * @param {boolean} initialLiked - 초기 좋아요 상태
 * @param {number} size - 아이콘 크기 (기본: 20, 댓글용: 14)
 * @param {boolean} showCount - 개수 표시 여부 (기본: true)
 * @param {string} className - 추가 CSS 클래스
 */
const LikeButton = ({
    initialCount = 0,
    initialLiked = false,
    size = 20,
    showCount = true,
    className = ''
}) => {
    const { isLiked, likeCount, toggleLike } = useLikeToggle(initialCount, initialLiked);

    return (
        <button
            className={`footerBtn ${isLiked ? 'active' : ''} ${className}`}
            onClick={toggleLike}
        >
            {isLiked ? (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            ) : (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            )}
            {showCount && <span>{likeCount}</span>}
        </button>
    );
};

export default LikeButton;
