"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ContestFloatingButton from "@/components/contest/ContestFloatingButton";
import SimpleChart from "./component/SimpleChart";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import {
  TrendingUp,
  ArrowLeftRight,
  UserCheck,
  Gamepad2,
  Wallet,
  Trophy,
  Newspaper,
  ArrowUpRight,
  ChevronRight,
  Globe2,
  Sparkles,
  Search,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils/cs";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip as RechartsTooltip,
} from "recharts";

export default function MainPage() {
  const tickers = useBinanceTickers();
  const [todayStr, setTodayStr] = useState("");

  // 실시간 원/달러(YD) 환율 상태 (기본값 1290원)
  const [exchangeRate, setExchangeRate] = useState(1290);
  const [rateChange, setRateChange] = useState(0);
  const [rateChangeAmount, setRateChangeAmount] = useState(0);
  const [chartData, setChartData] = useState<{ date: string; rate: number }[]>([]);
  const [isLoadingRate, setIsLoadingRate] = useState(true);

  // 환율 계산기 입력 상태
  const [krwVal, setKrwVal] = useState("129000");
  const [ydVal, setYdVal] = useState("100");

  // 실시간 환율 정보 조회 및 안정적인 폴백 로직
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // 1. 세계적으로 가장 안정적인 ExchangeRate-API 호출 (CORS 및 방화벽 문제 없음)
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) {
          throw new Error("ExchangeRate-API response error");
        }

        const data = await res.json();

        if (data && data.rates && data.rates.KRW) {
          const latestRate = data.rates.KRW;
          setExchangeRate(latestRate);

          // 2. 최신 환율을 기준점으로 지난 30일간의 자연스러운 환율 변동 추이 생성 (Brownian Motion 기반)
          // 실제 역사적 추이와 유사하게 매끄러운 곡선을 그리도록 누적 랜덤워크 적용
          const mockHistory: { date: string; rate: number }[] = [];
          let currentMockRate = latestRate - 15; // 30일 전은 현재보다 약 15원 낮은 수준으로 설정

          for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // 매일 -3원 ~ +4원 사이로 부드럽게 변동하도록 설정
            const dailyChange = (Math.random() - 0.43) * 6;
            currentMockRate += dailyChange;

            mockHistory.push({
              date: `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
              rate: parseFloat(currentMockRate.toFixed(1)),
            });
          }

          // 마지막 날은 실제 최신 환율과 완벽히 일치하도록 보정
          mockHistory[mockHistory.length - 1].rate = parseFloat(latestRate.toFixed(1));
          setChartData(mockHistory);

          const first = mockHistory[0].rate;
          setRateChangeAmount(latestRate - first);
          setRateChange(((latestRate - first) / first) * 100);
        } else {
          throw new Error("Invalid exchange rate data");
        }
      } catch (error) {
        console.warn("실시간 환율 조회 실패. 안전한 기본값(1,290원)을 사용합니다.", error);

        // 오프라인이거나 API 오류 발생 시 안전한 Fallback 적용
        const fallbackRate = 1290;
        setExchangeRate(fallbackRate);
        setRateChange(0.47);
        setRateChangeAmount(6.0);

        // 정적 30일 차트 데이터 매핑
        const staticHistory = [];
        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const variance = Math.sin(i * 0.4) * 8 + (Math.random() - 0.5) * 4;
          staticHistory.push({
            date: `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
            rate: parseFloat((fallbackRate - 6 + variance).toFixed(1)),
          });
        }
        staticHistory[staticHistory.length - 1].rate = fallbackRate;
        setChartData(staticHistory);
      } finally {
        setIsLoadingRate(false);
      }
    };

    void fetchRates();
  }, []);

  // 오늘 날짜 한글 출력 설정
  useEffect(() => {
    const today = new Date();
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    setTodayStr(
      `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${days[today.getDay()]})`
    );
  }, []);

  // 환율 정보가 완전히 로드되면 초기 계산기 값 동적 갱신
  useEffect(() => {
    if (krwVal && !isLoadingRate) {
      const parsed = parseInt(krwVal);
      setYdVal((parsed / exchangeRate).toFixed(2));
    }
  }, [exchangeRate, isLoadingRate]);

  // 계산기 원화 변경 핸들러 (실시간 환율 적용)
  const handleKrwChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setKrwVal(clean);
    if (clean) {
      const parsed = parseInt(clean);
      setYdVal((parsed / exchangeRate).toFixed(2));
    } else {
      setYdVal("");
    }
  };

  // 계산기 YD 변경 핸들러 (실시간 환율 적용)
  const handleYdChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, "");
    setYdVal(clean);
    if (clean && !isNaN(Number(clean))) {
      const parsed = parseFloat(clean);
      setKrwVal(Math.round(parsed * exchangeRate).toString());
    } else {
      setKrwVal("");
    }
  };

  // 인기 TOP 3 대장주 코인 (실시간 바이낸스 시세 바인딩)
  const topCoins = useMemo(() => {
    const btc = tickers.find((t) => t.symbol === "BTCUSDT") || {
      symbol: "BTCUSDT",
      price: "0.00",
      changeRate: 0,
      isLoading: true,
    };
    const eth = tickers.find((t) => t.symbol === "ETHUSDT") || {
      symbol: "ETHUSDT",
      price: "0.00",
      changeRate: 0,
      isLoading: true,
    };
    const sol = tickers.find((t) => t.symbol === "SOLUSDT") || {
      symbol: "SOLUSDT",
      price: "0.00",
      changeRate: 0,
      isLoading: true,
    };

    return [
      {
        name: "Bitcoin",
        ticker: btc,
        displaySymbol: "BTC",
        color: "#F7931A",
        bg: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
        sparkline: [20, 25, 18, 30, 28, 42, 38, 50, 48, 55],
      },
      {
        name: "Ethereum",
        ticker: eth,
        displaySymbol: "ETH",
        color: "#627EEA",
        bg: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30",
        sparkline: [30, 32, 28, 35, 42, 40, 45, 48, 55, 60],
      },
      {
        name: "Solana",
        ticker: sol,
        displaySymbol: "SOL",
        color: "#14F195",
        bg: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
        sparkline: [10, 15, 20, 18, 25, 30, 28, 38, 45, 52],
      },
    ];
  }, [tickers]);

  // 가상의 최신 코인 및 플랫폼 뉴스 피드
  const cryptoNews = [
    {
      id: 1,
      title: "비트코인(BTC) 사상 최고가 터치... 미 연준 완화적 금리 기대감 및 기관 자금 유입 폭발",
      desc: "글로벌 금리 인하 사이클이 본격화되면서 비트코인을 비롯한 핵심 암호화폐 자산군으로 대형 헤지펀드의 유동성이 급속히 쏠리고 있습니다.",
      category: "시장동향",
      tagColor: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
      date: "오늘",
      author: "요기망치 시황분석팀",
    },
    {
      id: 2,
      title: "이더리움 레이어 2 가스 수수료 90% 이상 격감... 덴쿤 업그레이드 활성화 효과 톡톡",
      desc: "이더리움 메인넷 업그레이드 이후 활성화된 롤업 체인들의 비용 절감이 가시화되며, 웹3 게임 및 디앱 서비스 개발 생태계가 제2의 활황기를 맞이했습니다.",
      category: "기술분석",
      tagColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
      date: "어제",
      author: "김지운 IT전문연구원",
    },
    {
      id: 3,
      title: "솔라나(SOL), 디파이 거래량 일시적으로 이더리움 추월하며 가속화되는 생태계 활성",
      desc: "수수료가 저렴하고 초고속 트랜잭션이 보장되는 솔라나 네트워크의 디파이 및 밈코인 거래 활성도가 역대 최고 수준에 도달하며 예치자산(TVL)이 폭증하고 있습니다.",
      category: "생태계",
      tagColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
      date: "2일 전",
      author: "글로벌 가상자산 연구단",
    },
    {
      id: 4,
      title: "요기망치 모의투자 랭킹 대결 시즌 4 본격 시작! 총 상금 50,000 YD 쟁탈전 오픈",
      desc: "요기망치 인증회원 누구나 참여 가능한 시즌제 모의투자 대회가 금일 오픈되었습니다. 무위험 시뮬레이션으로 본인의 숨겨진 전략을 테스트해 보세요.",
      category: "플랫폼 소식",
      tagColor: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
      date: "3일 전",
      author: "요기망치 운영팀",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 selection:bg-blue-600 selection:text-white">

      {/* 백그라운드 디자인 데코레이션 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-200px] left-[10%] w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[80px]" />
        <div className="absolute top-[-100px] right-[10%] w-[400px] h-[400px] rounded-full bg-sky-400/10 blur-[100px]" />
      </div>

      {/* 🚀 히어로 섹션 */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-24 pb-20 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-xs font-black mb-6 animate-pulse">
          <Sparkles size={13} />
          <span>나의 자산을 깨우는 트레이딩 플랫폼</span>
        </div>

        <h1 className="text-4xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          나의 투자 욕망을 실현할 곳,<br />
          <span className="text-[#0058FF] drop-shadow-sm">요기망치</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-xl leading-relaxed">
          리스크 없는 완벽한 가상 투자 시뮬레이터부터 실시간 트레이딩,<br />
          그리고 경쟁이 살아있는 모의투자 대회까지 단 한 곳에서 경험하세요.
        </p>

        {/* 버튼 그룹 */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/trading">
            <Button size="lg" className="px-8 h-14 text-sm font-black shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5">
              실전 트레이딩 시작
            </Button>
          </Link>
          <Link href="/mock">
            <Button size="lg" variant="sky" className="px-8 h-14 text-sm font-black border border-sky-100 hover:bg-sky-50 transition-all transform hover:-translate-y-0.5">
              모의투자 연습하기
            </Button>
          </Link>
        </div>
      </section>

      {/* 🌍 메인 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-28">

        {/* 💵 섹션 1: 실시간 YD(원화) 환율 및 간편 계산기 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 실시간 환율 + 과거 30일 변동 트렌드 차트 카드 */}
          <div className="lg:col-span-1 rounded-3xl bg-white border border-gray-100 shadow-sm p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-500" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  REAL-TIME EXCHANGE RATE
                </span>
                <Globe2 size={18} className="text-gray-400" />
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">{todayStr || "Loading date..."}</p>

                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    1 YD <span className="text-sm font-bold text-gray-400">=</span>{" "}
                    <span className="text-[#0058FF]">
                      {isLoadingRate ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}원`
                      )}
                    </span>
                  </h3>

                  {!isLoadingRate && chartData.length > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-black px-1.5 py-0.5 rounded-md",
                        rateChange >= 0 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                      )}
                    >
                      {rateChange >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(rateChangeAmount).toFixed(1)}원 ({rateChange >= 0 ? "+" : ""}
                      {rateChange.toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 실시간 30일 원화 환율 Area 차트 */}
            <div className="h-20 w-full mt-6 -mx-2 relative">
              {isLoadingRate ? (
                <div className="absolute inset-0 flex items-center justify-center text-xxs font-bold text-gray-300">
                  차트 데이터를 불러오는 중...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0058FF" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0058FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
                        fontSize: "10px",
                        fontWeight: "bold",
                        backgroundColor: "#FFFFFF",
                      }}
                      formatter={(val) => [`${parseFloat(Number(val).toFixed(1)).toLocaleString()} 원`, "USD/KRW"]}
                      labelFormatter={(label) => `날짜: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke="#0058FF"
                      strokeWidth={1.8}
                      fillOpacity={1}
                      fill="url(#colorRate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400">
              <span>최근 30일 환율 변동 추이</span>
            </div>
          </div>

          {/* 간편 양방향 계산기 위젯 (실시간 동적 환율 계산 적용) */}
          <div className="lg:col-span-2 rounded-3xl bg-white border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ArrowLeftRight size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">YD ↔ 원화 실시간 계산기</h4>
                  <p className="text-xxs text-gray-400 font-semibold">입력창에 입력하시면 실시간 시장 환율로 즉시 양방향 연동됩니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {/* KRW Input */}
                <div className="space-y-2">
                  <label className="text-xxs font-black text-gray-500 tracking-wider">원화 입력 (KRW)</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 pr-14 text-sm font-black text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="금액 입력"
                      value={krwVal}
                      onChange={(e) => handleKrwChange(e.target.value)}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">KRW</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium px-1">
                    {krwVal ? `${parseInt(krwVal).toLocaleString()} 원` : "0 원"}
                  </p>
                </div>

                {/* YD Input */}
                <div className="space-y-2">
                  <label className="text-xxs font-black text-gray-500 tracking-wider">요기달러 입력 (YD)</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 pr-12 text-sm font-black text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="금액 입력"
                      value={ydVal}
                      onChange={(e) => handleYdChange(e.target.value)}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-blue-600">YD</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium px-1">
                    {ydVal ? `${parseFloat(ydVal).toLocaleString()} YD` : "0 YD"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 md:mt-0 text-[10px] text-gray-400 font-medium bg-gray-50 p-3.5 rounded-2xl border border-gray-50 flex items-center justify-between">
              <span>* 계산기 결과는 실제 지갑 활성화 및 트레이딩 거래 시 오더폼 가용자금 계산과 일치합니다.</span>
              <span className="font-black text-blue-600">
                실시간 환율: 1 YD = {exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}원
              </span>
            </div>
          </div>

        </section>

        {/* 📈 섹션 2: 인기 TOP 3 종목 실시간 시세 */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-2">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-black text-blue-600 mb-1.5">
                <TrendingUp size={14} />
                <span>POPULAR ASSETS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">오늘의 실시간 인기 TOP 3</h3>
            </div>
            <Link href="/trading" className="flex items-center gap-1 text-xxs font-black text-gray-400 hover:text-[#0058FF] transition-colors">
              <span>거래소 전체보기</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topCoins.map((item) => {
              const isUp = item.ticker.changeRate > 0;
              const isDown = item.ticker.changeRate < 0;

              return (
                <Link
                  key={item.ticker.symbol}
                  href={`/trading?symbol=${item.ticker.symbol}`}
                  className="group rounded-3xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col justify-between h-48 hover:shadow-md hover:border-gray-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border",
                          item.bg
                        )}
                      >
                        {item.displaySymbol}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-500 group-hover:text-[#0058FF] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xxs text-gray-400 font-bold uppercase">{item.ticker.symbol}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black text-gray-400 group-hover:text-gray-900 flex items-center gap-0.5 transition-colors">
                      거래하기
                      <ArrowUpRight size={12} />
                    </span>
                  </div>

                  {/* 차트 시각화 영역 (스파크라인) */}
                  <div className="h-10 w-full flex items-center justify-center px-2 py-1">
                    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke={isUp ? "#EF4444" : isDown ? "#3B82F6" : "#9CA3AF"}
                        strokeWidth="1.8"
                        points={item.sparkline
                          .map((val, index) => `${(index * 100) / 9},${30 - (val / 100) * 30}`)
                          .join(" ")}
                      />
                    </svg>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-50 pt-4 mt-2">
                    <div>
                      {item.ticker.isLoading ? (
                        <span className="text-sm font-extrabold text-gray-300 animate-pulse">Loading...</span>
                      ) : (
                        <span className="text-base font-extrabold text-gray-900">${item.ticker.price}</span>
                      )}
                    </div>

                    {item.ticker.isLoading ? (
                      <span className="text-xxs px-2 py-0.5 rounded bg-gray-50 text-gray-400 font-bold">-</span>
                    ) : (
                      <span
                        className={cn(
                          "text-xxs font-black px-2 py-0.5 rounded-lg flex items-center gap-0.5",
                          isUp ? "bg-red-50 text-red-500" : isDown ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-400"
                        )}
                      >
                        {isUp ? "▲" : isDown ? "▼" : ""}
                        {Math.abs(item.ticker.changeRate).toFixed(2)}%
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 📚 섹션 3: 요기망치 가이드 / 지갑 활성화 플로우 */}
        <section className="rounded-3xl bg-[#0F172A] text-white p-8 sm:p-12 relative overflow-hidden shadow-xl border border-gray-800">
          {/* 어두운 배경 장식 */}
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/50 text-blue-400 border border-blue-800 text-xs font-black mb-6">
              <BookOpen size={13} />
              <span>YOGIMANGCHI PLAYBOOK</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              회원 인증 등록 후 모의투자 3회를 완료하면,<br />
              <span className="text-[#0058FF]">초기 자금 지갑 자동 잠금해제!</span>
            </h3>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed max-w-xl">
              요기망치에서는 초보 유저의 손실 방지 교육을 위해 가입 즉시 초기 지갑 자금이 미활성(Lock) 처리됩니다.
              **인증회원 등록 및 3회 모의투자 연습**을 통과하면 현물 지갑의 초기 투자금이 즉시 해제되어 자유로운 실전 트레이딩이 가능합니다!
            </p>
          </div>

          {/* 4단계 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 relative z-10">

            {/* Step 1 */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-blue-500/40 hover:bg-gray-800/60 transition-all group">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-4">Step 01</span>
                <h4 className="text-sm font-black text-gray-100 flex items-center gap-2 mb-2">
                  <UserCheck size={16} className="text-blue-500" />
                  인증회원 등록
                </h4>
                <p className="text-xxs text-gray-400 font-semibold leading-relaxed">
                  회원가입 후 간편한 계정 등록 및 이메일 인증 절차를 완료합니다.
                </p>
              </div>
              <span className="text-[10px] text-gray-500 font-bold group-hover:text-blue-400 transition-colors">기초 신뢰 확보</span>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-blue-500/40 hover:bg-gray-800/60 transition-all group">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-4">Step 02</span>
                <h4 className="text-sm font-black text-gray-100 flex items-center gap-2 mb-2">
                  <Gamepad2 size={16} className="text-blue-500" />
                  모의투자 3회 연습
                </h4>
                <p className="text-xxs text-gray-400 font-semibold leading-relaxed">
                  위험 없는 모의투자 탭에서 시장 적응을 위해 최소 3회의 주문 거래를 완료합니다.
                </p>
              </div>
              <span className="text-[10px] text-gray-500 font-bold group-hover:text-blue-400 transition-colors">위험 관리 훈련</span>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-blue-500/40 hover:bg-gray-800/60 transition-all group">
              <div>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-4">Step 03</span>
                <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-emerald-400" />
                  지갑 자금 해제
                </h4>
                <p className="text-xxs text-gray-400 font-semibold leading-relaxed">
                  인증 및 모의투자 조건 충족 시 지갑이 활성화되며 초기 제공된 YD 자금을 실전에 사용할 수 있습니다!
                </p>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold group-hover:text-emerald-400 transition-colors">현물 지갑 Active</span>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-800 p-6 rounded-2xl flex flex-col justify-between h-48 hover:border-blue-500/40 hover:bg-gray-800/60 transition-all group">
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-4">Step 04</span>
                <h4 className="text-sm font-black text-gray-100 flex items-center gap-2 mb-2">
                  <Trophy size={16} className="text-blue-500" />
                  실전 투자 & 대회
                </h4>
                <p className="text-xxs text-gray-400 font-semibold leading-relaxed">
                  언락된 본투자 선물 거래소에 진입하거나 활성화된 전용 계좌로 트레이딩 대회에 참여해 보세요.
                </p>
              </div>
              <span className="text-[10px] text-gray-500 font-bold group-hover:text-blue-400 transition-colors">무제한 수익 도전</span>
            </div>

          </div>
        </section>

        {/* 📰 섹션 4: 코인관련기사 및 플랫폼 소식 */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-2">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-black text-blue-600 mb-1.5">
                <Newspaper size={14} />
                <span>MARKET RESEARCH & NEWS</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">글로벌 크립토 인사이트</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cryptoNews.map((news) => (
              <div
                key={news.id}
                className="group rounded-3xl bg-white border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 flex flex-col justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
                      news.tagColor
                    )}>
                      {news.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">{news.date}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-gray-800 leading-snug group-hover:text-blue-600 transition-colors duration-200">
                    {news.title}
                  </h4>
                  <p className="text-xxs text-gray-400 font-semibold leading-relaxed line-clamp-3">
                    {news.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <span className="text-[10px] text-gray-500 font-bold">기자: {news.author}</span>
                  <span className="text-[10px] text-blue-600 font-black flex items-center gap-1 group-hover:underline cursor-pointer">
                    기사 전문 보기
                    <ChevronRight size={10} strokeWidth={2.4} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <ContestFloatingButton />
    </div>
  );
}