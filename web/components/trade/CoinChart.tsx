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
  getBinanceWsUrl,
  type MarketType,
} from "@/lib/utils/market";
import { cn } from "@/lib/utils/cs";

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

const closeChartSocket = (socket: WebSocket | null) => {
  if (!socket) {
    return;
  }

  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;

  if (
    socket.readyState === WebSocket.CONNECTING ||
    socket.readyState === WebSocket.OPEN
  ) {
    socket.close();
  }
};

const mergeByTime = <T extends { time: Time }>(current: T[], incoming: T[]) => {
  const dataByTime = new Map<Time, T>();

  for (const item of [...current, ...incoming]) {
    dataByTime.set(item.time, item);
  }

  return Array.from(dataByTime.values()).sort(
    (a, b) => Number(a.time) - Number(b.time)
  );
};

type CoinChartProps = {
  className?: string;
  chartAreaClassName?: string;
  marketTypeOverride?: MarketType;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getSocketValue = (value: unknown) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
};

const formatSocketUpdatedTime = () => {
  return new Date().toLocaleTimeString("ko-KR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function CoinChart({
  className,
  chartAreaClassName,
  marketTypeOverride,
}: CoinChartProps) {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);
  const selectedMarketType = useTickerStore((state) => state.selectedMarketType);
  const effectiveMarketType = marketTypeOverride ?? selectedMarketType;
  const coinMetaListRef = useRef(coinMetaList);
  coinMetaListRef.current = coinMetaList;
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
  const [isDark, setIsDark] = useState(true); 
  const [showPriceLine, setShowPriceLine] = useState(false); 
  const [showTooltip, setShowTooltip] = useState(true); 

  const [dataTick, setDataTick] = useState(0);
  const [isChartDataLoading, setIsChartDataLoading] = useState(true);
  const [chartDataErrorMessage, setChartDataErrorMessage] = useState("");
  const [lastWsTime, setLastWsTime] = useState<string>("연결 대기 중...");

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
  const shouldScrollToRealtimeRef = useRef(false);

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
    const isSpot = effectiveMarketType === "spot";
    const upColor = isSpot ? "rgba(251, 44, 54, 0.3)" : "rgba(0, 192, 135, 0.3)";
    const downColor = isSpot ? "rgba(0, 88, 255, 0.3)" : "rgba(251, 44, 54, 0.3)";
    
    rawArray.forEach((d) => {
      const time = (d[0] / 1000) as Time;
      const open = parseFloat(d[1]);
      const close = parseFloat(d[4]);
      candles.push({ time, open, high: parseFloat(d[2]), low: parseFloat(d[3]), close });
      volumes.push({ time, value: parseFloat(d[5]), color: close >= open ? upColor : downColor });
    });
    return { candles, volumes };
  };

  const parseRealtimeKline = (payload: unknown) => {
    if (!isRecord(payload)) {
      return null;
    }

    const data = isRecord(payload.data) ? payload.data : payload;
    const kline = isRecord(data.k) ? data.k : null;

    if (!kline) {
      return null;
    }

    const openTime = Number(kline.t);
    const open = Number(getSocketValue(kline.o));
    const high = Number(getSocketValue(kline.h));
    const low = Number(getSocketValue(kline.l));
    const close = Number(getSocketValue(kline.c));
    const volume = Number(getSocketValue(kline.v));

    if (
      !Number.isFinite(openTime) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(close) ||
      !Number.isFinite(volume)
    ) {
      return null;
    }

    const time = Math.floor(openTime / 1000) as Time;

    const isSpot = effectiveMarketType === "spot";
    const upColor = isSpot ? "rgba(251, 44, 54, 0.3)" : "rgba(0, 192, 135, 0.3)";
    const downColor = isSpot ? "rgba(0, 88, 255, 0.3)" : "rgba(251, 44, 54, 0.3)";

    return {
      candle: { time, open, high, low, close },
      volume: {
        time,
        value: volume,
        color: close >= open ? upColor : downColor,
      },
    };
  };

  const upsertRealtimeData = (nextCandle: any, nextVolume: any) => {
    const currentCandles = dataRef.current;
    const currentVolumes = volumesRef.current;
    const lastCandle = currentCandles[currentCandles.length - 1];
    const shouldKeepRealtimeScroll = (() => {
      try {
        const position = chartRef.current?.timeScale().scrollPosition?.();
        return typeof position === "number" ? position < 2 : true;
      } catch {
        return true;
      }
    })();

    const isNewCandle = !lastCandle || Number(nextCandle.time) > Number(lastCandle.time);

    if (!lastCandle) {
      dataRef.current = [nextCandle];
      volumesRef.current = [nextVolume];
    } else if (Number(nextCandle.time) === Number(lastCandle.time)) {
      dataRef.current = [...currentCandles.slice(0, -1), nextCandle];
      volumesRef.current = [...currentVolumes.slice(0, -1), nextVolume];
    } else if (Number(nextCandle.time) > Number(lastCandle.time)) {
      dataRef.current = [...currentCandles, nextCandle];
      volumesRef.current = [...currentVolumes, nextVolume];
    } else {
      dataRef.current = mergeByTime(currentCandles, [nextCandle]);
      volumesRef.current = mergeByTime(currentVolumes, [nextVolume]);
    }

    // [최적화 & 동기화] 
    // 1. Kline 데이터는 '새 캔들'이 시작될 때만 imperative하게 그립니다.
    // 2. 같은 캔들 안에서의 가격 변동은 TickerStore를 구독하는 useEffect에서 처리하여 Header와 싱크를 맞춥니다.
    // 3. 거래량은 Kline에서만 오므로 여기서 항상 업데이트합니다.
    if (chartRef.current) {
      if (isNewCandle) {
        const activeSeries = seriesRef.current[chartTypeRef.current];
        if (activeSeries) {
          activeSeries.update(nextCandle);
        }
      }
      seriesRef.current.volume.update(nextVolume);

      if (shouldKeepRealtimeScroll && isNewCandle) {
        chartRef.current.timeScale().scrollToRealTime();
      }
    }
  };

  // 🌟 [추가] Ticker 가격 동기화: kline(2초)보다 빠른 ticker(300ms) 가격으로 마지막 캔들을 업데이트합니다.
  const realtime = useTickerStore((state) => state.tickers[selectedCoin]);
  useEffect(() => {
    if (!realtime?.price || !chartRef.current || dataRef.current.length === 0) return;

    const nextPrice = realtime.price;
    const currentCandles = dataRef.current;
    const lastCandle = currentCandles[currentCandles.length - 1];

    if (!lastCandle) return;

    // 마지막 캔들의 고가/저가/종가를 현재 Ticker 가격에 맞춰 갱신합니다.
    const updatedCandle = {
      ...lastCandle,
      close: nextPrice,
      high: Math.max(lastCandle.high, nextPrice),
      low: Math.min(lastCandle.low, nextPrice),
    };

    // Ref 업데이트
    dataRef.current[dataRef.current.length - 1] = updatedCandle;

    // 차트 즉시 업데이트
    const activeSeries = seriesRef.current[chartTypeRef.current];
    if (activeSeries) {
      activeSeries.update(updatedCandle);
    }
  }, [realtime?.price, selectedCoin]);

  // 1. 차트 껍데기 세팅 (최초 1회)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0B0E11' }, textColor: '#B7BDC6' },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.04)' }, horzLines: { color: 'rgba(255, 255, 255, 0.04)' } },
      localization: {
        priceFormatter: (price: number) => formatChartPrice(price),
      },
      timeScale: { timeVisible: true, secondsVisible: false, barSpacing: 12, rightOffset: 5 },
      rightPriceScale: { borderVisible: false },
      crosshair: { mode: 1 }, 
    });
    chartRef.current = chart;

    const isSpot = effectiveMarketType === "spot";
    const upColor = isSpot ? '#fb2c36' : '#00C087';
    const downColor = isSpot ? '#0058FF' : '#fb2c36';
    const upAreaColor = isSpot ? 'rgba(251, 44, 54, 0.4)' : 'rgba(0, 192, 135, 0.4)';
    const downAreaColor = isSpot ? 'rgba(0, 88, 255, 0.4)' : 'rgba(251, 44, 54, 0.4)';

    seriesRef.current.candle = chart.addSeries(CandlestickSeries, { upColor, downColor, borderVisible: false, wickUpColor: upColor, wickDownColor: downColor });
    markersRef.current.candle = createSeriesMarkers(seriesRef.current.candle);
    seriesRef.current.bar = chart.addSeries(BarSeries, { upColor, downColor, thinBars: false });
    markersRef.current.bar = createSeriesMarkers(seriesRef.current.bar);
    seriesRef.current.baseline = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 65000 }, 
      topFillColor1: isSpot ? 'rgba(251, 44, 54, 0.28)' : 'rgba(0, 192, 135, 0.28)', 
      topFillColor2: isSpot ? 'rgba(251, 44, 54, 0.05)' : 'rgba(0, 192, 135, 0.05)', 
      topLineColor: upColor,
      bottomFillColor1: isSpot ? 'rgba(0, 88, 255, 0.05)' : 'rgba(251, 44, 54, 0.05)', 
      bottomFillColor2: isSpot ? 'rgba(0, 88, 255, 0.28)' : 'rgba(251, 44, 54, 0.28)', 
      bottomLineColor: downColor,
    });
    markersRef.current.baseline = createSeriesMarkers(seriesRef.current.baseline);
    seriesRef.current.line = chart.addSeries(LineSeries, { color: downColor, lineWidth: 2 });
    markersRef.current.line = createSeriesMarkers(seriesRef.current.line);
    seriesRef.current.area = chart.addSeries(AreaSeries, { lineColor: downColor, topColor: downAreaColor, bottomColor: 'rgba(0, 88, 255, 0.0)', lineWidth: 2 });
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
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        }); 
      }
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(handleResize)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []); 

  // 2. 초기 데이터 페칭 및 무한 스크롤 로직 (웹소켓 연결 제거, HTTP 통신만 수행)
  useEffect(() => {
    if (!chartRef.current) return;
    let isActive = true;

    const currentMeta = coinMetaListRef.current.find(c => c.symbol === selectedCoin);
    const binanceSymbol = (currentMeta?.binanceRequestSymbol || selectedCoin);

    isLoadingMoreRef.current = false;
    noMoreDataRef.current = false;
    shouldScrollToRealtimeRef.current = true;
    dataRef.current = [];
    volumesRef.current = [];
    setIsChartDataLoading(true);
    setChartDataErrorMessage("");
    setDataTick(prev => prev + 1);

    const fetchMoreHistoricalData = async () => {
      if (isLoadingMoreRef.current || noMoreDataRef.current || dataRef.current.length === 0) return;
      isLoadingMoreRef.current = true;
      const oldestTime = dataRef.current[0].time * 1000;

      try {
        const res = await fetch(
          getBinanceKlineApiUrl({
            marketType: effectiveMarketType,
            symbol: binanceSymbol,
            timeframe,
            endTime: oldestTime - 1,
            limit: 1000,
          })
        );
        const rawData = await res.json();
        if (rawData.length === 0) {
          noMoreDataRef.current = true;
          return;
        }
        const { candles, volumes } = formatData(rawData);
        dataRef.current = [...candles, ...dataRef.current];
        volumesRef.current = [...volumes, ...volumesRef.current];
        shouldScrollToRealtimeRef.current = false;
        setDataTick(prev => prev + 1);
      } catch (err) {
        console.error("과거 데이터 로딩 에러:", err);
      } finally {
        isLoadingMoreRef.current = false;
      }
    };

    const handleLogicalRangeChange = (newLogicalRange: any) => {
      if (newLogicalRange !== null && newLogicalRange.from < 50) {
        fetchMoreHistoricalData();
      }
    };

    if (logicalRangeListenerRef.current) {
      chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(logicalRangeListenerRef.current);
    }
    logicalRangeListenerRef.current = handleLogicalRangeChange;
    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleLogicalRangeChange);

    fetch(
      getBinanceKlineApiUrl({
        marketType: effectiveMarketType,
        symbol: binanceSymbol,
        timeframe,
        limit: 1000,
      })
    )
      .then((res) => {
        if (!res.ok) throw new Error("캔들 API 응답 에러");
        return res.json();
      })
      .then((data) => {
        if (!isActive) return;
        if (!Array.isArray(data)) throw new Error("데이터 형식 오류");

        const { candles, volumes } = formatData(data);
        dataRef.current = mergeByTime(dataRef.current, candles);
        volumesRef.current = mergeByTime(volumesRef.current, volumes);
        
        if(candles.length > 0) {
          seriesRef.current.baseline.applyOptions({ baseValue: { type: 'price', price: candles[0].close } });
        }
        
        shouldScrollToRealtimeRef.current = true;
        setDataTick(prev => prev + 1);
      })
      .catch((error) => {
        if (dataRef.current.length === 0) {
          dataRef.current = [];
          volumesRef.current = [];
        }
        setChartDataErrorMessage(
          "차트 데이터를 불러오지 못했습니다. Binance 연결 상태를 확인해 주세요."
        );
        setDataTick(prev => prev + 1);
      })
      .finally(() => {
        if (isActive) {
          setIsChartDataLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [timeframe, selectedCoin, effectiveMarketType]);

  // 3. 실시간 kline 웹소켓으로 마지막 캔들을 갱신합니다.
  useEffect(() => {
    if (!selectedCoin) {
      return;
    }

    const currentMeta = coinMetaListRef.current.find(c => c.symbol === selectedCoin);
    const binanceSymbol = (currentMeta?.binanceRequestSymbol || selectedCoin).toLowerCase();
    const stream = `${binanceSymbol}@kline_${timeframe}`;
    const socket = new WebSocket(
      getBinanceWsUrl({
        marketType: effectiveMarketType,
        stream,
        isCombined: true,
      })
    );

    wsRef.current = socket;
    setLastWsTime("연결 중...");

    socket.onopen = () => {
      setLastWsTime("연결됨");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const realtimeKline = parseRealtimeKline(payload);

        if (!realtimeKline) {
          return;
        }

        upsertRealtimeData(realtimeKline.candle, realtimeKline.volume);
        setLastWsTime(formatSocketUpdatedTime());
      } catch (error) {
        console.error("차트 실시간 데이터 파싱 실패:", error);
      }
    };

    socket.onerror = () => {
      setLastWsTime("연결 오류");
    };

    socket.onclose = () => {
      if (wsRef.current === socket) {
        setLastWsTime("연결 종료");
      }
    };

    return () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }

      closeChartSocket(socket);
    };
  }, [effectiveMarketType, selectedCoin, timeframe]);

  // 4. UI 업데이트 훅
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

      if (shouldScrollToRealtimeRef.current) {
        chartRef.current.timeScale().scrollToRealTime();
        shouldScrollToRealtimeRef.current = false;
      }
    } catch {}
  }, [chartType, showMA, showMarkers, isPercent, showPriceLine, dataTick]); 

  // 4.5 현물/선물 탭 전환 시 차트 색상 실시간 반영
  useEffect(() => {
    if (!chartRef.current) return;
    
    const isSpot = effectiveMarketType === "spot";
    const upColor = isSpot ? '#fb2c36' : '#00C087';
    const downColor = isSpot ? '#0058FF' : '#fb2c36';
    const upAreaColor = isSpot ? 'rgba(251, 44, 54, 0.4)' : 'rgba(0, 192, 135, 0.4)';
    const downAreaColor = isSpot ? 'rgba(0, 88, 255, 0.4)' : 'rgba(251, 44, 54, 0.4)';
    const upVolume = isSpot ? "rgba(251, 44, 54, 0.3)" : "rgba(0, 192, 135, 0.3)";
    const downVolume = isSpot ? "rgba(0, 88, 255, 0.3)" : "rgba(251, 44, 54, 0.3)";

    try {
      seriesRef.current.candle?.applyOptions({ upColor, downColor, wickUpColor: upColor, wickDownColor: downColor });
      seriesRef.current.bar?.applyOptions({ upColor, downColor });
      seriesRef.current.baseline?.applyOptions({
        topFillColor1: isSpot ? 'rgba(251, 44, 54, 0.28)' : 'rgba(0, 192, 135, 0.28)',
        topFillColor2: isSpot ? 'rgba(251, 44, 54, 0.05)' : 'rgba(0, 192, 135, 0.05)',
        topLineColor: upColor,
        bottomFillColor1: isSpot ? 'rgba(0, 88, 255, 0.05)' : 'rgba(251, 44, 54, 0.05)',
        bottomFillColor2: isSpot ? 'rgba(0, 88, 255, 0.28)' : 'rgba(251, 44, 54, 0.28)',
        bottomLineColor: downColor,
      });
      seriesRef.current.line?.applyOptions({ color: downColor });
      seriesRef.current.area?.applyOptions({ lineColor: downColor, topColor: downAreaColor });

      // 재조립 시 과거 데이터 색상 업데이트를 위해 dataTick 강제 트리거
      setDataTick(prev => prev + 1);
    } catch {}
  }, [effectiveMarketType]);

  // 5. 테마 변경
  useEffect(() => {
    if(!chartRef.current) return;
    const darkTheme = {
      layout: { background: { type: ColorType.Solid, color: '#0B0E11' }, textColor: '#B7BDC6' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.04)' }, horzLines: { color: 'rgba(255, 255, 255, 0.04)' } },
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
      className={cn(
        "relative flex w-full flex-col gap-2 border p-4 transition-colors",
        isDark ? "border-[#2B3139] bg-[#181A20]" : "border-gray-100 bg-white",
        className
      )}
    >
      <h2 className="sr-only">{meta.displayNameKr} 차트</h2>

      <header className={`flex flex-wrap items-center justify-between`}>
        
        <div className="flex flex-wrap items-center gap-4">
          
          <nav aria-label="시간대 선택" className="flex gap-1">
            {timeframeOptions.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setTimeframe(opt.value)}
                aria-pressed={timeframe === opt.value}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                  ${timeframe === opt.value
                    ? (isDark ? "bg-white/20 text-white shadow-sm" : "bg-blue-100 text-[#0058FF] shadow-sm")
                    : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </nav>

          <nav aria-label="차트 종류 선택" className="flex gap-1">
            {chartTypeOptions.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setChartType(opt.value)}
                aria-pressed={chartType === opt.value}
                className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                  ${chartType === opt.value
                    ? (isDark ? "bg-white/20 text-white shadow-sm" : "bg-gray-200 text-gray-900 shadow-sm")
                    : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div role="group" aria-label="차트 기능 토글" className="flex gap-1">
            
            <button 
              onClick={() => setShowPriceLine(!showPriceLine)} 
              aria-pressed={showPriceLine}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                ${showPriceLine ? "bg-[#00C087] text-white shadow-sm" : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              `}
            >
              평단가
            </button>

            <button 
              onClick={() => setShowMA(!showMA)} 
              aria-pressed={showMA}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                ${showMA ? "bg-[#F5A623] text-white shadow-sm" : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              `}
            >
              MA20
            </button>

            <button 
              onClick={() => setShowMarkers(!showMarkers)} 
              aria-pressed={showMarkers}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                ${showMarkers ? "bg-[#0058FF] text-white shadow-sm" : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              `}
            >
              마커
            </button>

            <button 
              onClick={() => setShowTooltip(!showTooltip)} 
              aria-pressed={showTooltip}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                ${showTooltip ? "bg-[#8B5CF6] text-white shadow-sm" : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              `}
            >
              툴팁
            </button>

            <button 
              onClick={() => setIsPercent(!isPercent)} 
              aria-pressed={isPercent}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors
                ${isPercent ? "bg-[#9B51E0] text-white shadow-sm" : (isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100")}
              `}
            >
              {isPercent ? "% 비율" : "$ 가격"}
            </button>
            
          </div>

          {/* <button 
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            className={`p-2 text-xl rounded-full transition-all border ${isDark ? 'bg-[#2B3139] border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
            title="테마 변경"
          >
            {isDark ? "☀️" : "🌙"}
          </button> */}
          <span className="text-[10px] text-gray-500">WS: {lastWsTime}</span>
        </div>

      </header>
      
      <div className={cn("relative h-[500px] w-full", chartAreaClassName)}>
        <div
          ref={chartContainerRef}
          role="img"
          aria-label={`${meta.displayNameKr} ${timeframe} 기준 차트 시각화 영역`}
          className="h-full w-full"
        />
        {isChartDataLoading ? (
          <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${isDark ? 'bg-[#0B0E11]/70 text-gray-500' : 'bg-white/70 text-gray-400'}`}>
            차트 데이터를 불러오는 중입니다.
          </div>
        ) : null}
        {chartDataErrorMessage ? (
          <div className={`absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-bold ${isDark ? 'bg-[#0B0E11]/80 text-gray-500' : 'bg-white/80 text-gray-500'}`}>
            {chartDataErrorMessage}
          </div>
        ) : null}
      </div>

      <div 
        ref={tooltipRef} 
        aria-hidden="true" 
        className={`absolute z-50 pointer-events-none p-3 rounded-lg shadow-lg border hidden transition-none ${isDark ? 'bg-[#2B3139] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} 
        style={{ top: 0, left: 0 }} 
      />
    </section>
  );
}
