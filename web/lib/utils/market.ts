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
