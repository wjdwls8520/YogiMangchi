"use client";

import React from 'react';
import Link from 'next/link';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footerContent">
                <div className="footerLinks">
                    <Link href="/terms" className="footerLink">이용약관</Link>
                    <Link href="/privacy" className="footerLink">개인정보처리방침</Link>
                    <Link href="/contact" className="footerLink">고객센터</Link>
                </div>
                <div className="footerCopyright">
                    &copy; {new Date().getFullYear()} Yogi-Mangchi. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
