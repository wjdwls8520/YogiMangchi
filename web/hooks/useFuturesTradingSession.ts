"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRealFuturesWalletBalance,
  getFuturesOpenPositions,
  getFuturesOrders,
  getFuturesLeverage,
  updateFuturesLeverage,
  placeFuturesOpenMarketOrder,
  placeFuturesOpenLimitOrder,
  placeFuturesCloseMarketOrder,
  placeFuturesCloseLimitOrder,
  cancelFuturesLimitOrder,
} from "@/lib/api/futures";
import {
  getNotificationSseBridgeEventName,
} from "@/lib/utils/notification-sse";
import { useTickerStore } from "@/stores/useTickerStore";
import type {
  ContestFuturesLimitOpenOrderParams,
  ContestFuturesLimitCloseOrderParams,
  ContestFuturesOpenOrderParams,
  ContestFuturesWalletStatus,
  FuturesLeverageInfo,
  FuturesPositionItem,
  FuturesPositionSide,
} from "@/types/futures";

/**
 * 본투자 선물 거래 세션을 관리하는 훅
 */
export function useFuturesTradingSession() {
  const selectedCoin = useTickerStore((s) => s.selectedCoin);

  // 1. 상태 정의
  const [walletStatus, setWalletStatus] = useState<ContestFuturesWalletStatus>({
    walletId: 0,
    seedMoney: 0,
    currentMoney: 0,
    marginInUse: 0,
    status: "ACTIVE",
    expiredAt: null,
    retryCount: 0,
  });

  const [openPositions, setOpenPositions] = useState<FuturesPositionItem[]>([]);
  const [leverageInfoByKey, setLeverageInfoByKey] = useState<Record<string, FuturesLeverageInfo>>({});
  const [pendingCloseQuantityByPositionKey, setPendingCloseQuantityByPositionKey] = useState<Record<string, number>>({});

  const [isLoadingLeverage, setIsLoadingLeverage] = useState(false);
  const [isUpdatingLeverage, setIsUpdatingLeverage] = useState(false);
  const [updatingLeverageKey, setUpdatingLeverageKey] = useState<string | null>(null);
  const [leverageErrorMessage, setLeverageErrorMessage] = useState("");

  const [isSubmittingOpenOrder, setIsSubmittingOpenOrder] = useState(false);
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);

  const [selectedPositionSide, setSelectedPositionSide] = useState<FuturesPositionSide>("LONG");
  const [activityVersion, setActivityVersion] = useState(0); // 포지션/주문 목록 갱신용
  const [isRefreshingBase, setIsRefreshingBase] = useState(false);

  // 2. 기초 데이터 로드 (지갑, 포지션, 대기수량 등)
  // TODO: 실제 본투자 지갑 상태 조회 API가 필요할 수 있음. 현재는 주문 내역 등을 통해 간접 로드하거나 기본값 사용.
  const refreshBaseData = useCallback(async () => {
    setIsRefreshingBase(true);
    try {
      const [balance, positions, pendingOrders] = await Promise.all([
        getRealFuturesWalletBalance(),
        getFuturesOpenPositions(),
        getFuturesOrders({ orderStatus: "PENDING" }),
      ]);

      setWalletStatus((prev) => ({
        ...prev,
        seedMoney: balance,
        currentMoney: balance,
      }));

      setOpenPositions(positions);

      // 대기 중인 청산 주문 수량 계산
      const pendingCloseQtyMap: Record<string, number> = {};
      pendingOrders.content.forEach((order) => {
        if (order.positionAction === "CLOSE") {
          const key = `${order.symbol}-${order.positionSide}`;
          pendingCloseQtyMap[key] = (pendingCloseQtyMap[key] || 0) + order.remainingQuantity;
        }
      });
      setPendingCloseQuantityByPositionKey(pendingCloseQtyMap);

      setActivityVersion((v) => v + 1);
    } catch (error: any) {
      // 지갑이 없는 경우(404)나 권한이 없는 경우(403)는 에러 로그를 남기지 않음
      if (error?.status === 404 || error?.status === 403 || error?.message?.includes("지갑이 없습니다")) {
        // Quietly skip
        return;
      }
      console.error("Failed to refresh futures base data:", error);
    } finally {
      setIsRefreshingBase(false);
    }
  }, []);

  // 3. 레버리지 정보 로드
  const loadLeverage = useCallback(async (symbol: string, side: FuturesPositionSide) => {
    const key = `${symbol}-${side}`;
    setIsLoadingLeverage(true);
    setLeverageErrorMessage("");
    try {
      const info = await getFuturesLeverage(symbol, side);
      setLeverageInfoByKey((prev) => ({ ...prev, [key]: info }));
    } catch (error: any) {
      if (error?.status === 404 || error?.status === 403 || error?.message?.includes("지갑이 없습니다")) {
        return;
      }
      setLeverageErrorMessage(error instanceof Error ? error.message : "레버리지 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingLeverage(false);
    }
  }, []);

  // 4. 레버리지 변경
  const updatePositionLeverage = useCallback(async (symbol: string, side: FuturesPositionSide, leverage: number) => {
    const key = `${symbol}-${side}`;
    setIsUpdatingLeverage(true);
    setUpdatingLeverageKey(key);
    try {
      const info = await updateFuturesLeverage({ symbol, positionSide: side, leverage });
      setLeverageInfoByKey((prev) => ({ ...prev, [key]: info }));
      await refreshBaseData();
      return info;
    } finally {
      setIsUpdatingLeverage(false);
      setUpdatingLeverageKey(null);
    }
  }, [refreshBaseData]);

  // 5. 주문 실행 함수들
  const submitOpenOrder = useCallback(async (params: ContestFuturesOpenOrderParams) => {
    setIsSubmittingOpenOrder(true);
    try {
      const res = await placeFuturesOpenMarketOrder(params);
      await refreshBaseData();
      return res;
    } finally {
      setIsSubmittingOpenOrder(false);
    }
  }, [refreshBaseData]);

  const submitLimitOpenOrder = useCallback(async (params: ContestFuturesLimitOpenOrderParams) => {
    setIsSubmittingOpenOrder(true);
    try {
      const res = await placeFuturesOpenLimitOrder(params);
      await refreshBaseData();
      return res;
    } finally {
      setIsSubmittingOpenOrder(false);
    }
  }, [refreshBaseData]);

  const submitCloseOrder = useCallback(async (params: { positionId: number; closeQuantity: number }) => {
    setClosingPositionId(params.positionId);
    try {
      const res = await placeFuturesCloseMarketOrder(params);
      await refreshBaseData();
      return res;
    } finally {
      setClosingPositionId(null);
    }
  }, [refreshBaseData]);

  const submitLimitCloseOrder = useCallback(async (params: ContestFuturesLimitCloseOrderParams) => {
    setClosingPositionId(params.positionId);
    try {
      const res = await placeFuturesCloseLimitOrder(params);
      await refreshBaseData();
      return res;
    } finally {
      setClosingPositionId(null);
    }
  }, [refreshBaseData]);

  const cancelLimitOrder = useCallback(async (orderId: number) => {
    setCancelingOrderId(orderId);
    try {
      await cancelFuturesLimitOrder(orderId);
      await refreshBaseData();
    } finally {
      setCancelingOrderId(null);
    }
  }, [refreshBaseData]);

  // 6. 초기화 및 선택 코인 변경 대응
  useEffect(() => {
    void refreshBaseData();
  }, [refreshBaseData]);

  // 6-1. SSE 체결 알림 수신 시 실시간 데이터 갱신
  useEffect(() => {
    const eventName = getNotificationSseBridgeEventName("NOTIFICATION_TRADE_ORDER_COMPLETED");

    const handleOrderCompleted = () => {
      console.log("Real-time Trade Completed! Refreshing data...");
      void refreshBaseData();
    };

    window.addEventListener(eventName, handleOrderCompleted);
    return () => window.removeEventListener(eventName, handleOrderCompleted);
  }, [refreshBaseData]);

  useEffect(() => {
    if (selectedCoin) {
      void loadLeverage(selectedCoin, "LONG");
      void loadLeverage(selectedCoin, "SHORT");
    }
  }, [selectedCoin, loadLeverage]);

  // 주기적 자동 갱신 (선택사항)
  useEffect(() => {
    const timer = setInterval(() => void refreshBaseData(), 10000); // 10초마다 갱신
    return () => clearInterval(timer);
  }, [refreshBaseData]);

  return {
    activityVersion,
    cancelingOrderId,
    cancelLimitOrder,
    closingPositionId,
    isLoadingLeverage,
    isRefreshingBase,
    isTradingEnabled: true, // 본투자는 항상 활성화 (상태에 따라 조정 가능)
    isSubmittingOpenOrder,
    isUpdatingLeverage,
    leverageErrorMessage,
    leverageInfo: leverageInfoByKey[`${selectedCoin}-${selectedPositionSide}`] || null,
    leverageInfoByKey,
    openPositions,
    pendingCloseQuantityByPositionKey,
    refreshBaseData,
    submitCloseOrder,
    submitLimitCloseOrder,
    submitLimitOpenOrder,
    submitOpenOrder,
    updatePositionLeverage,
    updatingLeverageKey,
    walletStatus,
    selectedPositionSide,
    setSelectedPositionSide,
  };
}
