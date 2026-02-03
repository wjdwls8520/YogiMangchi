import React, { useState } from 'react';
import { useLikeToggle } from '../hooks/useLikeToggle';
import UserAvatar from './UserAvatar';
import './Comment.css';

/**
 * 공통 댓글 아이템 컴포넌트 (중첩 댓글 지원)
 * @param {object} comment - 댓글 데이터 (id, author, date, text, likes, replies)
 * @param {function} onReply - 답글 달기 핸들러
 * @param {boolean} isReply - 대댓글 여부
 */
const CommentItem = ({ comment, onReply, isReply = false }) => {
    const [initialLikes] = useState(comment.likes || 0);
    const { isLiked, likeCount, toggleLike } = useLikeToggle(initialLikes, false);

    return (
        <div className={`commentItem ${isReply ? 'reply' : ''}`}>
            <div className="commentItemInner">
                <UserAvatar
                    username={comment.author}
                    showFollowButton={true}
                    size="small"
                />
                <div className="commentContent">
                    <div className="commentMeta">
                        <span className="commentAuthor">{comment.author}</span>
                        <span className="commentDate">{comment.date}</span>
                    </div>
                    <div className="commentText">
                        {comment.text}
                    </div>

                    <div className="commentActionButtons">
                        <button className={`commentLikeBtn ${isLiked ? 'liked' : ''}`} onClick={toggleLike}>
                            {isLiked ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            )}
                            <span className="commentLikeCount">{likeCount > 0 ? likeCount : 0}</span>
                        </button>

                        <button
                            onClick={() => onReply(comment)}
                            className="commentReplyBtn"
                        >
                            답글 달기
                        </button>
                    </div>
                </div>
            </div>

            {/* Render Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="repliesList">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} onReply={onReply} isReply={true} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
