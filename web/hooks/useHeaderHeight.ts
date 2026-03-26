"use client";

import { useEffect, useState } from "react";

export const useHeaderHeight = () => {
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        const el = document.getElementById('header');
        if (!el) return;

        // ResizeObserver : 특정 요소의 크기 변화를 감시하는 브라우저 내장 api
        // window.resize : window 전체 크기 변화만 감지
        const observer = new ResizeObserver((entries) => { // 크기가 변할 때 마다 실행
            // 콜백 안에서 setState → 외부 구독 패턴으로 인식
            setHeaderHeight(entries[0].contentRect.height);
        });

        observer.observe(el); //감시 시작
        return () => observer.disconnect(); // 감시 중단
    }, []);

    return headerHeight;
}