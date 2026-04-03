"use client";

import { useEffect, useRef } from 'react';
import { useTickerStore } from '@/stores/useTickerStore';

export const useBinanceWebSocket = () => {
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const setCoinMetaList = useTickerStore((state) => state.setCoinMetaList);
  const updateTickerBatch = useTickerStore((state) => state.updateTickerBatch);
  const pendingUpdatesRef = useRef<Record<string, {
    price: number;
    changeRate: number;
    volume: number;
    highPrice: number;
    lowPrice: number;
  }>>({});

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
  }, [coinMetaList.length, setCoinMetaList]);

  // 2️⃣ 목록이 들어오면: 바이낸스 실시간 웹소켓 연결
  useEffect(() => {
    if (coinMetaList.length === 0) return;

    const streams = coinMetaList.map((c) => `${c.symbol.toLowerCase()}@ticker`).join("/");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    const flushInterval = window.setInterval(() => {
      const nextUpdates = pendingUpdatesRef.current;

      if (Object.keys(nextUpdates).length === 0) {
        return;
      }

      updateTickerBatch(nextUpdates);
      pendingUpdatesRef.current = {};
    }, 500);

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const ticker = payload.data;
      if (!ticker || !ticker.s) return;

      // 실시간 수신은 그대로 두고, store 반영만 0.5초 단위로 묶는다.
      pendingUpdatesRef.current[ticker.s] = {
        price: parseFloat(ticker.c),         // 현재가
        changeRate: parseFloat(ticker.P),    // 변동률
        volume: parseFloat(ticker.q),        // 거래량
        highPrice: parseFloat(ticker.h),     // 24h 고가
        lowPrice: parseFloat(ticker.l),      // 24h 저가
      };
    };

    return () => {
      window.clearInterval(flushInterval);
      pendingUpdatesRef.current = {};
      ws.close();
    };
  }, [coinMetaList, updateTickerBatch]);
};
