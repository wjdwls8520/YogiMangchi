export type MarketDisplayMeta = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
};

const findMarketMetaBySymbol = (
  symbol: string | null | undefined,
  marketSymbols: MarketDisplayMeta[]
) => {
  if (!symbol) {
    return null;
  }

  return marketSymbols.find((market) => market.symbol === symbol) ?? null;
};

export const getBaseAssetLabel = (
  symbol: string | null | undefined,
  marketSymbols: MarketDisplayMeta[]
) => {
  const marketMeta = findMarketMetaBySymbol(symbol, marketSymbols);

  return marketMeta?.baseAsset ?? symbol ?? "-";
};

export const getDisplaySymbolLabel = (
  symbol: string | null | undefined,
  marketSymbols: MarketDisplayMeta[]
) => {
  const marketMeta = findMarketMetaBySymbol(symbol, marketSymbols);

  if (marketMeta) {
    return `${marketMeta.baseAsset}${marketMeta.quoteAsset}`;
  }

  return symbol ?? "-";
};

export const getQuoteAssetLabel = (
  symbol: string | null | undefined,
  marketSymbols: MarketDisplayMeta[]
) => {
  const marketMeta = findMarketMetaBySymbol(symbol, marketSymbols);

  return marketMeta?.quoteAsset ?? "";
};

export const getDefaultQuoteAssetLabel = (marketSymbols: MarketDisplayMeta[]) => {
  return marketSymbols[0]?.quoteAsset ?? "";
};
