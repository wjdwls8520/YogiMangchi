"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import './Community.css';

import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import ImageViewer from '../../../shared/ui/ImageViewer';
import LikeButton from '../../../shared/ui/LikeButton';
import ModalOverlay from '../../../shared/ui/ModalOverlay';
import UserAvatar from '../../../shared/ui/UserAvatar';

const PostCard = ({ post }) => {
    const router = useRouter();
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(null);
    const [showMenu, setShowMenu] = React.useState(false);

    const handleDetailClick = (e) => {
        e.stopPropagation(); // Prevent bubbling if needed
        router.push(`/community/detail/${post.id}`);
    };

    const handleFollow = () => {
        // Mock API Call
        setShowFollowAlert(false);
        alert(`${post.author}님을 팔로우했습니다!`);
    };

    return (
        <>
            <article className="postCard">
                {/* Header */}
                <div className="postHeader">
                    {/* Avatar + Follow Badge */}
                    <UserAvatar
                        username={post.author}
                        showFollowButton={true}
                        size="medium"
                    />

                    <div className="postHeaderInfo">
                        <span className="postAuthor" onClick={(e) => { e.stopPropagation(); console.log('Go to profile'); }}>
                            {post.author}
                        </span>
                        <div className="postHeaderMeta">
                            <span className="postDate">{post.date}</span>
                            {/* Optional: Add separator if needed */}
                        </div>
                    </div>

                    {/* Menu Button */}
                    <div className="postMenuContainer" onClick={e => e.stopPropagation()}>
                        <button className="menuBtn" onClick={() => setShowMenu(!showMenu)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                        </button>

                        {/* Menu Popup */}
                        {showMenu && (
                            <div className="menuPopup">
                                {/* Profit Leaderboard unrelated - Standard Options */}
                                <div className="menuItem" onClick={() => alert('수정')}>수정하기</div>
                                <div className="menuItem dest" onClick={() => alert('삭제')}>삭제하기</div>
                                <div className="menuDivider"></div>
                                <div className="menuItem" onClick={() => alert('신고')}>신고하기</div>
                                <div className="menuItem" onClick={() => alert('차단')}>차단하기</div>
                                <div className="menuItem" onClick={() => alert('저장')}>저장하기</div>
                            </div>
                        )}
                        {/* Overlay to close menu when clicking outside */}
                        {showMenu && <div className="menuOverlay" onClick={() => setShowMenu(false)}></div>}
                    </div>
                </div>

                {/* Content */}
                <h3 className="postTitle" onClick={handleDetailClick}>{post.title}</h3>
                <div className="postContentWrapper">
                    <p className="postPreview" onClick={handleDetailClick}>
                        {post.content}
                    </p>
                    {/* Only show 'More' if content is long. CSS will truncate, but button logic helps usability. 
                        Actually, CSS-only truncation needs a way to hide button if shortened.
                        For simplicity, we assume generic overflow or just always show if text is somewhat long.
                    */}
                    {post.content.length > 100 && (
                        <button className="readMoreBtn" onClick={handleDetailClick}>
                            더보기
                        </button>
                    )}
                </div>

                {/* Images - Swiper */}
                {post.images && post.images.length > 0 && (
                    <div className="postImages" onClick={e => e.stopPropagation()}>
                        <Swiper
                            modules={[FreeMode]}
                            spaceBetween={10}
                            slidesPerView={'auto'}
                            freeMode={true}
                            style={{ width: '100%' }}
                        >
                            {post.images.map((img, index) => (
                                <SwiperSlide key={index} style={{ width: 'auto' }}>
                                    <div
                                        style={{
                                            width: '200px', // Larger preview in feed too? Keeping 120px for now or matching writemodal?
                                            // User asked for "similar design", but WriteModal has 200px. PostCard had 120px.
                                            // I will increase it to 200px to match the "big image" feel if fits.
                                            // Actually let's keep it safe or slightly larger.
                                            // The user didn't explicitly say change Feed Image Size, but "Write Modal needs to be like Feed".
                                            // But Write Modal is 200px. Let's make Feed 200px too for consistency.
                                            height: '200px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            cursor: 'zoom-in',
                                            border: '1px solid var(--border)'
                                        }}
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        <img
                                            src={img}
                                            alt={`Post image ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                {/* Footer (Like, Comment, Share, Report) */}
                <div className="postFooter">
                    <div className="footerIconGroup">
                        {/* Like */}
                        <LikeButton initialCount={post.likes} initialLiked={false} />

                        {/* Comment */}
                        <button className="footerBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span className="footerCount">{post.comments}</span>
                        </button>

                        {/* Share */}
                        <button className="footerBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            <span className="footerCount">공유</span>
                        </button>

                        {/* Report (신고) */}
                        <button className="footerBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span className="footerCount">0</span>
                        </button>
                    </div>
                </div>

                {/* Best Comment (Thread Style) */}
                {post.bestComment && (
                    <div className="bestCommentContainer">
                        <div className="bestCommentThread">
                            {/* Left: Avatar Only */}
                            <div className="bestCommentLeft">
                                <UserAvatar
                                    username={post.bestComment.author}
                                    showFollowButton={true}
                                    size="small"
                                />
                            </div>

                            {/* Right: Content */}
                            <div className="bestCommentRight">
                                <div className="bestCommentHeader">
                                    <span className="bestCommentAuthor">{post.bestComment.author}</span>
                                    <span className="bestCommentTime">3시간</span>
                                    <span className="bestLabelBadge">BEST</span>
                                </div>
                                <div className="bestCommentContent">
                                    {post.bestComment.text}
                                </div>
                                <div className="bestCommentActions">
                                    <button className="commentActionBtn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                        1
                                    </button>
                                    <button className="commentActionBtn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                        0
                                    </button>
                                    <button className="commentActionBtn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><path d="M7 23l-4-4 4-4"></path></svg>
                                        0
                                    </button>
                                    <button className="commentActionBtn">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </article>

            {/* Lightbox Overlay */}
            {selectedImageIndex !== null && (
                <ImageViewer
                    images={post.images}
                    initialIndex={selectedImageIndex}
                    onClose={() => setSelectedImageIndex(null)}
                />
            )}
        </>
    );
};

export default PostCard;
