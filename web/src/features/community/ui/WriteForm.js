"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import './Write.css';
import ModalOverlay from '../../../shared/ui/ModalOverlay';
import UserAvatar from '../../../shared/ui/UserAvatar';

// Icons
const ImageIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

const XIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const MAX_IMAGES = 5;
const MAX_SIZE_MB = 10;

const WriteForm = ({ isOpen, onClose }) => {
    const fileInputRef = useRef(null);
    const contentRef = useRef(null);

    const [form, setForm] = useState({
        category: 'JAYU',
        title: '',
        content: '',
    });

    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-resize
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.height = 'auto';
            contentRef.current.style.height = contentRef.current.scrollHeight + 'px';
        }
    }, [form.content, isOpen]); // Resize when opening

    const handleTextChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        let errorMsg = '';
        if (images.length + files.length > MAX_IMAGES) {
            alert(`최대 ${MAX_IMAGES}장까지 업로드 가능합니다.`);
            return;
        }

        const newImages = [];
        files.forEach(file => {
            if (file.size > MAX_SIZE_MB * 1024 * 1024) errorMsg = '10MB 이하 파일만 가능합니다.';
            else newImages.push({ file, previewUrl: URL.createObjectURL(file) });
        });

        if (errorMsg) alert(errorMsg);
        setImages(prev => [...prev, ...newImages]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index) => {
        setImages(prev => {
            const newArr = [...prev];
            URL.revokeObjectURL(newArr[index].previewUrl);
            newArr.splice(index, 1);
            return newArr;
        });
    };

    const handleClose = () => {
        // Reset State
        setForm({ category: 'JAYU', title: '', content: '' });
        setImages([]);
        onClose();
    };

    const handleSubmit = async () => {
        if (!form.content.trim()) return;

        setIsSubmitting(true);
        try {
            console.log('Submitting Post:', { ...form, images });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Success
            handleClose();
            alert('게시글이 등록되었습니다!');
        } catch (error) {
            console.error(error);
            alert('등록 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isValid = form.content.length > 0;

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleClose}>
            <div className="writeModalContent">
                {/* Header */}
                <div className="writeModalHeader">
                    <button className="closeBtn" onClick={handleClose}>
                        <XIcon />
                    </button>
                    <span className="modalTitle">새로운 스레드</span>
                    <div style={{ width: 24 }}></div> {/* Spacer for center alignment */}
                </div>

                {/* Body - Threads Layout */}
                <div className="writeModalBody">
                    <div className="threadLayout">
                        {/* Left Column: Only User Avatar */}
                        <div className="threadLeft">
                            <UserAvatar
                                username="익명의 투자자"
                                size="medium"
                            />
                        </div>

                        {/* Right Column: Inputs */}
                        <div className="threadRight">
                            {/* Name & Category */}
                            <div className="userInfoRow">
                                <span className="writeUserName">익명의 투자자</span>
                                <select
                                    className="categorySelect"
                                    name="category"
                                    value={form.category}
                                    onChange={handleTextChange}
                                >
                                    <option value="JAYU">자유게시판</option>
                                    <option value="ANALYSIS">분석글</option>
                                    <option value="PROFIT">수익인증</option>
                                    <option value="QNA">질문과 답변</option>
                                </select>
                            </div>

                            {/* Title (Optional in Threads? usually just text, but we need title for our DB) */}
                            {/* We can make title look like first bold line or keep it separate. Keeping separate for clarity but minimal. */}
                            <input
                                type="text"
                                className="titleInput"
                                name="title"
                                placeholder="제목 (선택)"
                                maxLength={50}
                                value={form.title}
                                onChange={handleTextChange}
                            />

                            {/* Content */}
                            <textarea
                                ref={contentRef}
                                className="contentArea"
                                name="content"
                                placeholder="새로운 소식이 있나요?"
                                value={form.content}
                                onChange={handleTextChange}
                            />

                            {/* Image Swiper */}
                            {images.length > 0 && (
                                <div className="previewSwiperWrapper">
                                    <Swiper
                                        modules={[FreeMode]}
                                        spaceBetween={12}
                                        slidesPerView="auto"
                                        freeMode={true}
                                        className="imageSwiper"
                                    >
                                        {images.map((img, idx) => (
                                            <SwiperSlide key={idx} style={{ width: 'auto' }}>
                                                <div className="previewItem">
                                                    <img src={img.previewUrl} alt="preview" className="previewImg" />
                                                    <button className="removeImgBtn" onClick={() => removeImage(idx)}>✕</button>
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            )}

                            {/* Toolbar */}
                            <div className="writeToolbar" onClick={() => fileInputRef.current?.click()}>
                                <div className="toolbarIconBtn">
                                    <ImageIcon />
                                    <div className="plusBadge">+</div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <div className="toolbarLabel">사진 추가</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* FooterActions */}
                <div className="writeModalFooter">
                    <button className="cancelBtn" onClick={handleClose}>
                        취소
                    </button>
                    <button
                        className="submitBtn"
                        onClick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                    >
                        {isSubmitting ? '게시 중' : '게시'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
};

export default WriteForm;
