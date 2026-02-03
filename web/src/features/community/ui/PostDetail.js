"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { posts } from '../data/mockPosts';
import './Community.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import ImageViewer from '../../../shared/ui/ImageViewer';
import LikeButton from '../../../shared/ui/LikeButton';
import CommentInput from '../../../shared/ui/CommentInput';
import CommentItem from '../../../shared/ui/CommentItem';
import UserAvatar from '../../../shared/ui/UserAvatar';
import BackButton from '../../../shared/ui/BackButton';

/* --- Main Page Component --- */

const PostDetail = ({ id }) => {
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    useEffect(() => {
        if (id) {
            const found = posts.find(p => p.id === parseInt(id));
            setPost(found);
        }
    }, [id]);

    if (!post) {
        return <div className="loadingState">Loading...</div>;
    }

    return <PostDetailContent post={post} replyingTo={replyingTo} setReplyingTo={setReplyingTo} router={router} />;
};

const PostDetailContent = ({ post, replyingTo, setReplyingTo, router }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setTimeout(() => {
            const inputEl = document.querySelector('.commentInput');
            if (inputEl) inputEl.focus();
        }, 100);
    };

    const handleCommentSubmit = (text) => {
        console.log("Submitted:", text);
        alert("댓글이 등록되었습니다 (Mock Action)");
        setReplyingTo(null);
    };

    const commentsToShow = post.commentsList || [];

    return (
        <div className="communityFeed">
            {/* Header / Back Button */}
            <BackButton label="스레드" />

            <div className='feedBody'>
                <article className="postCard detailPostCard">
                    {/* Header */}
                    <div className="postHeader">
                        <UserAvatar
                            username={post.author}
                            size="medium"
                        />
                        <div className="postHeaderInfo">
                            <span className="postAuthor">{post.author}</span>
                            <div className="postHeaderMeta">
                                <span className="postDate">{post.date}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <h3 className="postTitle detailPostTitle">{post.title}</h3>
                    <div className="postContentWrapper">
                        <p className="postPreview detailPostContent">
                            {post.content}
                        </p>
                    </div>

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                        <div className="postImages">
                            <Swiper
                                modules={[FreeMode]}
                                spaceBetween={10}
                                slidesPerView={'auto'}
                                freeMode={true}
                                className="detailSwiper"
                            >
                                {post.images.map((img, index) => (
                                    <SwiperSlide key={index} className="detailSlide">
                                        <div
                                            className="detailImageWrapper detailZoomable"
                                            onClick={() => setSelectedImageIndex(index)}
                                        >
                                            <img src={img} alt="detail" className="detailImage" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    )}

                    <div className="detailDivider"></div>

                    {/* Footer Actions */}
                    <div className="postFooter detailFooter">
                        <div className="footerIconGroup">
                            <LikeButton initialCount={post.likes} initialLiked={false} />
                            <button className="footerBtn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                <span>{post.comments}</span>
                            </button>
                        </div>
                    </div>
                </article>

                {/* Comments Section */}
                <div className="commentsSection">
                    <div className="commentsHeaderBar">
                        답글 {commentsToShow.length}개
                    </div>

                    {commentsToShow.map(comment => (
                        <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
                    ))}

                    {/* Fixed Comment Input Area or Just Bottom Input */}
                    <div className="bottomInputArea">
                        <CommentInput
                            onSubmit={handleCommentSubmit}
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                        />
                    </div>
                </div>
            </div>

            {/* Lightbox Overlay */}
            {selectedImageIndex !== null && (
                <ImageViewer
                    images={post.images}
                    initialIndex={selectedImageIndex}
                    onClose={() => setSelectedImageIndex(null)}
                />
            )}
        </div>
    );
};

export default PostDetail;
