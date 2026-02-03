import React, { useState, useEffect, useRef } from 'react';
import './Comment.css';

/**
 * 공통 댓글 입력 컴포넌트
 * @param {string} placeholder - 입력 필드 placeholder
 * @param {function} onSubmit - 댓글 제출 핸들러
 * @param {object} replyingTo - 답글 대상 댓글 정보 (author 포함)
 * @param {function} onCancelReply - 답글 취소 핸들러
 */
const CommentInput = ({ placeholder, onSubmit, replyingTo, onCancelReply }) => {
    const [content, setContent] = useState('');
    const editorRef = useRef(null);

    // Initialize content with mention if replying
    useEffect(() => {
        if (replyingTo && editorRef.current) {
            // Clear current content and insert mention
            editorRef.current.innerHTML = `<span class="mention" contenteditable="false">@${replyingTo.author}</span>&nbsp;`;
            moveCursorToEnd(editorRef.current);
        }
    }, [replyingTo]);

    const moveCursorToEnd = (el) => {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        el.focus();
    };

    const handleInput = (e) => {
        setContent(e.currentTarget.innerHTML);
    };

    const handleSubmit = () => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText;
        if (!text.trim()) return;

        console.log('Submitting comment:', text);
        onSubmit(text);

        editorRef.current.innerHTML = '';
        setContent('');
        if (onCancelReply) onCancelReply();
    };

    return (
        <div className="commentInputWrapper">
            {replyingTo && (
                <div className="replyContext">
                    <span>Replying to <b>{replyingTo.author}</b></span>
                    <button onClick={onCancelReply} className="replyCancelBtn">✕</button>
                </div>
            )}
            <div
                ref={editorRef}
                className="commentInput"
                contentEditable={true}
                onInput={handleInput}
                placeholder={placeholder || "댓글을 남겨보세요."}
            />
            <div className="commentActions">
                <button
                    className="commentSubmitBtn"
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                >
                    등록
                </button>
            </div>
        </div>
    );
};

export default CommentInput;
