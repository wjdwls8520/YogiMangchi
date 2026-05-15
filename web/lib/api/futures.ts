import { fetchClient } from "./client";
import type {
  FuturesClosedPositionFilters,
  FuturesCloseOrderParams,
  FuturesLeverageParams,
  FuturesLimitCloseOrderParams,
  FuturesLimitOpenOrderParams,
  FuturesOpenOrderParams,
  FuturesOrderFilters,
  FuturesClosedPositionFilters,
  FuturesOpenPositionFilters,
  FuturesWalletStatus,
  FuturesCursorResponse,
  FuturesLeverageInfo,
  FuturesLimitOrderResponse,
  FuturesMarketOrderResponse,
  FuturesOrderItem,
  FuturesPositionItem,
} from "@/types/futures";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const extractNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
};

const getResponseSource = (payload: unknown) => {
  if (!isRecord(payload)) {
    return null;
  }

  if (
    "content" in payload ||
    "nextCursorId" in payload ||
    "hasNext" in payload ||
    "walletId" in payload ||
    "seedMoney" in payload
  ) {
    return payload;
  }

  if (isRecord(payload.data)) {
    return payload.data;
  }

  return payload;
};

const parseCursorResponse = <T,>(payload: unknown) => {
  const source = getResponseSource(payload);

  if (!source || !isRecord(source)) {
    return {
      content: [],
      nextCursorId: null,
      hasNext: false,
    } satisfies FuturesCursorResponse<T>;
  }

  return {
    content: Array.isArray(source.content) ? (source.content as T[]) : [],
    nextCursorId: extractNumber(source.nextCursorId),
    hasNext: source.hasNext === true,
  } satisfies FuturesCursorResponse<T>;
};

const parseArrayResponse = <T,>(payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const source = getResponseSource(payload);

  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source as T[];
  }

  if (isRecord(source) && Array.isArray(source.content)) {
    return source.content as T[];
  }

  return [];
};

const parseObjectResponse = <T,>(payload: unknown, fallbackValue: T) => {
  const source = getResponseSource(payload);

  if (!source || !isRecord(source)) {
    return fallbackValue;
  }

  return source as T;
};

