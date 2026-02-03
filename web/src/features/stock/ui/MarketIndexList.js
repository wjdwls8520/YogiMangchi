"use client";

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import MarketIndexCard from './MarketIndexCard';
import { generateSmoothPath } from '../../../shared/lib/chartUtils';
import './StockLayout.css';

const MarketIndexList = () => {
    // Mock Data Arrays
    const indicesData = [
        {
            name: "달러 환율",
            value: "1,340.50",
            change: "2.50",
            changeRate: "0.19%",
            isUp: true,
            history: [1335, 1338, 1336, 1339, 1340, 1338, 1341, 1342, 1340]
        },
        {
            name: "코스피",
            value: "2,542.36",
            change: "12.53",
            changeRate: "0.50%",
            isUp: true,
            history: [2530, 2535, 2532, 2540, 2538, 2545, 2542, 2550, 2548, 2542]
        },
        {
            name: "코스닥",
            value: "899.12",
            change: "4.12",
            changeRate: "0.46%",
            isUp: false,
            history: [905, 902, 900, 898, 895, 897, 896, 894, 898, 899]
        },
        {
            name: "나스닥",
            value: "14,890.30",
            change: "120.50",
            changeRate: "0.80%",
            isUp: true,
            history: [14700, 14750, 14720, 14800, 14850, 14820, 14880, 14890]
        },
        {
            name: "S&P 500",
            value: "4,780.20",
            change: "15.40",
            changeRate: "0.32%",
            isUp: true,
            history: [4760, 4770, 4765, 4785, 4780, 4790, 4785, 4780]
        }
    ];

    return (
        <div className="stockListHorizontal">
            <Swiper
                spaceBetween={16}
                slidesPerView={'auto'}
            >
                {indicesData.map((idx, index) => {
                    const path = generateSmoothPath(idx.history, 200, 60);
                    return (
                        <SwiperSlide key={`${idx.name}-${index}`}>
                            <MarketIndexCard
                                name={idx.name}
                                value={idx.value}
                                change={idx.change}
                                changeRate={idx.changeRate}
                                isUp={idx.isUp}
                                chartPath={path}
                            />
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </div>
    );
};

export default MarketIndexList;
