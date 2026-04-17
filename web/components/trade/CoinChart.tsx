"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { 
  createChart, ColorType, Time, CandlestickSeries, HistogramSeries, 
  LineSeries, AreaSeries, BarSeries, BaselineSeries, PriceScaleMode, createSeriesMarkers
} from "lightweight-charts";
import { formatAssetNumber } from "@/lib/utils/number";
import { useTickerStore } from "@/stores/useTickerStore";
import {
  getBinanceKlineApiUrl,
  getBinanceWsBaseUrl,
} from "@/lib/utils/market";

const timeframeOptions = [
  { label: "1분", value: "1m" },
  { label: "15분", value: "15m" },
  { label: "1시간", value: "1h" },
  { label: "1일", value: "1d" },
];

const chartTypeOptions = [
  { label: "캔들", value: "candle" },
  { label: "바", value: "bar" },
  { label: "베이스", value: "baseline" },
  { label: "라인", value: "line" },
  { label: "면적", value: "area" },
];

const formatChartPrice = (value: number) => {
  return formatAssetNumber(value, {
    standardMaxFractionDigits: 4,
    smallMaxFractionDigits: 8,
  });
};

export default function CoinChart() {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const meta = coinMetaList.find(c => c.symbol === selectedCoin) || { 
    displayNameKr: selectedCoin, 
    symbol: selectedCoin 
  };

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null); 
  
  const [timeframe, setTimeframe] = useState("1m");
  const [chartType, setChartType] = useState("candle");
  const [showMA, setShowMA] = useState(false);
  const [showMarkers, setShowMarkers] = useState(false);
  const [isPercent, setIsPercent] = useState(false);
  const [isDark, setIsDark] = useState(false); 
  const [showPriceLine, setShowPriceLine] = useState(false); 
  const [showTooltip, setShowTooltip] = useState(true); 

  const [dataTick, setDataTick] = useState(0);

  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>({});
  const markersRef = useRef<any>({}); 
  const priceLineRef = useRef<any>(null); 
  
  const dataRef = useRef<any[]>([]);
  const volumesRef = useRef<any[]>([]); 
  const wsRef = useRef<WebSocket | null>(null);

  // 🌟 [무한 스크롤을 위한 상태 저장소]
  const isLoadingMoreRef = useRef(false); // 데이터 중복 호출 방지
  const noMoreDataRef = useRef(false); // 태초의 데이터까지 다 불러왔는지 확인
  const logicalRangeListenerRef = useRef<any>(null); // 차트 스크롤 감지 리스너

  const chartTypeRef = useRef(chartType);
  const showMARef = useRef(showMA);
  const showTooltipRef = useRef(showTooltip); 
  const isDarkRef = useRef(isDark);
  
  useEffect(() => { chartTypeRef.current = chartType; }, [chartType]);
  useEffect(() => { showMARef.current = showMA; }, [showMA]);
  useEffect(() => { showTooltipRef.current = showTooltip; }, [showTooltip]);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

  const calculateSMA = (data: any[], count: number) => {
    const result = [];
    for (let i = count - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < count; j++) { sum += data[i - j].close; }
      result.push({ time: data[i].time, value: sum / count });
    }
    return result;
  };

  const generateDummyMarkers = (data: any[]) => {
    if (data.length < 20) return [];
    return [
      { time: data[data.length - 15].time, position: 'belowBar', color: '#0058FF', shape: 'arrowUp', text: 'Buy' },
      { time: data[data.length - 5].time, position: 'aboveBar', color: '#fb2c36', shape: 'arrowDown', text: 'Sell' },
    ];
  };

  const formatData = (rawArray: any[]) => {
    const candles: any[] = [];
    const volumes: any[] = [];
    rawArray.forEach((d) => {
      const time = (d[0] / 1000) as Time;
      const open = parseFloat(d[1]);
      const close = parseFloat(d[4]);
      candles.push({ time, open, high: parseFloat(d[2]), low: parseFloat(d[3]), close });
      volumes.push({ time, value: parseFloat(d[5]), color: close >= open ? 'rgba(251, 44, 54, 0.3)' : 'rgba(0, 88, 255, 0.3)' });
    });
    return { candles, volumes };
  };

  // 1. 차트 껍데기 세팅 (최초 1회)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#333' },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      grid: { vertLines: { color: '#f0f3fa' }, horzLines: { color: '#f0f3fa' } },
      localization: {
        priceFormatter: (price) => formatChartPrice(price),
      },
      timeScale: { timeVisible: true, secondsVisible: false, barSpacing: 12, rightOffset: 5 },
      rightPriceScale: { borderVisible: false },
      crosshair: { mode: 1 }, 
    });
    chartRef.current = chart;

    seriesRef.current.candle = chart.addSeries(CandlestickSeries, { upColor: '#fb2c36', downColor: '#0058FF', borderVisible: false, wickUpColor: '#fb2c36', wickDownColor: '#0058FF' });
    markersRef.current.candle = createSeriesMarkers(seriesRef.current.candle);
    seriesRef.current.bar = chart.addSeries(BarSeries, { upColor: '#fb2c36', downColor: '#0058FF', thinBars: false });
    markersRef.current.bar = createSeriesMarkers(seriesRef.current.bar);
    seriesRef.current.baseline = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 65000 }, 
      topFillColor1: 'rgba(251, 44, 54, 0.28)', topFillColor2: 'rgba(251, 44, 54, 0.05)', topLineColor: '#fb2c36',
      bottomFillColor1: 'rgba(0, 88, 255, 0.05)', bottomFillColor2: 'rgba(0, 88, 255, 0.28)', bottomLineColor: '#0058FF',
    });
    markersRef.current.baseline = createSeriesMarkers(seriesRef.current.baseline);
    seriesRef.current.line = chart.addSeries(LineSeries, { color: '#0058FF', lineWidth: 2 });
    markersRef.current.line = createSeriesMarkers(seriesRef.current.line);
    seriesRef.current.area = chart.addSeries(AreaSeries, { lineColor: '#0058FF', topColor: 'rgba(0, 88, 255, 0.4)', bottomColor: 'rgba(0, 88, 255, 0.0)', lineWidth: 2 });
    markersRef.current.area = createSeriesMarkers(seriesRef.current.area);
    seriesRef.current.ma20 = chart.addSeries(LineSeries, { color: '#F5A623', lineWidth: 2, title: 'MA20' });
    seriesRef.current.volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current || !chartContainerRef.current) return;
      if (!showTooltipRef.current || param.point === undefined || !param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
        tooltipRef.current.style.display = 'none';
        return;
      }
      const activeSeries = seriesRef.current[chartTypeRef.current];
      if (!activeSeries) return;
      try {
        const data: any = param.seriesData.get(activeSeries);
        const volData: any = param.seriesData.get(seriesRef.current.volume);
        if (data) {
          const dateStr = new Date((param.time as number) * 1000).toLocaleString();
          const price = formatChartPrice(
            data.value !== undefined ? Number(data.value) : Number(data.close)
          );
          const volume = volData ? volData.value.toFixed(2) : '0.00';
          tooltipRef.current.innerHTML = `<div style="font-size: 12px; color: #888; margin-bottom: 4px;">${dateStr}</div><div style="font-weight: bold; color: inherit;">가격: $${price}</div><div style="font-size: 12px; color: #888;">거래량: ${volume}</div>`;
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = param.point.x + 15 + 'px';
          tooltipRef.current.style.top = param.point.y + 15 + 'px';
        }
      } catch {} 
    });

    const handleResize = () => { 
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth }); 
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        if (wsRef.current.readyState === 0) wsRef.current.onopen = () => wsRef.current!.close();
        else if (wsRef.current.readyState === 1) wsRef.current.close();
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []); 

  // 2. 초기 데이터 페칭 및 무한 스크롤 로직
  useEffect(() => {
    if (!chartRef.current) return;
    let isFetching = true;

    // 코인이나 시간대가 바뀌면 무한스크롤 상태 초기화
    isLoadingMoreRef.current = false;
    noMoreDataRef.current = false;

    if (wsRef.current) {
      if (wsRef.current.readyState === 1) wsRef.current.close();
    }

    // 🌟 [무한 스크롤 1] 왼쪽 끝에 도달했을 때 과거 데이터를 가져오는 함수
    const fetchMoreHistoricalData = async () => {
      if (isLoadingMoreRef.current || noMoreDataRef.current || dataRef.current.length === 0) return;
      
      isLoadingMoreRef.current = true;
      // 현재 가지고 있는 가장 오래된 캔들의 시간을 구합니다. (밀리초)
      const oldestTime = dataRef.current[0].time * 1000;

      try {
        // endTime 파라미터로 가장 오래된 시간의 "이전" 1000개를 달라고 요청합니다.
        const res = await fetch(
          getBinanceKlineApiUrl({
            marketType: selectedMarketType,
            symbol: selectedCoin,
            timeframe,
            endTime: oldestTime - 1,
            limit: 1000,
          })
        );
        const rawData = await res.json();

        if (rawData.length === 0) {
          noMoreDataRef.current = true; // 더 이상 과거가 없으면 중단
          return;
        }

        const { candles, volumes } = formatData(rawData);

        // 🌟 새로 가져온 과거 데이터를 기존 데이터 배열의 '앞'에 합칩니다!
        dataRef.current = [...candles, ...dataRef.current];
        volumesRef.current = [...volumes, ...volumesRef.current];

        setDataTick(prev => prev + 1); // 차트 리렌더링 트리거
      } catch (err) {
        console.error("과거 데이터 로딩 에러:", err);
      } finally {
        isLoadingMoreRef.current = false;
      }
    };

    // 🌟 [무한 스크롤 2] 사용자가 차트를 움직일 때 감지하는 리스너
    const handleLogicalRangeChange = (newLogicalRange: any) => {
      // 화면에 보이는 캔들의 인덱스가 0(왼쪽 끝)에 가까워지면(50개 남았을 때) 과거 데이터를 미리 불러옵니다.
      if (newLogicalRange !== null && newLogicalRange.from < 50) {
        fetchMoreHistoricalData();
      }
    };

    // 기존 리스너가 있다면 제거 후 다시 부착
    if (logicalRangeListenerRef.current) {
      chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(logicalRangeListenerRef.current);
    }
    logicalRangeListenerRef.current = handleLogicalRangeChange;
    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleLogicalRangeChange);


    // 처음 접속 시 최초 1000개 로딩
    fetch(
      getBinanceKlineApiUrl({
        marketType: selectedMarketType,
        symbol: selectedCoin,
        timeframe,
        limit: 1000,
      })
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isFetching) return;

        const { candles, volumes } = formatData(data);
        dataRef.current = candles; 
        volumesRef.current = volumes;
        
        if(candles.length > 0) {
          seriesRef.current.baseline.applyOptions({ baseValue: { type: 'price', price: candles[0].close } });
        }
        
        setDataTick(prev => prev + 1);

        const wsBaseUrl = getBinanceWsBaseUrl(selectedMarketType);
        wsRef.current = new WebSocket(
          `${wsBaseUrl}/ws/${selectedCoin.toLowerCase()}@kline_${timeframe}`
        );
        wsRef.current.onmessage = (event) => {
          if (!chartRef.current) return;

          const kline = JSON.parse(event.data).k;
          const time = (kline.t / 1000) as Time;
          const open = parseFloat(kline.o);
          const close = parseFloat(kline.c);
          
          const newCandle = { time, open, high: parseFloat(kline.h), low: parseFloat(kline.l), close };
          const newVolume = { time, value: parseFloat(kline.v), color: close >= open ? 'rgba(251, 44, 54, 0.3)' : 'rgba(0, 88, 255, 0.3)' };
          
          const currentCandles = dataRef.current;
          const currentVolumes = volumesRef.current;
          const lastCandle = currentCandles[currentCandles.length - 1];

          if (lastCandle && time < lastCandle.time) return;

          if (lastCandle && lastCandle.time === time) {
            currentCandles[currentCandles.length - 1] = newCandle;
            currentVolumes[currentVolumes.length - 1] = newVolume;
          } else {
            currentCandles.push(newCandle);
            currentVolumes.push(newVolume);
          }
          
          try {
            seriesRef.current.volume.update(newVolume);
            
            const type = chartTypeRef.current;
            if (type === "candle" || type === "bar") seriesRef.current[type].update(newCandle);
            if (type === "line" || type === "area" || type === "baseline") seriesRef.current[type].update({ time, value: close });

            if (showMARef.current && currentCandles.length >= 20) {
              let sum = 0;
              for (let i = currentCandles.length - 20; i < currentCandles.length; i++) { sum += currentCandles[i].close; }
              seriesRef.current.ma20.update({ time, value: sum / 20 });
            }
          } catch {}
        };
      });

    return () => { isFetching = false; };
  }, [timeframe, selectedCoin, selectedMarketType]);

  // 3. UI 업데이트 훅
  useEffect(() => {
    if (!chartRef.current || dataRef.current.length === 0) return;

    try {
      const candles = dataRef.current;
      const volumes = volumesRef.current;
      const lineData = candles.map(c => ({ time: c.time, value: c.close }));

      // 🌟 데이터가 추가될 때 setData를 호출하면 Lightweight Charts가 알아서 스크롤 위치를 유지해줍니다!
      seriesRef.current.volume.setData(volumes);

      seriesRef.current.candle.setData(chartType === "candle" ? candles : []);
      seriesRef.current.bar.setData(chartType === "bar" ? candles : []);
      seriesRef.current.baseline.setData(chartType === "baseline" ? lineData : []);
      seriesRef.current.line.setData(chartType === "line" ? lineData : []);
      seriesRef.current.area.setData(chartType === "area" ? lineData : []);

      seriesRef.current.ma20.setData(showMA ? calculateSMA(candles, 20) : []);

      ['candle', 'bar', 'baseline', 'line', 'area'].forEach(type => markersRef.current[type].setMarkers([]));
      if (showMarkers) { markersRef.current[chartType].setMarkers(generateDummyMarkers(candles)); }

      if (priceLineRef.current) {
        try { priceLineRef.current.series.removePriceLine(priceLineRef.current.line); } catch {}
        priceLineRef.current = null;
      }

      if (showPriceLine && candles.length > 0) {
        const activeSeries = seriesRef.current[chartType];
        const avgPrice = candles[candles.length - 1].close * 0.98;
        const line = activeSeries.createPriceLine({
          price: avgPrice, color: '#00C087', lineWidth: 2, lineStyle: 2, axisLabelVisible: true, title: '내 평단가',
        });
        priceLineRef.current = { line, series: activeSeries }; 
      }

      chartRef.current.priceScale('right').applyOptions({ mode: isPercent ? PriceScaleMode.Percentage : PriceScaleMode.Normal });
    } catch {}
  }, [chartType, showMA, showMarkers, isPercent, showPriceLine, dataTick]); 

  // 4. 테마 변경
  useEffect(() => {
    if(!chartRef.current) return;
    const darkTheme = {
      layout: { background: { type: ColorType.Solid, color: '#181A20' }, textColor: '#B7BDC6' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
    };
    const lightTheme = {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#333' },
      grid: { vertLines: { color: '#f0f3fa' }, horzLines: { color: '#f0f3fa' } },
    };
    try { chartRef.current.applyOptions(isDark ? darkTheme : lightTheme); } catch {}
  }, [isDark]);

  return (
    <section 
      aria-label={`${meta.displayNameKr} 상세 차트 및 제어 영역`}
      className={`w-full p-6 border transition-colors ${isDark ? 'bg-[#181A20] border-[#2B3139]' : 'bg-white border-gray-100'} flex flex-col gap-4 relative`}
    >
      <h2 className="sr-only">{meta.displayNameKr} 차트</h2>

      <header className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${isDark ? 'border-[#2B3139]' : 'border-gray-100'}`}>
        
        <div className="flex flex-wrap items-center gap-4">
          
          <nav aria-label="시간대 선택" className="flex rounded-lg shadow-sm">
            {timeframeOptions.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setTimeframe(opt.value)}
                aria-pressed={timeframe === opt.value}
                className={`px-3 py-1.5 text-sm font-medium border focus:z-10 transition-colors
                  ${i === 0 ? 'rounded-l-lg' : ''} ${i === timeframeOptions.length - 1 ? 'rounded-r-lg' : ''} ${i !== 0 ? '-ml-px' : ''} 
                  ${timeframe === opt.value 
                    ? (isDark ? 'bg-[#2B3139] text-white border-gray-500 z-10' : 'bg-blue-50 text-[#0058FF] border-[#0058FF] z-10') 
                    : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </nav>

          <nav aria-label="차트 종류 선택" className="flex rounded-lg shadow-sm">
            {chartTypeOptions.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setChartType(opt.value)}
                aria-pressed={chartType === opt.value}
                className={`px-3 py-1.5 text-sm font-medium border focus:z-10 transition-colors
                  ${i === 0 ? 'rounded-l-lg' : ''} ${i === chartTypeOptions.length - 1 ? 'rounded-r-lg' : ''} ${i !== 0 ? '-ml-px' : ''} 
                  ${chartType === opt.value 
                    ? (isDark ? 'bg-[#2B3139] text-white border-gray-500 z-10' : 'bg-gray-100 text-gray-900 border-gray-300 z-10 font-bold') 
                    : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div role="group" aria-label="차트 기능 토글" className="flex rounded-lg shadow-sm">
            
            <button 
              onClick={() => setShowPriceLine(!showPriceLine)} 
              aria-pressed={showPriceLine}
              className={`px-3 py-1.5 text-sm font-medium border rounded-l-lg focus:z-10 transition-colors 
                ${showPriceLine ? 'bg-[#00C087] text-white border-[#00C087] z-10' : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
              `}
            >
              평단가
            </button>

            <button 
              onClick={() => setShowMA(!showMA)} 
              aria-pressed={showMA}
              className={`px-3 py-1.5 text-sm font-medium border -ml-px focus:z-10 transition-colors 
                ${showMA ? 'bg-[#F5A623] text-white border-[#F5A623] z-10' : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
              `}
            >
              MA20
            </button>

            <button 
              onClick={() => setShowMarkers(!showMarkers)} 
              aria-pressed={showMarkers}
              className={`px-3 py-1.5 text-sm font-medium border -ml-px focus:z-10 transition-colors 
                ${showMarkers ? 'bg-[#0058FF] text-white border-[#0058FF] z-10' : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
              `}
            >
              마커
            </button>

            <button 
              onClick={() => setShowTooltip(!showTooltip)} 
              aria-pressed={showTooltip}
              className={`px-3 py-1.5 text-sm font-medium border -ml-px focus:z-10 transition-colors 
                ${showTooltip ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] z-10' : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
              `}
            >
              툴팁
            </button>

            <button 
              onClick={() => setIsPercent(!isPercent)} 
              aria-pressed={isPercent}
              className={`px-3 py-1.5 text-sm font-medium border rounded-r-lg -ml-px focus:z-10 transition-colors 
                ${isPercent ? 'bg-gray-800 text-white border-gray-800 z-10' : (isDark ? 'bg-[#181A20] text-gray-400 border-gray-700 hover:bg-[#2B3139]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}
              `}
            >
              {isPercent ? "% 비율" : "$ 가격"}
            </button>
            
          </div>

          <button 
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            className={`p-2 text-xl rounded-full transition-all border ${isDark ? 'bg-[#2B3139] border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
            title="테마 변경"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

      </header>
      
      <div 
        ref={chartContainerRef} 
        role="img"
        aria-label={`${meta.displayNameKr} ${timeframe} 기준 차트 시각화 영역`}
        className="w-full h-[500px] relative" 
      />

      <div 
        ref={tooltipRef} 
        aria-hidden="true" 
        className={`absolute z-50 pointer-events-none p-3 rounded-lg shadow-lg border hidden transition-none ${isDark ? 'bg-[#2B3139] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} 
        style={{ top: 0, left: 0 }} 
      />
    </section>
  );
}
