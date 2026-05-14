"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FetchClientError } from "@/lib/api/client";
import {
  cancelContestFuturesLimitOrder,
  getContestFuturesLeverage,
  getContestFuturesOpenPositions,
  getContestFuturesOrders,
  getFuturesWalletStatus,
  placeContestFuturesCloseLimitOrder,
  placeContestFuturesCloseMarketOrder,
  placeContestFuturesOpenLimitOrder,
  placeContestFuturesOpenMarketOrder,
  updateContestFuturesLeverage,
} from "@/lib/api/contest-futures";
import {
  getMyParticipatingContestSeasons,
  type ContestParticipationSeason,
} from "@/lib/api/contest";
import { useTickerStore } from "@/stores/useTickerStore";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import type {
  FuturesCloseOrderParams,
  FuturesLimitCloseOrderParams,
  FuturesLimitOpenOrderParams,
  FuturesOpenOrderParams,
  FuturesWalletStatus,
  FuturesLeverageInfo,
  FuturesPositionItem,
  FuturesPositionSide,
} from "@/types/futures";

const SEASON_SEARCH_PAGE_SIZE = 20;
const PENDING_ORDER_SUMMARY_PAGE_SIZE = 50;
const AUTO_REFRESH_INTERVAL_MS = 10000;
const FUTURES_POSITION_SIDES: FuturesPositionSide[] = ["LONG", "SHORT"];

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof FetchClientError) {
    return error.userMessage || fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

const getDefaultWalletStatus = (): FuturesWalletStatus => ({
  walletId: null,
  seedMoney: 0,
  currentMoney: 0,
  marginInUse: 0,
  status: "",
  expiredAt: null,
  retryCount: 0,
});

const getPendingCloseQuantityKey = ({
  symbol,
  positionSide,
}: {
  symbol: string;
  positionSide: string;
}) => `${symbol}-${positionSide}`;

const getLeverageInfoKey = ({
  symbol,
  positionSide,
}: {
  symbol: string;
  positionSide: FuturesPositionSide;
}) => `${symbol}-${positionSide}`;

export const useContestFuturesTradingSession = (contestSeasonId: number) => {
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const [selectedPositionSide, setSelectedPositionSide] =
    useState<FuturesPositionSide>("LONG");

  const [seasonInfo, setSeasonInfo] = useState<ContestParticipationSeason | null>(
    null
  );
  const [walletStatus, setWalletStatus] = useState<FuturesWalletStatus>(
    getDefaultWalletStatus()
  );
  const [openPositions, setOpenPositions] = useState<FuturesPositionItem[]>([]);
  const [leverageInfo, setLeverageInfo] = useState<FuturesLeverageInfo | null>(null);
  const [leverageInfoByKey, setLeverageInfoByKey] = useState<
    Record<string, FuturesLeverageInfo>
  >({});
  const [leverageErrorMessage, setLeverageErrorMessage] = useState("");
  const [pageErrorMessage, setPageErrorMessage] = useState("");
  const [pendingOpenOrderLockedAmount, setPendingOpenOrderLockedAmount] =
    useState(0);
  const [pendingCloseQuantityByPositionKey, setPendingCloseQuantityByPositionKey] =
    useState<Record<string, number>>({});
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshingBase, setIsRefreshingBase] = useState(false);
  const [isLoadingLeverage, setIsLoadingLeverage] = useState(false);
  const [isUpdatingLeverage, setIsUpdatingLeverage] = useState(false);
  const [isSubmittingOpenOrder, setIsSubmittingOpenOrder] = useState(false);
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
  const [updatingLeverageKey, setUpdatingLeverageKey] = useState<string | null>(
    null
  );
  const [activityVersion, setActivityVersion] = useState(0);
  const isBackgroundRefreshingRef = useRef(false);

  const findMyContestSeason = useCallback(async () => {
    let cursorId: number | undefined;
    let hasNext = true;

    while (hasNext) {
      const response = await getMyParticipatingContestSeasons({
        cursorId,
        size: SEASON_SEARCH_PAGE_SIZE,
      });
      const seasons = Array.isArray(response.content) ? response.content : [];
      const matchedSeason = seasons.find(
        (season) => season.seasonId === contestSeasonId
      );

      if (matchedSeason) {
        return matchedSeason;
      }

      cursorId = response.nextCursorId ?? undefined;
      hasNext = response.hasNext === true && response.nextCursorId !== null;
    }

    return null;
  }, [contestSeasonId]);

  const cacheLeverageInfo = useCallback((nextLeverageInfo: FuturesLeverageInfo) => {
    setLeverageInfoByKey((prev) => ({
      ...prev,
      [getLeverageInfoKey(nextLeverageInfo)]: nextLeverageInfo,
    }));
  }, []);

  const refreshLeverageInfosForPositions = useCallback(
    async (
      positions: Array<{
        symbol: string;
        positionSide: FuturesPositionSide;
      }>
    ) => {
      const uniquePositions = Array.from(
        new Map(
          positions
            .filter((position) => position.symbol && position.positionSide)
            .map((position) => [getLeverageInfoKey(position), position])
        ).values()
      );

      if (uniquePositions.length === 0) {
        return;
      }

      const results = await Promise.allSettled(
        uniquePositions.map((position) =>
          getContestFuturesLeverage(
            contestSeasonId,
            position.symbol,
            position.positionSide
          )
        )
      );

      setLeverageInfoByKey((prev) => {
        const next = { ...prev };

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            next[getLeverageInfoKey(result.value)] = result.value;
          }
        });

        return next;
      });
    },
    [contestSeasonId]
  );

  const refreshPendingOrderSummaries = useCallback(async () => {
    let cursorId: number | null | undefined;
    let hasNext = true;
    let nextPendingOpenOrderLockedAmount = 0;
    const nextPendingCloseQuantityByPositionKey: Record<string, number> = {};

    while (hasNext) {
      const response = await getContestFuturesOrders(contestSeasonId, {
        cursorId,
        orderStatus: "PENDING",
        size: PENDING_ORDER_SUMMARY_PAGE_SIZE,
      });

      for (const order of response.content) {
        if (order.positionAction === "OPEN") {
          nextPendingOpenOrderLockedAmount +=
            (order.orderMargin ?? 0) + (order.totalFee ?? 0);
        }

        if (order.positionAction === "CLOSE") {
          const key = getPendingCloseQuantityKey({
            symbol: order.symbol,
            positionSide: order.positionSide,
          });

          nextPendingCloseQuantityByPositionKey[key] =
            (nextPendingCloseQuantityByPositionKey[key] ?? 0) +
            (order.remainingQuantity ?? order.orderQuantity ?? 0);
        }
      }

      cursorId = response.nextCursorId;
      hasNext = response.hasNext === true && response.nextCursorId !== null;
    }

    setPendingOpenOrderLockedAmount(nextPendingOpenOrderLockedAmount);
    setPendingCloseQuantityByPositionKey(nextPendingCloseQuantityByPositionKey);
  }, [contestSeasonId]);

  const refreshWalletAndOpenPositions = useCallback(async () => {
    const [nextWalletStatus, nextOpenPositionsResponse] = await Promise.all([
      getFuturesWalletStatus(contestSeasonId),
      getContestFuturesOpenPositions(contestSeasonId, { size: 100 }),
    ]);

    const nextOpenPositions = nextOpenPositionsResponse.content;

    setWalletStatus(nextWalletStatus);
    setOpenPositions(nextOpenPositions);
    void refreshLeverageInfosForPositions(nextOpenPositions);

    return {
      nextWalletStatus,
      nextOpenPositions,
    };
  }, [contestSeasonId, refreshLeverageInfosForPositions]);

  const refreshSelectedCoinLeverage = useCallback(async ({
    silent = false,
  }: {
    silent?: boolean;
  } = {}) => {
    if (!selectedCoin) {
      setLeverageInfo(null);
      setLeverageErrorMessage("");
      return null;
    }

    if (!silent) {
      setIsLoadingLeverage(true);
      setLeverageErrorMessage("");
    }

    try {
      const results = await Promise.allSettled(
        FUTURES_POSITION_SIDES.map((positionSide) =>
          getContestFuturesLeverage(contestSeasonId, selectedCoin, positionSide)
        )
      );
      const fulfilledInfos = results
        .filter((result): result is PromiseFulfilledResult<FuturesLeverageInfo> =>
          result.status === "fulfilled"
        )
        .map((result) => result.value);
      const nextLeverageInfo =
        fulfilledInfos.find(
          (info) => info.positionSide === selectedPositionSide
        ) ?? null;

      if (!nextLeverageInfo) {
        throw new Error("레버리지 정보를 불러오지 못했습니다.");
      }

      setLeverageInfo(nextLeverageInfo);
      fulfilledInfos.forEach(cacheLeverageInfo);

      return nextLeverageInfo;
    } catch (error) {
      if (silent) {
        return null;
      }

      const nextErrorMessage = getErrorMessage(
        error,
        "레버리지 정보를 불러오지 못했습니다."
      );

      setLeverageInfo(null);
      setLeverageErrorMessage(nextErrorMessage);

      return null;
    } finally {
      if (!silent) {
        setIsLoadingLeverage(false);
      }
    }
  }, [
    cacheLeverageInfo,
    contestSeasonId,
    selectedCoin,
    selectedPositionSide,
  ]);

  const refreshBaseData = useCallback(async ({
    refreshActivity = true,
    showRefreshing = true,
    silentLeverage = false,
    surfaceError = true,
  }: {
    refreshActivity?: boolean;
    showRefreshing?: boolean;
    silentLeverage?: boolean;
    surfaceError?: boolean;
  } = {}) => {
    if (showRefreshing) {
      setIsRefreshingBase(true);
    }

    if (surfaceError) {
      setPageErrorMessage("");
    }

    try {
      await Promise.all([
        refreshWalletAndOpenPositions(),
        refreshPendingOrderSummaries(),
        refreshSelectedCoinLeverage({ silent: silentLeverage }),
      ]);

      if (refreshActivity) {
        setActivityVersion((prev) => prev + 1);
      }
    } catch (error) {
      if (surfaceError) {
        setPageErrorMessage(
          getErrorMessage(error, "대회 거래 정보를 불러오지 못했습니다.")
        );
      }
    } finally {
      if (showRefreshing) {
        setIsRefreshingBase(false);
      }
    }
  }, [
    refreshPendingOrderSummaries,
    refreshSelectedCoinLeverage,
    refreshWalletAndOpenPositions,
  ]);

  useEffect(() => {
    if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
      setPageErrorMessage("올바른 대회 시즌 정보가 아닙니다.");
      setIsBootstrapping(false);
      return;
    }

    let isActive = true;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setPageErrorMessage("");

      try {
        const [nextWalletStatus, nextOpenPositionsResponse, nextSeasonInfo] =
          await Promise.all([
            getFuturesWalletStatus(contestSeasonId),
            getContestFuturesOpenPositions(contestSeasonId, { size: 100 }),
            findMyContestSeason().catch(() => null),
            refreshPendingOrderSummaries().catch(() => undefined),
          ]);

        if (!isActive) {
          return;
        }

        const nextOpenPositions = nextOpenPositionsResponse.content;

        setWalletStatus(nextWalletStatus);
        setOpenPositions(nextOpenPositions);
        setSeasonInfo(nextSeasonInfo);
        void refreshLeverageInfosForPositions(nextOpenPositions);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPageErrorMessage(
          getErrorMessage(error, "대회 거래 정보를 불러오지 못했습니다.")
        );
        setWalletStatus(getDefaultWalletStatus());
        setOpenPositions([]);
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isActive = false;
    };
  }, [
    contestSeasonId,
    findMyContestSeason,
    refreshLeverageInfosForPositions,
    refreshPendingOrderSummaries,
  ]);

  useEffect(() => {
    if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
      return;
    }

    void refreshSelectedCoinLeverage();
  }, [contestSeasonId, refreshSelectedCoinLeverage, selectedCoin]);

  useEffect(() => {
    if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
      return;
    }

    const refreshVisiblePage = () => {
      if (document.visibilityState === "visible") {
        void refreshBaseData();
      }
    };

    window.addEventListener("focus", refreshVisiblePage);
    document.addEventListener("visibilitychange", refreshVisiblePage);

    return () => {
      window.removeEventListener("focus", refreshVisiblePage);
      document.removeEventListener("visibilitychange", refreshVisiblePage);
    };
  }, [contestSeasonId, refreshBaseData]);

  useEffect(() => {
    if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
      return;
    }

    const eventName = getNotificationSseBridgeEventName(
      "NOTIFICATION_CONTEST_ORDER_COMPLETED"
    );

    const handleOrderCompleted = () => {
      console.log("Real-time Contest Trade Completed! Refreshing data...");
      void refreshBaseData({ silentLeverage: true });
    };

    window.addEventListener(eventName, handleOrderCompleted);
    return () => window.removeEventListener(eventName, handleOrderCompleted);
  }, [contestSeasonId, refreshBaseData]);

  const updateLeverage = useCallback(
    async (leverage: number) => {
      if (!selectedCoin) {
        throw new Error("심볼을 선택한 뒤 레버리지를 설정해 주세요.");
      }

      const leverageKey = getLeverageInfoKey({
        symbol: selectedCoin,
        positionSide: selectedPositionSide,
      });

      setIsUpdatingLeverage(true);
      setUpdatingLeverageKey(leverageKey);

      try {
        const nextLeverageInfo = await updateContestFuturesLeverage(
          contestSeasonId,
          {
            symbol: selectedCoin,
            positionSide: selectedPositionSide,
            leverage,
          }
        );

        setLeverageInfo(nextLeverageInfo);
        cacheLeverageInfo(nextLeverageInfo);
        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
        ]);
        setActivityVersion((prev) => prev + 1);

        return nextLeverageInfo;
      } finally {
        setIsUpdatingLeverage(false);
        setUpdatingLeverageKey(null);
      }
    },
    [
      cacheLeverageInfo,
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshWalletAndOpenPositions,
      selectedCoin,
      selectedPositionSide,
    ]
  );

  const updatePositionLeverage = useCallback(
    async (
      symbol: string,
      positionSide: FuturesPositionSide,
      leverage: number
    ) => {
      const normalizedSymbol = symbol.trim().toUpperCase();

      if (!normalizedSymbol) {
        throw new Error("심볼을 확인한 뒤 레버리지를 설정해 주세요.");
      }

      const leverageKey = getLeverageInfoKey({
        symbol: normalizedSymbol,
        positionSide,
      });

      setUpdatingLeverageKey(leverageKey);

      try {
        const nextLeverageInfo = await updateContestFuturesLeverage(
          contestSeasonId,
          {
            symbol: normalizedSymbol,
            positionSide,
            leverage,
          }
        );

        cacheLeverageInfo(nextLeverageInfo);

        if (
          normalizedSymbol === selectedCoin &&
          positionSide === selectedPositionSide
        ) {
          setLeverageInfo(nextLeverageInfo);
        }

        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
        ]);
        setActivityVersion((prev) => prev + 1);

        return nextLeverageInfo;
      } finally {
        setUpdatingLeverageKey(null);
      }
    },
    [
      cacheLeverageInfo,
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshWalletAndOpenPositions,
      selectedCoin,
      selectedPositionSide,
    ]
  );

  const submitOpenOrder = useCallback(
    async (params: FuturesOpenOrderParams) => {
      setIsSubmittingOpenOrder(true);

      try {
        const response = await placeContestFuturesOpenMarketOrder(
          contestSeasonId,
          params
        );

        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
          refreshSelectedCoinLeverage(),
        ]);
        setActivityVersion((prev) => prev + 1);

        return response;
      } finally {
        setIsSubmittingOpenOrder(false);
      }
    },
    [
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshSelectedCoinLeverage,
      refreshWalletAndOpenPositions,
    ]
  );

  const submitLimitOpenOrder = useCallback(
    async (params: FuturesLimitOpenOrderParams) => {
      setIsSubmittingOpenOrder(true);

      try {
        const response = await placeContestFuturesOpenLimitOrder(
          contestSeasonId,
          params
        );

        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
          refreshSelectedCoinLeverage(),
        ]);
        setActivityVersion((prev) => prev + 1);

        return response;
      } finally {
        setIsSubmittingOpenOrder(false);
      }
    },
    [
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshSelectedCoinLeverage,
      refreshWalletAndOpenPositions,
    ]
  );

  const submitCloseOrder = useCallback(
    async (params: FuturesCloseOrderParams) => {
      setClosingPositionId(params.positionId);

      try {
        const response = await placeContestFuturesCloseMarketOrder(
          contestSeasonId,
          params
        );

        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
          refreshSelectedCoinLeverage(),
        ]);
        setActivityVersion((prev) => prev + 1);

        return response;
      } finally {
        setClosingPositionId(null);
      }
    },
    [
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshSelectedCoinLeverage,
      refreshWalletAndOpenPositions,
    ]
  );

  const submitLimitCloseOrder = useCallback(
    async (params: FuturesLimitCloseOrderParams) => {
      setClosingPositionId(params.positionId);

      try {
        const response = await placeContestFuturesCloseLimitOrder(
          contestSeasonId,
          params
        );

        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
          refreshSelectedCoinLeverage(),
        ]);
        setActivityVersion((prev) => prev + 1);

        return response;
      } finally {
        setClosingPositionId(null);
      }
    },
    [
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshSelectedCoinLeverage,
      refreshWalletAndOpenPositions,
    ]
  );

  const cancelLimitOrder = useCallback(
    async (orderId: number) => {
      setCancelingOrderId(orderId);

      try {
        await cancelContestFuturesLimitOrder(contestSeasonId, orderId);
        await Promise.all([
          refreshWalletAndOpenPositions(),
          refreshPendingOrderSummaries(),
          refreshSelectedCoinLeverage(),
        ]);
        setActivityVersion((prev) => prev + 1);
      } finally {
        setCancelingOrderId(null);
      }
    },
    [
      contestSeasonId,
      refreshPendingOrderSummaries,
      refreshSelectedCoinLeverage,
      refreshWalletAndOpenPositions,
    ]
  );

  const isSeasonLive = useMemo(() => {
    if (!seasonInfo) {
      return true;
    }

    return seasonInfo.isLive === true;
  }, [seasonInfo]);

  const isWalletExpired = walletStatus.status.toUpperCase() === "EXPIRED";
  const isTradingEnabled = isSeasonLive && !isWalletExpired;

  useEffect(() => {
    if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
      return;
    }

    if (!isTradingEnabled) {
      return;
    }

    const refreshInBackground = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (isBackgroundRefreshingRef.current) {
        return;
      }

      isBackgroundRefreshingRef.current = true;

      try {
        await refreshBaseData({
          showRefreshing: false,
          silentLeverage: true,
          surfaceError: false,
        });
      } finally {
        isBackgroundRefreshingRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshInBackground();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [contestSeasonId, isTradingEnabled, refreshBaseData]);

  // SSE 이벤트를 리스닝하여 주문 체결 시 즉시 데이터를 갱신합니다.
  useEffect(() => {
    if (!Number.isFinite(contestSeasonId) || contestSeasonId <= 0) {
      return;
    }

    const eventName = getNotificationSseBridgeEventName("NOTIFICATION_CONTEST_ORDER_COMPLETED");
    
    const handleOrderCompleted = () => {
      void refreshBaseData({
        showRefreshing: false,
        silentLeverage: true,
        surfaceError: false,
      });
    };

    window.addEventListener(eventName, handleOrderCompleted);

    return () => {
      window.removeEventListener(eventName, handleOrderCompleted);
    };
  }, [contestSeasonId, refreshBaseData]);

  return {
    activityVersion,
    cancelingOrderId,
    closingPositionId,
    isBootstrapping,
    isLoadingLeverage,
    isRefreshingBase,
    isSeasonLive,
    isSubmittingOpenOrder,
    isTradingEnabled,
    isUpdatingLeverage,
    updatingLeverageKey,
    leverageErrorMessage,
    leverageInfo,
    leverageInfoByKey,
    openPositions,
    pageErrorMessage,
    pendingCloseQuantityByPositionKey,
    pendingOpenOrderLockedAmount,
    refreshBaseData,
    seasonInfo,
    selectedCoin,
    selectedPositionSide,
    setSelectedPositionSide,
    cancelLimitOrder,
    submitCloseOrder,
    submitLimitCloseOrder,
    submitLimitOpenOrder,
    submitOpenOrder,
    updateLeverage,
    updatePositionLeverage,
    walletStatus,
  };
};

export type ContestFuturesTradingSession = ReturnType<
  typeof useContestFuturesTradingSession
>;
