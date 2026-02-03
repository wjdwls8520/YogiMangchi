"use client";

import React, { useState } from 'react';
import CommentInput from '../../../shared/ui/CommentInput';
import CommentItem from '../../../shared/ui/CommentItem';

const GuestBook = ({ guestbook: initialGuestbook, userName }) => {
    const [guestbook, setGuestbook] = useState(initialGuestbook || []);
    const [replyingTo, setReplyingTo] = useState(null);

    const handleCommentSubmit = (text) => {
        const newComment = {
            id: guestbook.length + 1,
            author: "익명의 투자자",
            date: "방금 전",
            text: text,
            likes: 0
        };

        setGuestbook([newComment, ...guestbook]);
        setReplyingTo(null);
        alert("방명록이 등록되었습니다!");
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setTimeout(() => {
            const inputEl = document.querySelector('.commentInput');
            if (inputEl) inputEl.focus();
        }, 100);
    };

    return (
        <div className="guestBookSection">
            <h2 className="guestBookTitle">방명록 {guestbook.length}개</h2>

            {/* 댓글 입력 */}
            <div className="guestBookInput">
                <CommentInput
                    placeholder={`${userName}님에게 메시지를 남겨보세요`}
                    onSubmit={handleCommentSubmit}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                />
            </div>

            {/* 댓글 리스트 */}
            <div className="guestBookList">
                {guestbook.length === 0 ? (
                    <div className="emptyGuestBook">
                        <p>첫 번째 방명록을 남겨보세요!</p>
                    </div>
                ) : (
                    guestbook.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={handleReply}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default GuestBook;
