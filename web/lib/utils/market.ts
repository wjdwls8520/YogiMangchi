export type MarketType = "spot" | "futures";

export const getMarketLabel = (marketType: MarketType) => {
  return marketType === "spot" ? "현물" : "선물";
};

export const getMarketSymbolsApiUrl = (marketType: MarketType) => {
  return marketType === "spot"
    ? "http://localhost:8080/api/v1/market/spot/symbols"
    : "http://localhost:8080/api/v1/market/futures/symbols";
};

export const getBinanceWsBaseUrl = (marketType: MarketType) => {
  return marketType === "spot"
    ? "wss://stream.binance.com:9443"
    : "wss://fstream.binance.com";
};

/**
 * 바이낸스 웹소켓 URL을 생성합니다.
 * 2026년 4월 변경된 선물 거래소의 Public/Market 분리 정책을 자동으로 반영합니다.
 */
export const getBinanceWsUrl = ({
  marketType,
  stream,
  isCombined = false,
}: {
  marketType: MarketType;
  stream: string;
  isCombined?: boolean;
}) => {
  const baseUrl = getBinanceWsBaseUrl(marketType);

  if (marketType === "spot") {
    return isCombined
      ? `${baseUrl}/stream?streams=${stream}`
      : `${baseUrl}/ws/${stream}`;
  }

  // 선물(Futures)의 경우 데이터 종류에 따라 경로가 다름
  // - Public: @depth (호가창)
  // - Market: @kline, @ticker, @trade, @aggTrade 등
  const isPublic = stream.includes("@depth");
  const category = isPublic ? "public" : "market";

  return isCombined
    ? `${baseUrl}/${category}/stream?streams=${stream}`
    : `${baseUrl}/${category}/ws/${stream}`;
};

export const getBinanceKlineApiUrl = ({
  marketType,
  symbol,
  timeframe,
  limit = 1000,
  endTime,
}: {
  marketType: MarketType;
  symbol: string;
  timeframe: string;
  limit?: number;
  endTime?: number;
}) => {
  const baseUrl =
    marketType === "spot"
      ? "https://api.binance.com/api/v3/klines"
      : "https://fapi.binance.com/fapi/v1/klines";

  const params = new URLSearchParams();
  params.set("symbol", symbol);
  params.set("interval", timeframe);
  params.set("limit", String(limit));

  if (typeof endTime === "number") {
    params.set("endTime", String(endTime));
  }

  return `${baseUrl}?${params.toString()}`;
};

export const getBinance24hrTickerApiUrl = (marketType: MarketType) => {
  return marketType === "spot"
    ? "https://api.binance.com/api/v3/ticker/24hr"
    : "https://fapi.binance.com/fapi/v1/ticker/24hr";
};

export const getBinanceRecentTradesApiUrl = ({
  marketType,
  symbol,
  limit = 20,
}: {
  marketType: MarketType;
  symbol: string;
  limit?: number;
}) => {
  const baseUrl =
    marketType === "spot"
      ? "https://api.binance.com/api/v3/trades"
      : "https://fapi.binance.com/fapi/v1/trades";

  return `${baseUrl}?symbol=${symbol}&limit=${limit}`;
};
