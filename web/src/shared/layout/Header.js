import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '../ui/Button'; // Correct relative path relative to shared/layout
import { useTheme } from '../../context/ThemeContext'; // Correct relative path from src/shared/layout to src/context
import GlobalSearchModal from '../ui/GlobalSearchModal';
import './Header.css';

const Header = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header className="header">
            <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            <Link href="/" className="headerLogo">
                <svg className="headerLogoIcon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                <span>여기망치</span>
            </Link>

            <nav className="headerNav">
                <Link href="/" className={`headerLink ${pathname === '/' ? 'headerLinkActive' : ''}`}>
                    Home
                </Link>
                <Link href="/trading" className={`headerLink ${pathname === '/trading' ? 'headerLinkActive' : ''}`}>
                    트레이딩
                </Link>
                <Link href="/community" className={`headerLink ${pathname.startsWith('/community') ? 'headerLinkActive' : ''}`}>
                    커뮤니티
                </Link>
                <Link href="/chartist" className={`headerLink ${pathname.startsWith('/chartist') ? 'headerLinkActive' : ''}`}>
                    차티스트
                </Link>
            </nav>

            <div className="headerActions">
                <button
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Search"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        color: 'var(--foreground)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
                <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle Dark Mode">
                    {isDarkMode ? (
                        // Sun Icon
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    ) : (
                        // Moon Icon
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    )}
                </Button>
                <Button variant="ghost" size="sm">Login</Button>
                <Button variant="primary" size="sm">Sign Up</Button>
            </div>
        </header>
    );
};

export default Header;
