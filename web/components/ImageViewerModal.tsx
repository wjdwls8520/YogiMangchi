"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cs";

interface ImageViewerModalProps {
  images: { id: number; url: string; alt: string }[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageViewerModal({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // 모달이 열릴 때마다 initialIndex로 상태 초기화 및 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden"; // 스크롤 막기
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialIndex]);

  // 핸들러를 useEffect 밖에서 먼저 선언
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // 키보드 방향키 및 ESC 지원
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 딤 처리된 배경 */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
        aria-label="닫기"
      >
        <X size={32} />
      </button>

      {/* 이미지 갤러리 영역 */}
      <div className="relative w-full max-w-5xl max-h-screen flex items-center justify-center p-4 sm:p-10 pointer-events-none">
        
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 sm:left-10 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/80 pointer-events-auto transition-all"
            aria-label="이전 이미지"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].alt}
            className="max-w-full max-h-[85vh] object-contain select-none"
          />
        </div>

        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 sm:right-10 z-50 p-3 bg-black/50 text-white rounded-full hover:bg-black/80 pointer-events-auto transition-all"
            aria-label="다음 이미지"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* 하단 인디케이터 */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/50 text-white/90 text-sm font-bold tracking-widest backdrop-blur-md">
          {currentIndex + 1} <span className="opacity-50">/</span> {images.length}
        </div>
      )}
    </div>
  );
}