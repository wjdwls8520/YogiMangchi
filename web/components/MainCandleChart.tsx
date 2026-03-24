"use client";

import { useEffect, useRef, useState } from "react";
// 🌟 HistogramSeries가 추가되었습니다!
import { createChart, ColorType, Time, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import Select from "@/components/ui/Select";

// 드롭다운에 들어갈 옵션 리스트 미리 만들어두기
const timeframeOptions = [
  { label: "1분", value: "1m" },
  { label: "15분", value: "15m" },
  { label: "1시간", value: "1h" },
  { label: "1일", value: "1d" },
];

export default function MainCandleChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // 현재 선택된 봉 간격을 저장하는 상태 (기본값: 1m)
  const [timeframe, setTimeframe] = useState("1m");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 차트 기본 뼈대 생성
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#333' },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      grid: { vertLines: { color: '#f0f3fa' }, horzLines: { color: '#f0f3fa' } },
      timeScale: { timeVisible: true, secondsVisible: false, barSpacing: 12, rightOffset: 10 },
    });

    // 캔들 차트(봉) 추가
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#fb2c36', downColor: '#0058FF',
      borderVisible: false, wickUpColor: '#fb2c36', wickDownColor: '#0058FF',
    });

    // 거래량 차트(막대) 추가
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '', // 캔들 차트의 가격축과 분리해서 겹쳐 보이게 만듦
    });
    
    // 거래량 막대가 화면을 다 가리지 않게 아래쪽 20% 공간에만 그리도록 설정
    chart.priceScale('').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // 데이터를 가공하는 내부 함수 (캔들과 거래량 동시 처리)
    const formatData = (rawArray: any[]) => {
      const candles: any[] = [];
      const volumes: any[] = [];

      rawArray.forEach((d) => {
        const time = (d[0] / 1000) as Time;
        const open = parseFloat(d[1]);
        const close = parseFloat(d[4]);
        const isUp = close >= open;

        candles.push({ time, open, high: parseFloat(d[2]), low: parseFloat(d[3]), close });
        volumes.push({
          time,
          value: parseFloat(d[5]), // 바이낸스 데이터의 5번째 값이 거래
          // 종가가 시가보다 높으면 빨강(흐리게), 낮으면 파랑(흐리게)
          color: isUp ? 'rgba(251, 44, 54, 0.4)' : 'rgba(0, 88, 255, 0.4)',
        });
      });
      return { candles, volumes };
    };

    let currentCandles: any[] = [];
    let isFetching = false;
    let ws: WebSocket | null = null;

    // API 요청 시 timeframe 변수 사용 (1m, 15m, 1h, 1d)
    fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${timeframe}&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        const { candles, volumes } = formatData(data);
        currentCandles = candles;
        
        candlestickSeries.setData(candles);
        volumeSeries.setData(volumes);

        // 웹소켓도 선택된 timeframe에 맞춰서 연
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/btcusdt@kline_${timeframe}`);
        
        ws.onmessage = (event) => {
          const kline = JSON.parse(event.data).k;
          const time = (kline.t / 1000) as Time;
          const open = parseFloat(kline.o);
          const close = parseFloat(kline.c);
          const isUp = close >= open;

          const newCandle = { time, open, high: parseFloat(kline.h), low: parseFloat(kline.l), close };
          const newVolume = {
            time, 
            value: parseFloat(kline.v), // 실시간 거래량
            color: isUp ? 'rgba(251, 44, 54, 0.4)' : 'rgba(0, 88, 255, 0.4)',
          };
          
          candlestickSeries.update(newCandle);
          volumeSeries.update(newVolume);

          if (currentCandles.length > 0 && currentCandles[currentCandles.length - 1].time === newCandle.time) {
            currentCandles[currentCandles.length - 1] = newCandle;
          } else {
            currentCandles.push(newCandle);
          }
        };
      });

    // 무한 스크롤 (과거 데이터 불러오기)
    const onVisibleLogicalRangeChanged = async (newVisibleLogicalRange: any) => {
      if (newVisibleLogicalRange !== null && newVisibleLogicalRange.from < 10 && !isFetching) {
        if (currentCandles.length === 0) return;
        isFetching = true;
        const endTime = (currentCandles[0].time as number) * 1000 - 1; 

        try {
          // 과거 데이터 불러올 때도 timeframe 적용
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${timeframe}&limit=1000&endTime=${endTime}`);
          const oldRawData = await res.json();
          
          if (oldRawData.length > 0) {
            const { candles: oldCandles, volumes: oldVolumes } = formatData(oldRawData);
            
            currentCandles = [...oldCandles, ...currentCandles];
            candlestickSeries.setData(currentCandles);
            
            // 거래량도 과거 데이터 합쳐서 다시 그리기
            const currentVolumeData = volumeSeries.data();
            volumeSeries.setData([...oldVolumes, ...currentVolumeData]);
          }
        } catch (error) {
          console.error("과거 데이터 로딩 실패:", error);
        } finally {
          isFetching = false;
        }
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);

    const handleResize = () => { if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth }); };
    window.addEventListener('resize', handleResize);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);
      window.removeEventListener('resize', handleResize);
      if (ws) ws.close();
      chart.remove();
    };
  }, [timeframe]);

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-end">
        {/* <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          비트코인 (BTC/USDT)
        </h2> */}
        
        {/* 드롭다운 선택 메뉴 추가 */}
        <div className="flex items-center">
          <div className="w-[120px]"> {/* 버튼이 너무 길어지지 않게 너비 고정 */}
            <Select 
              options={timeframeOptions}
              value={timeframe}
              // value가 string | number로 오기 때문에 String()으로 감싸서 에러 방지
              onChange={(val) => setTimeframe(String(val))} 
            />
          </div>
        </div>
      </div>
      
      <div ref={chartContainerRef} className="w-full h-[450px]" />
    </div>
  );
}