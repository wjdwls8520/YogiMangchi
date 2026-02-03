"use client";

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import RightSidebar from './RightSidebar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    return (
        <div className="mainLayout">
            <Header />
            <main className="mainContent">
                <div className="pageBody">
                    {children}
                </div>
                <RightSidebar />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
