"use client";
import { useState, useEffect } from 'react';

// 30개 코인 목록
const TARGET_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'POLUSDT',
  'TRXUSDT', 'LTCUSDT', 'BCHUSDT', 'ETCUSDT', 'ATOMUSDT',
  'DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'UNIUSDT', 'FILUSDT',
  'NEARUSDT', 'APTUSDT', 'SUIUSDT', 'SEIUSDT', 'OPUSDT',
  'ARBUSDT', 'STXUSDT', 'WLDUSDT', 'INJUSDT', 'FETUSDT'
];

export interface TickerData {
  symbol: string;
  price: string;
  changeRate: number;
  isLoading: boolean; // 👈 로딩 상태를 추가합니다!
}

// 1. 화면이 켜지자마자 보여줄 '빈 의자 30개'를 미리 만듭니다.
const INITIAL_STATE: TickerData[] = TARGET_SYMBOLS.map(symbol => ({
  symbol,
  price: '0.00',
  changeRate: 0,
  isLoading: true, // 처음엔 전부 로딩 중
}));

export const useBinanceTickers = () => {
  // 2. State의 초기값을 빈 배열([])이 아니라, 위에서 만든 30개의 빈 의자로 세팅합니다.
  const [tickers, setTickers] = useState<TickerData[]>(INITIAL_STATE);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      const relevantData = data.filter((item: any) => TARGET_SYMBOLS.includes(item.s));

      if (relevantData.length > 0) {
        setTickers((prev) => {
          // 기존 30개 배열을 복사합니다.
          const updated = [...prev];
          
          // 방금 들어온 데이터들만 자기 자리를 찾아가서 값을 덮어씁니다.
          relevantData.forEach((item: any) => {
            const index = updated.findIndex((t) => t.symbol === item.s);
            if (index !== -1) {
              updated[index] = {
                symbol: item.s,
                price: parseFloat(item.c).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                changeRate: ((parseFloat(item.c) - parseFloat(item.o)) / parseFloat(item.o) * 100),
                isLoading: false, // 👈 데이터가 한 번이라도 들어오면 로딩 끝!
              };
            }
          });
          return updated;
        });
      }
    };

    return () => ws.close();
  }, []);

  return tickers;
};