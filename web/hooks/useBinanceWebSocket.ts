"use client";

import { useEffect, useRef } from "react";
import { useTickerStore } from "@/stores/useTickerStore";
import {
  getBinanceWsBaseUrl,
  getMarketSymbolsApiUrl,
} from "@/lib/utils/market";

export const useBinanceWebSocket = () => {
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const setCoinMetaList = useTickerStore((state) => state.setCoinMetaList);
  const updateTickerBatch = useTickerStore((state) => state.updateTickerBatch);
  const clearTickers = useTickerStore((state) => state.clearTickers);
  const pendingUpdatesRef = useRef<Record<string, {
    price: number;
    changeRate: number;
    volume: number;
    highPrice: number;
    lowPrice: number;
  }>>({});

  // 시장 타입이 바뀌면 해당 목록으로 다시 불러옵니다.
  useEffect(() => {
    const fetchCoinList = async () => {
      try {
        clearTickers();

        const response = await fetch(getMarketSymbolsApiUrl(selectedMarketType), {
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

    void fetchCoinList();
  }, [clearTickers, selectedMarketType, setCoinMetaList]);

  // 목록이 들어오면 해당 시장 타입에 맞는 바이낸스 웹소켓에 연결합니다.
  useEffect(() => {
    if (coinMetaList.length === 0) return;

    const streams = coinMetaList.map((c) => `${c.symbol.toLowerCase()}@ticker`).join("/");
    const wsBaseUrl = getBinanceWsBaseUrl(selectedMarketType);
    const ws = new WebSocket(`${wsBaseUrl}/stream?streams=${streams}`);
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
  }, [coinMetaList, selectedMarketType, updateTickerBatch]);
};
