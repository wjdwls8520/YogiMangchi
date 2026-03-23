"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, Time, CandlestickSeries } from "lightweight-charts";

export default function MainCandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      grid: {
        vertLines: { color: '#f0f3fa' },
        horzLines: { color: '#f0f3fa' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#fb2c36',
      downColor: '#0058FF',
      borderVisible: false,
      wickUpColor: '#fb2c36',
      wickDownColor: '#0058FF',
    });

    let ws: WebSocket | null = null; // 웹소켓 변수를 밖으로 빼줌

    // 🌟 1. 과거 데이터 먼저 완벽하게 불러오기
    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=100')
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((d: any) => ({
          time: (d[0] / 1000) as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        
        // 차트에 100개 봉 세팅 완료!
        candlestickSeries.setData(formattedData);

        // 🌟 2. 세팅이 끝나면 그제서야 실시간 웹소켓 연결 시작! (충돌 완벽 방지)
        ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
        
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const kline = message.k;
          
          // F12 개발자 도구에서 실시간으로 가격이 찍히는지 확인용!
          console.log("실시간 비트코인 가격:", kline.c); 

          // 차트 맨 오른쪽 끝 봉을 실시간으로 위아래로 움직이게 업데이트
          candlestickSeries.update({
            time: (kline.t / 1000) as Time,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          });
        };
      })
      .catch((error) => {
        console.error("차트 데이터를 불러오는데 실패했습니다.", error);
      });

    // 브라우저 창 크기 조절 대응
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    // 컴포넌트 꺼질 때 청소
    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws) ws.close(); // 열려있다면 웹소켓 닫기
      chart.remove();
    };
  }, []);

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          {/* <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=025" alt="BTC" className="w-8 h-8" /> */}
          비트코인 (BTC/USDT)
        </h2>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          1분봉 실시간
        </span>
      </div>
      
      <div ref={chartContainerRef} className="w-full h-[450px]" />
    </div>
  );
}