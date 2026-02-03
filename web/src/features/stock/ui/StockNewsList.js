"use client";

import React, { useState } from 'react';
import './StockLayout.css';

const StockNewsList = () => {
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    const [selectedDay, setSelectedDay] = useState("수");

    // Helper to format time
    const formatNewsTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) {
            return "방금 전";
        } else if (diff < 3600) {
            return `${Math.floor(diff / 60)}분 전`;
        } else {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${year}.${month}.${day} ${hour}:${minute}`;
        }
    };

    // Mock News Data - Expanded for demo
    // Using real ISO dates relative to now for demonstration
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60000).toISOString();

    const newsData = [
        {
            id: 1,
            title: "뒤늦게 헤아려지는 사랑이 있다",
            source: "마리앤느",
            time: tenMinAgo, // < 1 hour
            image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
        },
        {
            id: 2,
            title: "AGI가 무너뜨릴 첫 번째 질서 : 노동",
            source: "성해밀",
            time: twoHoursAgo, // > 1 hour
            image: null
        },
        {
            id: 3,
            title: "밤하늘 속 별",
            source: "세아",
            time: "2024-05-20T10:30:00",
            image: null
        },
        {
            id: 4,
            title: "<첫 번째 이야기>",
            source: "김빗",
            time: "2024-05-19T15:00:00",
            image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
        },
        {
            id: 5,
            title: "우리 집으로 가자",
            source: "베를리너",
            time: "2024-05-18T09:00:00",
            image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
        },
        {
            id: 6,
            title: "틀리지 않으려 했을 뿐인데",
            source: "유기",
            time: "2024-05-17T18:45:00",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
        }
    ];

    return (
        <div className="stockNewsContainer">
            <div className="stockNewsTabs">
                {days.map((day) => (
                    <button
                        key={day}
                        className={`stockNewsTab ${selectedDay === day ? 'active' : ''} cursor`}
                        onClick={() => setSelectedDay(day)}
                    >
                        {day}
                    </button>
                ))}
            </div>

            <div className="stockNewsHeaderControls">
                {/* Optional right-side controls like reference image (Latest, Popular, etc.) */}
                <div className="stockNewsSort">
                    <span className="active cursor">최신순</span>
                    <span className="cursor">조회수</span>
                </div>
            </div>

            <div className="stockNewsList">
                {newsData.map((news) => (
                    <article key={news.id} className="stockNewsItem cursor">
                        <div className="stockNewsContent">
                            <h3 className="stockNewsTitle">{news.title}</h3>
                            <div className="stockNewsMeta">
                                <span className="stockNewsSource">{news.source}</span>
                                <span className="stockNewsTime">{formatNewsTime(news.time)}</span>
                            </div>
                        </div>
                        {news.image && (
                            <div className="stockNewsImageWrapper">
                                <img src={news.image} alt={news.title} className="stockNewsImage" />
                            </div>
                        )}
                    </article>
                ))}
            </div>

            <div className="stockNewsMore">
                <button className="stockNewsMoreBtn cursor">뉴스 더 보기</button>
            </div>
        </div>
    );
};

export default StockNewsList;
