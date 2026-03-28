"use client";

import { useEffect } from 'react';
import { useTickerStore } from '@/stores/useTickerStore';

export const useBinanceWebSocket = () => {
  // 저수지에서 파이프와 펌프를 가져옵니다.
  const { coinMetaList, setCoinMetaList, updateTicker } = useTickerStore();

  // 1️⃣ 최초 1회: 백엔드에서 30개 코인 목록 가져오기
  useEffect(() => {
    const fetchCoinList = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/market/spot/symbols", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("API 에러");
        
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data || [];
        
        setCoinMetaList(list); // 저수지에 목록 저장!
      } catch (error) {
        console.error("코인 목록 로딩 실패:", error);
      }
    };

    // 목록이 비어있을 때만 가져옵니다.
    if (coinMetaList.length === 0) fetchCoinList();
  }, []); // 의존성 배열을 비워서 최초 1회만 실행

  // 2️⃣ 목록이 들어오면: 바이낸스 실시간 웹소켓 연결
  useEffect(() => {
    if (coinMetaList.length === 0) return;

    // 우리가 받은 30개 코인만 딱 찝어서 구독!
    const streams = coinMetaList.map((c) => `${c.symbol.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const ticker = payload.data;
      if (!ticker || !ticker.s) return;

      // 🌟 웹소켓 데이터가 올 때마다 저수지(Store)에 콸콸콸 부어줍니다!
      updateTicker(ticker.s, {
        price: parseFloat(ticker.c),         // 현재가
        changeRate: parseFloat(ticker.P),    // 변동률
        volume: parseFloat(ticker.q),        // 거래량
        highPrice: parseFloat(ticker.h),     // 24h 고가
        lowPrice: parseFloat(ticker.l),      // 24h 저가
      });
    };

    // 컴포넌트 언마운트 시 소켓 안전하게 닫기
    return () => ws.close();
  }, [coinMetaList]); // 코인 목록이 세팅된 직후 딱 1번만 실행됨
};