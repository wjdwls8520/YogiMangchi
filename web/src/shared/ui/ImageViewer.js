"use client";

import React, { useEffect, useState } from 'react';
import './ImageViewer.css';

const ImageViewer = ({ images, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') showPrev();
            if (e.key === 'ArrowRight') showNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images]);

    useEffect(() => {
        if (images && images.length > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [images]);

    if (!images || images.length === 0) return null;

    const showPrev = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const showNext = (e) => {
        if (e) e.stopPropagation();
        if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const currentImage = images[currentIndex];

    return (
        <div className="imageViewerOverlay" onClick={onClose}>
            {/* Close Button (SVG) */}
            <button className="imageViewerCloseBtn" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Navigation Buttons (SVG) */}
            {currentIndex > 0 && (
                <button className="imageViewerNavBtn imageViewerPrev" onClick={showPrev}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
            )}

            {currentIndex < images.length - 1 && (
                <button className="imageViewerNavBtn imageViewerNext" onClick={showNext}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            )}

            {/* Image Container */}
            <div className="imageViewerContent">
                <img
                    src={currentImage}
                    alt={`Full screen ${currentIndex + 1}`}
                    className="imageViewerImg"
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Counter */}
                {images.length > 1 && (
                    <div className="imageViewerCounter">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageViewer;
