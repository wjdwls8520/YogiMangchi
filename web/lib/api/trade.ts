import { fetchClient } from "./client";

// 거래 조회/주문에 사용하는 지갑 타입
export type AssetType = "MOCK" | "TRADE_SPOT" | "TRADE_FUTURE" | "CONTEST";

// 매수/매도 방향
export type TradeSide = "BUY" | "SELL";

// 주문 상태값
export type OrderStatus =
  | "PENDING"
  | "PARTIALLY_FILLED"
  | "COMPLETED"
  | "CANCELED";

// 시장가 주문 요청 파라미터
export interface MarketOrderParams {
  symbol: string;
  assetType: AssetType;
  side: TradeSide;
  quantity?: number;
  totalAmount?: number;
}

// 지정가 주문 요청 파라미터
export interface LimitOrderParams {
  symbol: string;
  assetType: AssetType;
  side: TradeSide;
  price: number;
  quantity: number;
}

// 주문/거래내역 조회용 공통 필터
export interface TradeListFilters {
  assetType: AssetType;
  cursorId?: number | null;
  size?: number;
  symbol?: string;
  side?: TradeSide;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

// 커서 기반 목록 응답 구조
export interface CursorResponse<T> {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
}

// 주문내역 1건 타입
export interface OrderItem {
  orderId: number;
  assetType: AssetType;
  symbol: string;
  displayNameKr: string;
  orderType: string;
  side: TradeSide;
  orderStatus: OrderStatus;
  orderPrice: number | null;
  orderQuantity: number | null;
  orderAmount: number | null;
  filledQuantity: number | null;
  remainingQuantity: number | null;
  avgFilledPrice: number | null;
  executedAmount: number | null;
  totalFee: number | null;
  orderedAt: string;
  executedAt: string | null;
  canceledAt: string | null;
}

// 거래내역 1건 타입
export interface TradeHistoryItem {
  tradeId: number;
  orderId: number;
  assetType: AssetType;
  symbol: string;
  displayNameKr: string;
  side: TradeSide;
  orderType: string;
  orderStatus: OrderStatus;
  price: number;
  quantity: number;
  totalAmount: number;
  fee: number;
  realizedProfit: number | null;
  orderedAt: string;
  executedAt: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const parseArrayResponse = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.data)) {
    return payload.data as T[];
  }

  if (Array.isArray(payload.content)) {
    return payload.content as T[];
  }

  return [];
};

const getSuccessMessage = (payload: unknown) => {
  if (typeof payload === "string") {
    return payload;
  }

  return extractApiMessage(payload) || "OK";
};

// 모의투자 주문/조회는 별도 mock/spot 경로를 사용하고, 실전 현물은 real/spot 경로를 사용한다.
const getTradeApiPath = (
  assetType: AssetType,
  type: "market" | "limit" | "orders" | "openOrders" | "histories" | "cancel",
  orderId?: number
) => {
  if (assetType === "MOCK") {
    if (type === "market") return "mock/spot/order/market";
    if (type === "limit") return "mock/spot/order/limit";
    if (type === "orders") return "mock/spot/orders";
    if (type === "openOrders") return "mock/spot/orders/open";
    if (type === "histories") return "mock/spot/histories";
    return `mock/spot/orders/${orderId}/cancel`;
  }

  if (type === "market") return "real/spot/order/market";
  if (type === "limit") return "real/spot/order/limit";
  if (type === "orders") return "real/spot/orders";
  if (type === "openOrders") return "real/spot/orders/open";
  if (type === "histories") return "real/spot/histories";
  return `real/spot/orders/${orderId}/cancel`;
};

// 시장가 주문 실행
export async function placeMarketOrder(
  params: MarketOrderParams
): Promise<string> {
  const payload = await fetchClient(getTradeApiPath(params.assetType, "market"), {
    method: "POST",
    body: params as unknown as BodyInit,
  });

  return getSuccessMessage(payload);
}

// 지정가 주문 등록
export async function placeLimitOrder(
  params: LimitOrderParams
): Promise<string> {
  const payload = await fetchClient(getTradeApiPath(params.assetType, "limit"), {
    method: "POST",
    body: params as unknown as BodyInit,
  });

  return getSuccessMessage(payload);
}

// 주문내역 조회
export async function fetchOrders(
  filters: TradeListFilters
): Promise<CursorResponse<OrderItem>> {
  const payload = await fetchClient(
    `${getTradeApiPath(filters.assetType, "orders")}?${buildTradeQueryParams(filters)}`
  );

  return parseCursorResponse<OrderItem>(payload);
}

// 미체결 주문 조회
export async function fetchOpenOrders(
  filters: Omit<TradeListFilters, "status" | "startDate" | "endDate">
): Promise<OrderItem[]> {
  const payload = await fetchClient(
    `${getTradeApiPath(filters.assetType, "openOrders")}?${buildTradeQueryParams(filters)}`
  );

  return parseArrayResponse<OrderItem>(payload);
}

// 거래내역 조회
export async function fetchTradeHistories(
  filters: TradeListFilters
): Promise<CursorResponse<TradeHistoryItem>> {
  const payload = await fetchClient(
    `${getTradeApiPath(filters.assetType, "histories")}?${buildTradeQueryParams(filters)}`
  );

  return parseCursorResponse<TradeHistoryItem>(payload);
}

// 주문 취소
export async function cancelOrder(
  orderId: number,
  assetType: AssetType = "MOCK"
): Promise<string> {
  const payload = await fetchClient(getTradeApiPath(assetType, "cancel", orderId), {
    method: "PUT",
  });

  return getSuccessMessage(payload);
}

// 필터 객체를 query string으로 변환
export function buildTradeQueryParams(filters: TradeListFilters): string {
  const params = new URLSearchParams();

  params.set("assetType", filters.assetType);

  if (typeof filters.cursorId === "number") {
    params.set("cursorId", String(filters.cursorId));
  }

  if (typeof filters.size === "number") {
    params.set("size", String(filters.size));
  }

  if (filters.symbol) {
    params.set("symbol", filters.symbol);
  }

  if (filters.side) {
    params.set("side", filters.side);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  return params.toString();
}

// 서버 응답 payload에서 message/error를 안전하게 추출
export function extractApiMessage(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (!isRecord(payload)) {
    return "";
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  const data = isRecord(payload.data) ? payload.data : null;

  if (data && typeof data.message === "string") {
    return data.message;
  }

  return "";
}

// 서버 커서 응답을 공통 구조로 변환
export function parseCursorResponse<T>(
  payload: unknown
): CursorResponse<T> {
  if (!isRecord(payload)) {
    return {
      content: [],
      nextCursorId: null,
      hasNext: false,
    };
  }

  const source =
    Array.isArray(payload.content) ||
    "nextCursorId" in payload ||
    "hasNext" in payload
      ? payload
      : isRecord(payload.data)
      ? payload.data
      : null;

  if (!source || !isRecord(source)) {
    return {
      content: [],
      nextCursorId: null,
      hasNext: false,
    };
  }

  return {
    content: Array.isArray(source.content) ? (source.content as T[]) : [],
    nextCursorId:
      typeof source.nextCursorId === "number" ? source.nextCursorId : null,
    hasNext: Boolean(source.hasNext),
  };
}
