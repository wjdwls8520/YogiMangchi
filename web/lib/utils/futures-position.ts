export type FuturesPositionLike = {
  symbol?: string | null;
  positionSide?: string | null;
  position_side?: string | null;
  leverage?: number | string | null;
  quantity?: number | string | null;
  filledQuantity?: number | string | null;
  filled_quantity?: number | string | null;
  entryPrice?: number | string | null;
  entry_price?: number | string | null;
  currentPrice?: number | string | null;
  current_price?: number | string | null;
  margin?: number | string | null;
  totalMargin?: number | string | null;
  total_margin?: number | string | null;
  liquidationPrice?: number | string | null;
  liquidation_price?: number | string | null;
  unrealizedPnl?: number | string | null;
  unrealized_pnl?: number | string | null;
  roi?: number | string | null;
  realizedPnl?: number | string | null;
  realized_pnl?: number | string | null;
};

export type FuturesPositionMetrics = {
  symbol: string;
  positionSide: "LONG" | "SHORT";
  leverage: number;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  margin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  roi: number;
  realizedPnl: number | null;
};

const toOptionalNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const toNumber = (
  value: number | string | null | undefined,
  fallbackValue = 0
) => {
  return toOptionalNumber(value) ?? fallbackValue;
};

const normalizePositionSide = (
  value: string | null | undefined
): "LONG" | "SHORT" => {
  return value === "SHORT" ? "SHORT" : "LONG";
};

export const getFuturesPositionMetrics = (
  position: FuturesPositionLike,
  livePrice?: number | null
): FuturesPositionMetrics => {
  const symbol = position.symbol ?? "";
  const positionSide = normalizePositionSide(
    position.positionSide ?? position.position_side
  );
  const quantity = toNumber(
    position.quantity ?? position.filledQuantity ?? position.filled_quantity
  );
  const entryPrice = toNumber(position.entryPrice ?? position.entry_price);
  const liveCurrentPrice = toOptionalNumber(livePrice);
  const apiCurrentPrice = toOptionalNumber(
    position.currentPrice ?? position.current_price
  );
  const currentPrice = liveCurrentPrice ?? apiCurrentPrice ?? entryPrice;
  const margin = toNumber(
    position.margin ?? position.totalMargin ?? position.total_margin
  );
  const liquidationPrice = toNumber(
    position.liquidationPrice ?? position.liquidation_price
  );
  const apiUnrealizedPnl = toOptionalNumber(
    position.unrealizedPnl ?? position.unrealized_pnl
  );
  const apiRoi = toOptionalNumber(position.roi);
  const canCalculatePnl =
    currentPrice > 0 && entryPrice > 0 && quantity > 0;
  const calculatedUnrealizedPnl = canCalculatePnl
    ? positionSide === "LONG"
      ? (currentPrice - entryPrice) * quantity
      : (entryPrice - currentPrice) * quantity
    : null;
  const shouldUseCalculatedValue =
    liveCurrentPrice !== null || apiUnrealizedPnl === null;
  const unrealizedPnl =
    shouldUseCalculatedValue && calculatedUnrealizedPnl !== null
      ? calculatedUnrealizedPnl
      : apiUnrealizedPnl ?? calculatedUnrealizedPnl ?? 0;
  const calculatedRoi = margin > 0 ? (unrealizedPnl / margin) * 100 : 0;
  const roi =
    liveCurrentPrice !== null || apiRoi === null ? calculatedRoi : apiRoi;
  const leverage = toNumber(position.leverage, 1);
  const realizedPnl = toOptionalNumber(
    position.realizedPnl ?? position.realized_pnl
  );

  return {
    symbol,
    positionSide,
    leverage,
    quantity,
    entryPrice,
    currentPrice,
    margin,
    liquidationPrice,
    unrealizedPnl,
    roi,
    realizedPnl,
  };
};
