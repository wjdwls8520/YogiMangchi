import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ModalOverlay from './ModalOverlay';
import './GlobalSearchModal.css';

const GlobalSearchModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);
    const pathname = usePathname();
    const router = useRouter();

    // Determine placeholder based on context
    const getPlaceholder = () => {
        if (pathname.startsWith('/community')) return '커뮤니티 글 검색...';
        if (pathname.startsWith('/trading')) return '종목 검색 (예: 테슬라, AAPL)...';
        if (pathname.startsWith('/chartist')) return '차티스트 검색...';
        return 'Yogi Mangchi 검색...';
    };

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        // Routing logic based on context
        const params = new URLSearchParams(window.location.search);
        params.set('q', query);

        // Push new URL
        router.push(`${pathname}?${params.toString()}`);

        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="searchModalContent" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSearch} className="searchForm">
                    <div className="searchIconWrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="searchModalIcon">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        className="searchModalInput"
                        placeholder={getPlaceholder()}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="searchModalHint">
                        <span className="keyBadge">ESC</span> to close
                    </div>
                </form>
            </div>
        </ModalOverlay>
    );
};

export default GlobalSearchModal;
