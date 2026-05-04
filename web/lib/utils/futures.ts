import type {
  ContestFuturesWalletStatus,
  FuturesOrderStatus,
  FuturesPositionAction,
  FuturesPositionSide,
} from "@/types/futures";

export const formatFuturesPositionSide = (positionSide?: FuturesPositionSide | null) => {
  if (positionSide === "LONG") {
    return "LONG";
  }

  if (positionSide === "SHORT") {
    return "SHORT";
  }

  return "-";
};

export const formatFuturesPositionAction = (
  positionAction?: FuturesPositionAction | null
) => {
  if (positionAction === "OPEN") {
    return "진입";
  }

  if (positionAction === "CLOSE") {
    return "청산";
  }

  return "-";
};

export const formatFuturesOrderStatus = (orderStatus?: FuturesOrderStatus | null) => {
  if (orderStatus === "PENDING") {
    return "대기중";
  }

  if (orderStatus === "PARTIALLY_FILLED") {
    return "부분체결";
  }

  if (orderStatus === "COMPLETED") {
    return "체결완료";
  }

  if (orderStatus === "CANCELED") {
    return "취소";
  }

  return "-";
};

export const formatFuturesOrderType = (orderType?: string | null) => {
  if (orderType === "MARKET") {
    return "시장가";
  }

  if (orderType === "LIMIT") {
    return "지정가";
  }

  return "-";
};

export const getFuturesPositionTone = (positionSide?: FuturesPositionSide | null) => {
  if (positionSide === "LONG") {
    return {
      textClassName: "text-trade-buy",
      badgeClassName:
        "bg-red-50 text-trade-buy border border-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
    };
  }

  if (positionSide === "SHORT") {
    return {
      textClassName: "text-trade-sell",
      badgeClassName:
        "bg-blue-50 text-trade-sell border border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    };
  }

  return {
    textClassName: "text-gray-500 dark:text-gray-400",
    badgeClassName:
      "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-zinc-800 dark:text-gray-400 dark:border-zinc-700",
  };
};

export const getContestFuturesWalletStatusLabel = (
  status?: ContestFuturesWalletStatus["status"]
) => {
  if (!status) {
    return "상태 확인 중";
  }

  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return "활성";
  }

  if (normalizedStatus === "EXPIRED") {
    return "만료";
  }

  if (normalizedStatus === "INACTIVE") {
    return "비활성";
  }

  return status;
};
