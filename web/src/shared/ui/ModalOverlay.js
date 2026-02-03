import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ModalOverlay.css';

/**
 * 공통 모달 오버레이 컴포넌트 (React Portal 사용)
 * body 바로 아래에 렌더링되어 DOM 구조상 최상위에 위치
 * 
 * @param {boolean} isOpen - 오버레이 표시 여부
 * @param {function} onClose - 오버레이 클릭 시 닫기 핸들러
 * @param {React.ReactNode} children - 모달 내용
 * @param {boolean} high - 높은 z-index 사용 여부 (기본: false)
 * @param {boolean} bottom - 하단 정렬 여부 (기본: false, 모바일 바텀시트용)
 * @param {string} className - 추가 CSS 클래스
 */
const ModalOverlay = ({
    isOpen,
    onClose,
    children,
    high = false,
    bottom = false,
    className = ''
}) => {
    useEffect(() => {
        // 모달이 열릴 때 body에 modal-open 클래스 추가 (선택적 사용)
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const overlayClasses = [
        'modalOverlay',
        high && 'high',
        bottom && 'bottom',
        className
    ].filter(Boolean).join(' ');

    const modalContent = (
        <div
            className={overlayClasses}
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) {
                    onClose();
                }
            }}
        >
            {children}
        </div>
    );

    // Portal을 사용하여 body 바로 아래에 렌더링
    return createPortal(modalContent, document.body);
};

export default ModalOverlay;