const buildFuturesQueryParams = (
  filters: FuturesOrderFilters | FuturesClosedPositionFilters | FuturesOpenPositionFilters
) => {
  const params = new URLSearchParams();

  if (typeof filters.cursorId === "number") {
    params.set("cursorId", String(filters.cursorId));
  }

  if (typeof filters.size === "number") {
    params.set("size", String(filters.size));
  }

  if ("positionSide" in filters && filters.positionSide) {
    params.set("positionSide", filters.positionSide);
  }

  if ("positionAction" in filters && filters.positionAction) {
    params.set("positionAction", filters.positionAction);
  }

  if ("orderStatus" in filters && filters.orderStatus) {
    params.set("orderStatus", filters.orderStatus);
  }

  if ("startDate" in filters && filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if ("endDate" in filters && filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  if (filters.symbol?.trim()) {
    params.set("symbol", filters.symbol.trim().toUpperCase());
  }

  return params.toString();
};

/* ────────────────── Real Investment Futures APIs ────────────────── */

export const getRealFuturesWalletBalance = async (): Promise<number> => {
  try {
    const payload = await fetchClient("real/assets/transferable?assetType=TRADE_FUTURE");
    if (payload && typeof payload === "object" && "transferableAmount" in payload) {
      return Number(payload.transferableAmount) || 0;
    }
  } catch {
    // quiet ignore
  }
  return 0;
};

export const getFuturesOpenPositions = async (
  filters: FuturesOpenPositionFilters = {}
) => {
  const query = buildFuturesQueryParams(filters);
  const suffix = query ? `?${query}` : "";
  const payload = await fetchClient(`futures/positions/open${suffix}`);
  return parseCursorResponse<FuturesPositionItem>(payload);
};

export const getFuturesClosedPositions = async (
  filters: FuturesClosedPositionFilters = {}
) => {
  const query = buildFuturesQueryParams(filters);
  const suffix = query ? `?${query}` : "";
  const payload = await fetchClient(`futures/positions/closed${suffix}`);
  return parseCursorResponse<FuturesPositionItem>(payload);
};

export const getFuturesOrders = async (
  filters: FuturesOrderFilters = {}
) => {
  const query = buildFuturesQueryParams(filters);
  const suffix = query ? `?${query}` : "";
  const payload = await fetchClient(`futures/orders${suffix}`);
  return parseCursorResponse<FuturesOrderItem>(payload);
};

export const getFuturesLeverage = async (
  symbol: string,
  positionSide: FuturesLeverageParams["positionSide"]
) => {
  const params = new URLSearchParams();
  params.set("symbol", symbol);
  params.set("positionSide", positionSide);

  const payload = await fetchClient(`futures/leverage?${params.toString()}`);

  return parseObjectResponse<FuturesLeverageInfo>(payload, {
    symbol,
    positionSide,
    leverage: 1,
    maxLeverage: 1,
    availableOrderNotionalAmount: 0,
  });
};

export const updateFuturesLeverage = async (
  params: FuturesLeverageParams
) => {
  const payload = await fetchClient(`futures/leverage`, {
    method: "PUT",
    body: params,
  });

  return parseObjectResponse<FuturesLeverageInfo>(payload, {
    symbol: params.symbol,
    positionSide: params.positionSide,
    leverage: params.leverage,
    maxLeverage: params.leverage,
    availableOrderNotionalAmount: 0,
  });
};

export const placeFuturesOpenMarketOrder = async (
  params: FuturesOpenOrderParams
) => {
  const payload = await fetchClient(`futures/order/market/open`, {
    method: "POST",
    body: params,
  });

  return parseObjectResponse<FuturesMarketOrderResponse>(payload, {
    order: null,
    position: null,
    thisCloseRealizedPnl: null,
  });
};

export const placeFuturesOpenLimitOrder = async (
  params: FuturesLimitOpenOrderParams
) => {
  const payload = await fetchClient(`futures/order/limit/open`, {
    method: "POST",
    body: params,
  });

  return parseObjectResponse<FuturesLimitOrderResponse>(payload, {
    orderId: 0,
    symbol: params.symbol,
    positionSide: params.positionSide,
    positionAction: "OPEN",
    orderStatus: "PENDING",
    orderPrice: params.orderPrice,
    orderQuantity: params.orderQuantity,
    orderMargin: 0,
    notionalAmount: 0,
    totalFee: 0,
    createdAt: null,
  });
};

export const placeFuturesCloseMarketOrder = async (
  params: FuturesCloseOrderParams
) => {
  const payload = await fetchClient(`futures/order/market/close`, {
    method: "POST",
    body: params,
  });

  return parseObjectResponse<FuturesMarketOrderResponse>(payload, {
    order: null,
    position: null,
    thisCloseRealizedPnl: null,
  });
};

export const placeFuturesCloseLimitOrder = async (
  params: FuturesLimitCloseOrderParams
) => {
  const payload = await fetchClient(`futures/order/limit/close`, {
    method: "POST",
    body: params,
  });

  return parseObjectResponse<FuturesLimitOrderResponse>(payload, {
    orderId: 0,
    symbol: "",
    positionSide: "LONG",
    positionAction: "CLOSE",
    orderStatus: "PENDING",
    orderPrice: params.orderPrice,
    orderQuantity: params.closeQuantity,
    orderMargin: 0,
    notionalAmount: 0,
    totalFee: 0,
    createdAt: null,
  });
};

export const cancelFuturesLimitOrder = async (orderId: number) => {
  await fetchClient(`futures/order/limit/${orderId}`, {
    method: "DELETE",
  });
};
