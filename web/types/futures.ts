export type FuturesPositionSide = "LONG" | "SHORT";

export type FuturesPositionAction = "OPEN" | "CLOSE";

export type FuturesOrderType = "MARKET" | "LIMIT";

export type FuturesOrderStatus =
  | "PENDING"
  | "PARTIALLY_FILLED"
  | "COMPLETED"
  | "CANCELED";

export type FuturesCursorResponse<T> = {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
};

export type ContestFuturesWalletStatus = {
  walletId: number | null;
  seedMoney: number;
  currentMoney: number;
  marginInUse: number;
  status: string;
  expiredAt: string | null;
  retryCount: number;
};

export type FuturesLeverageInfo = {
  symbol: string;
  positionSide: FuturesPositionSide;
  leverage: number;
  maxLeverage: number;
  availableOrderNotionalAmount: number;
};

export type FuturesPositionItem = {
  positionId: number;
  symbol: string;
  positionSide: FuturesPositionSide;
  positionStatus: "OPEN" | "CLOSE";
  filledQuantity: number;
  entryPrice: number;
  totalMargin: number;
  leverage: number;
  notionalAmount: number;
  liquidationPrice: number;
  realizedPnl: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FuturesOrderItem = {
  orderId: number;
  symbol: string;
  displayNameKr: string | null;
  orderType: FuturesOrderType;
  orderStatus: FuturesOrderStatus;
  positionSide: FuturesPositionSide;
  positionAction: FuturesPositionAction;
  orderPrice: number | null;
  executedPrice: number | null;
  orderQuantity: number | null;
  filledQuantity: number | null;
  remainingQuantity: number | null;
  orderMargin: number | null;
  notionalAmount: number | null;
  totalFee: number | null;
  createdAt: string | null;
  executedAt: string | null;
};

export type FuturesOrderResult = {
  orderId: number;
  symbol: string;
  positionSide: FuturesPositionSide;
  positionAction: FuturesPositionAction;
  orderType: FuturesOrderType;
  orderStatus: FuturesOrderStatus;
  executedPrice: number | null;
  executedQuantity: number | null;
  orderMargin: number | null;
  notionalAmount: number | null;
  totalFee: number | null;
  executedAt: string | null;
};

export type FuturesPositionResult = {
  positionId: number;
  symbol: string;
  positionSide: FuturesPositionSide;
  positionStatus: "OPEN" | "CLOSE";
  filledQuantity: number | null;
  entryPrice: number | null;
  totalMargin: number | null;
  leverage: number | null;
  notionalAmount: number | null;
  liquidationPrice: number | null;
  realizedPnl: number | null;
  isNewPosition: boolean;
};

export type FuturesMarketOrderResponse = {
  order: FuturesOrderResult | null;
  position: FuturesPositionResult | null;
  thisCloseRealizedPnl: number | null;
};

export type FuturesLimitOrderResponse = {
  orderId: number;
  symbol: string;
  positionSide: FuturesPositionSide;
  positionAction: FuturesPositionAction;
  orderStatus: FuturesOrderStatus;
  orderPrice: number;
  orderQuantity: number;
  orderMargin: number;
  notionalAmount: number;
  totalFee: number;
  createdAt: string | null;
};

export type ContestFuturesOpenOrderParams = {
  symbol: string;
  positionSide: FuturesPositionSide;
  orderQuantity: number;
};

export type ContestFuturesLimitOpenOrderParams =
  ContestFuturesOpenOrderParams & {
    orderPrice: number;
  };

export type ContestFuturesCloseOrderParams = {
  positionId: number;
  closeQuantity: number;
};

export type ContestFuturesLimitCloseOrderParams =
  ContestFuturesCloseOrderParams & {
    orderPrice: number;
  };

export type ContestFuturesLeverageParams = {
  symbol: string;
  positionSide: FuturesPositionSide;
  leverage: number;
};

export type ContestFuturesOrderFilters = {
  cursorId?: number | null;
  size?: number;
  symbol?: string;
  positionSide?: FuturesPositionSide | "";
  positionAction?: FuturesPositionAction | "";
  orderStatus?: FuturesOrderStatus | "";
  startDate?: string;
  endDate?: string;
};

export type ContestFuturesClosedPositionFilters = {
  cursorId?: number | null;
  size?: number;
  symbol?: string;
};
