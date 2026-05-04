"use client";

import { useEffect, useRef } from "react";
import { useTickerStore, type CoinMeta } from "@/stores/useTickerStore";
import {
  getBinance24hrTickerApiUrl,
  getBinanceWsBaseUrl,
  getMarketSymbolsApiUrl,
  type MarketType,
} from "@/lib/utils/market";

type BinanceTickerPayload = {
  s?: string;
  symbol?: string;
  c?: string;
  lastPrice?: string;
  P?: string;
  priceChangePercent?: string;
  q?: string;
  quoteVolume?: string;
  h?: string;
  highPrice?: string;
  l?: string;
  lowPrice?: string;
};

type TickerUpdate = {
  price: number;
  changeRate: number;
  volume: number;
  highPrice: number;
  lowPrice: number;
};

const getBinanceSymbol = (coin: CoinMeta) => {
  return (coin.binanceRequestSymbol || coin.symbol).toUpperCase();
};

const parseTickerPayloads = (payload: unknown): BinanceTickerPayload[] => {
  if (Array.isArray(payload)) {
    return payload as BinanceTickerPayload[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as BinanceTickerPayload[];
  }

  if (record.data && typeof record.data === "object") {
    return [record.data as BinanceTickerPayload];
  }

  if (typeof record.s === "string") {
    return [record as BinanceTickerPayload];
  }

  return [];
};

const parseFiniteNumber = (value: string | undefined) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const toTickerUpdate = (
  ticker: BinanceTickerPayload,
  symbolMap: Map<string, string>
) => {
  const binanceSymbol = (ticker.s || ticker.symbol || "").toUpperCase();
  const symbol = symbolMap.get(binanceSymbol);

  if (!symbol) {
    return null;
  }

  const price = parseFiniteNumber(ticker.c ?? ticker.lastPrice);
  const changeRate = parseFiniteNumber(
    ticker.P ?? ticker.priceChangePercent
  );
  const volume = parseFiniteNumber(ticker.q ?? ticker.quoteVolume);
  const highPrice = parseFiniteNumber(ticker.h ?? ticker.highPrice);
  const lowPrice = parseFiniteNumber(ticker.l ?? ticker.lowPrice);

  if (
    price === null ||
    changeRate === null ||
    volume === null ||
    highPrice === null ||
    lowPrice === null
  ) {
    return null;
  }

  return {
    symbol,
    data: {
      price,
      changeRate,
      volume,
      highPrice,
      lowPrice,
    } satisfies TickerUpdate,
  };
};

export const useBinanceWebSocket = (marketTypeOverride?: MarketType) => {
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const setSelectedMarketType = useTickerStore(
    (state) => state.setSelectedMarketType
  );
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const setCoinMetaList = useTickerStore((state) => state.setCoinMetaList);
  const updateTickerBatch = useTickerStore((state) => state.updateTickerBatch);
  const clearTickers = useTickerStore((state) => state.clearTickers);
  const effectiveMarketType = marketTypeOverride ?? selectedMarketType;
  const pendingUpdatesRef = useRef<Record<string, {
    price: number;
    changeRate: number;
    volume: number;
    highPrice: number;
    lowPrice: number;
  }>>({});
  const lastTickerMessageAtRef = useRef(0);

  useEffect(() => {
    if (marketTypeOverride && selectedMarketType !== marketTypeOverride) {
      setSelectedMarketType(marketTypeOverride);
    }
  }, [marketTypeOverride, selectedMarketType, setSelectedMarketType]);

  // 시장 타입이 바뀌면 해당 목록으로 다시 불러옵니다.
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchCoinList = async () => {
      try {
        clearTickers();

        const response = await fetch(getMarketSymbolsApiUrl(effectiveMarketType), {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("API 에러");
        
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data || [];

        if (!isActive) {
          return;
        }
        
        setCoinMetaList(list); // 저수지에 목록 저장!
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("코인 목록 로딩 실패:", error);
      }
    };

    void fetchCoinList();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [clearTickers, effectiveMarketType, setCoinMetaList]);

  // 목록이 들어오면 해당 시장 타입에 맞는 바이낸스 웹소켓에 연결합니다.
  useEffect(() => {
    if (coinMetaList.length === 0) return;

    const symbolMap = new Map(
      coinMetaList.map((coin) => [getBinanceSymbol(coin), coin.symbol])
    );
    const syncTickerSnapshot = async () => {
      try {
        const response = await fetch(getBinance24hrTickerApiUrl(effectiveMarketType));

        if (!response.ok) {
          throw new Error("Binance 24hr ticker API error");
        }

        const payload = await response.json();
        const tickerPayloads = parseTickerPayloads(payload);
        const updates: Record<string, TickerUpdate> = {};

        for (const ticker of tickerPayloads) {
          const update = toTickerUpdate(ticker, symbolMap);

          if (update) {
            updates[update.symbol] = update.data;
          }
        }

        if (Object.keys(updates).length > 0) {
          updateTickerBatch(updates);
        }
      } catch (error) {
        console.error("Binance 24hr ticker snapshot loading failed:", error);
      }
    };

    void syncTickerSnapshot();

    lastTickerMessageAtRef.current = 0;

    const streams = coinMetaList
      .map((coin) => `${getBinanceSymbol(coin).toLowerCase()}@ticker`)
      .join("/");
    const wsBaseUrl = getBinanceWsBaseUrl(effectiveMarketType);
    const ws = new WebSocket(`${wsBaseUrl}/stream?streams=${streams}`);
    const flushInterval = window.setInterval(() => {
      const nextUpdates = pendingUpdatesRef.current;

      if (Object.keys(nextUpdates).length === 0) {
        return;
      }

      updateTickerBatch(nextUpdates);
      pendingUpdatesRef.current = {};
    }, 1000);
    const fallbackSnapshotInterval = window.setInterval(() => {
      if (
        lastTickerMessageAtRef.current === 0 ||
        Date.now() - lastTickerMessageAtRef.current > 5000
      ) {
        void syncTickerSnapshot();
      }
    }, 5000);

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const tickerPayloads = parseTickerPayloads(payload);

      for (const ticker of tickerPayloads) {
        const update = toTickerUpdate(ticker, symbolMap);

        if (update) {
          lastTickerMessageAtRef.current = Date.now();
          // 실시간 수신은 그대로 두고, store 반영만 1초 단위로 묶는다.
          pendingUpdatesRef.current[update.symbol] = update.data;
        }
      }
    };

    return () => {
      window.clearInterval(flushInterval);
      window.clearInterval(fallbackSnapshotInterval);
      pendingUpdatesRef.current = {};
      ws.close();
    };
  }, [coinMetaList, effectiveMarketType, updateTickerBatch]);
};
