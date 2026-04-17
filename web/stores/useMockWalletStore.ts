import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FetchClientError } from "@/lib/api/client";
import { placeLimitOrder, placeMarketOrder } from "@/lib/api/trade";

// 모의투자 자산 관련 API 기본 경로
const MOCK_ASSET_API_BASE = "http://localhost:8080/api/v1/asset/mock";

// 모의투자 미참여 시 기본으로 보여줄 현금 값
const INITIAL_MOCK_USDT = 10000;

// 백엔드 메시지를 프론트 상태로 해석할 때 사용하는 키워드
const LOGIN_REQUIRED_TEXT = "로그인";
const ALREADY_TEXT = "이미";
const IN_PROGRESS_TEXT = "진행 중";
const JOIN_FIRST_TEXT = "참가하기를 먼저";
const ACTIVE_WALLET_TEXT = "활성화된 모의투자 지갑";

type MockWalletStatus =
  | "success"
  | "login_required"
  | "already_participated"
  | "not_participating"
  | "failed";

type FailureContext = "portfolio" | "participate" | "give-up" | "order";

interface MockWalletResult {
  success: boolean;
  status: MockWalletStatus;
  message?: string;
}

// 모의투자 보유 종목 한 건의 화면용 타입
export interface MockHolding {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  buyAmount: number;
  coinTotalValue: number;
  profit: number;
  roi: number;
  holdingRatio: number;
  isPriceStale: boolean;
}

interface MarketOrderParams {
  memberId: number;
  symbol: string;
  side: "BUY" | "SELL";

  quantity?: number;
  totalAmount?: number;
}

interface LimitOrderParams {
  memberId: number;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
}

interface MockWalletState {
  isParticipated: boolean;
  usdtBalance: number;
  holdings: MockHolding[];
  ownerMemberId: number | null;

  isLoadingPortfolio: boolean;

  hasLoadedPortfolio: boolean;

  historyVersion: number;

  syncWalletOwner: (memberId: number | null) => void;

  loadMockWallet: (
    memberId: number,
    force?: boolean
  ) => Promise<MockWalletResult>;

  participateMock: (memberId: number) => Promise<MockWalletResult>;

  giveUpMock: (memberId: number) => Promise<MockWalletResult>;

  resetMockWallet: (memberId: number) => Promise<MockWalletResult>;

  executeMarketOrder: (
    params: MarketOrderParams
  ) => Promise<MockWalletResult>;
  executeLimitOrder: (
    params: LimitOrderParams
  ) => Promise<MockWalletResult>;
}

// 새 사용자로 바뀌거나 로그아웃할 때 초기화 기준으로 쓰는 상태
const getInitialState = (memberId: number | null = null) => ({
  isParticipated: false,
  usdtBalance: 0,
  holdings: [],
  ownerMemberId: memberId,
  isLoadingPortfolio: false,
  hasLoadedPortfolio: false,
  historyVersion: 0,
});

// 응답 payload에서 message만 안전하게 꺼낸다
const extractMessage = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
};

// number 또는 숫자 문자열을 안전하게 숫자로 바꾼다
const extractNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

// boolean 또는 문자열 boolean 값을 안전하게 boolean으로 바꾼다
const extractBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return null;
};

// 모의투자 상태 응답에서 로그인 여부와 참여 여부를 꺼낸다
const extractMockStatus = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;

  const isLogin = extractBoolean(record.isLogin ?? nested?.isLogin);
  const isParticipated = extractBoolean(
    record.isParticipated ?? nested?.isParticipated
  );

  if (isLogin === null || isParticipated === null) {
    return null;
  }

  return {
    isLogin,
    isParticipated,
  };
};

// 응답 구조가 조금 달라도 사용 가능한 현금 값을 우선 추출한다
const extractUsdtBalance = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;

  const candidates = [
    record.usdtBalance,
    record.cashBalance,
    record.balance,
    nested?.usdtBalance,
    nested?.cashBalance,
    nested?.balance,
  ];

  for (const value of candidates) {
    const parsed = extractNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

// 포트폴리오 응답처럼 보이는 최소 구조인지 확인한다
const hasPortfolioPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const record = payload as Record<string, unknown>;

  return (
    extractUsdtBalance(payload) !== null ||
    typeof record.assetType === "string" ||
    typeof record.holdingCount === "number" ||
    Array.isArray(record.holdings)
  );
};

// holdings 배열을 프론트에서 쓰는 타입으로 정리한다
const extractHoldings = (payload: unknown): MockHolding[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const rawHoldings = Array.isArray(record.holdings)
    ? record.holdings
    : record.data &&
        typeof record.data === "object" &&
        Array.isArray((record.data as Record<string, unknown>).holdings)
      ? ((record.data as Record<string, unknown>).holdings as unknown[])
      : [];

  return rawHoldings
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const holding = item as Record<string, unknown>;
      const symbol = typeof holding.symbol === "string" ? holding.symbol : null;
      const quantity = extractNumber(holding.quantity);

      if (!symbol || quantity === null) {
        return null;
      }

      return {
        symbol,
        quantity,
        averageBuyPrice: extractNumber(holding.averageBuyPrice) ?? 0,
        currentPrice: extractNumber(holding.currentPrice) ?? 0,
        buyAmount: extractNumber(holding.buyAmount) ?? 0,
        coinTotalValue: extractNumber(holding.coinTotalValue) ?? 0,
        profit: extractNumber(holding.profit) ?? 0,
        roi: extractNumber(holding.roi) ?? 0,
        holdingRatio: extractNumber(holding.holdingRatio) ?? 0,
        isPriceStale: holding.isPriceStale === true,
      };
    })
    .filter((holding): holding is MockHolding => holding !== null);
};

// 백엔드 응답을 화면에서 쓰는 상태값으로 변환한다
const getFailureStatus = (
  statusCode: number,
  message: string,
  context: FailureContext
): MockWalletStatus => {
  const normalized = message.toLowerCase();

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    normalized.includes(LOGIN_REQUIRED_TEXT.toLowerCase()) ||
    normalized.includes("login")
  ) {
    return "login_required";
  }

  if (
    normalized.includes(ALREADY_TEXT.toLowerCase()) ||
    normalized.includes(IN_PROGRESS_TEXT.toLowerCase()) ||
    normalized.includes("already")
  ) {
    return "already_participated";
  }

  if (
    context !== "participate" &&
    (normalized.includes(JOIN_FIRST_TEXT.toLowerCase()) ||
      normalized.includes(ACTIVE_WALLET_TEXT.toLowerCase()) ||
      normalized.includes("not found"))
  ) {
    return "not_participating";
  }

  return "failed";
};

// 응답 body가 비어 있어도 안전하게 json 파싱
const parseJson = async (response: Response) =>
  response.json().catch(() => null);

const getOrderErrorStatus = (error: unknown) => {
  return error instanceof FetchClientError ? error.status : 0;
};

const getOrderErrorMessage = (error: unknown) => {
  if (error instanceof FetchClientError) {
    return error.userMessage || error.message;
  }

  return error instanceof Error ? error.message : "";
};

const isHandledOrderError = (error: unknown) => {
  if (!(error instanceof FetchClientError)) {
    return false;
  }

  return [400, 401, 403, 409].includes(error.status);
};

export const useMockWalletStore = create<MockWalletState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // 로그인 사용자 변경 시 이전 사용자 지갑 상태가 섞이지 않게 맞춘다
      syncWalletOwner: (memberId) =>
        set((state) => {
          if (memberId === null) {
            return getInitialState();
          }

          if (state.ownerMemberId === memberId) {
            return state;
          }

          return getInitialState(memberId);
        }),

      // 모의투자 상태를 먼저 확인하고, 참여 중일 때만 포트폴리오를 조회한다
      loadMockWallet: async (memberId, force = false) => {
        const currentState = get();

        if (
          !force &&
          currentState.ownerMemberId === memberId &&
          currentState.hasLoadedPortfolio
        ) {
          return {
            success: currentState.isParticipated,
            status: currentState.isParticipated ? "success" : "not_participating",
          };
        }

        set((state) => ({
          ...getInitialState(memberId),
          isParticipated:
            state.ownerMemberId === memberId ? state.isParticipated : false,
          usdtBalance: state.ownerMemberId === memberId ? state.usdtBalance : 0,
          holdings: state.ownerMemberId === memberId ? state.holdings : [],
          isLoadingPortfolio: true,
          historyVersion: state.historyVersion,
        }));

        try {
          const statusResponse = await fetch(`${MOCK_ASSET_API_BASE}/status`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          const statusPayload = await parseJson(statusResponse);
          const mockStatus = extractMockStatus(statusPayload);

          if (statusResponse.ok && mockStatus) {
            if (!mockStatus.isLogin) {
              set((state) => ({
                ...state,
                ownerMemberId: memberId,
                isLoadingPortfolio: false,
                hasLoadedPortfolio: true,
              }));

              return {
                success: false,
                status: "login_required",
              };
            }

            if (!mockStatus.isParticipated) {
              set({
                ...getInitialState(memberId),
                hasLoadedPortfolio: true,
                historyVersion: get().historyVersion,
              });

              return {
                success: false,
                status: "not_participating",
              };
            }
          } else if (!statusResponse.ok) {
            const message = extractMessage(statusPayload);
            const status = getFailureStatus(
              statusResponse.status,
              message,
              "portfolio"
            );

            set((state) => ({
              ...state,
              ownerMemberId: memberId,
              isLoadingPortfolio: false,
              hasLoadedPortfolio: true,
            }));

            if (status === "failed") {
              console.warn(
                "Failed to load mock wallet status:",
                message || statusResponse.statusText
              );
            }

            return {
              success: false,
              status,
              message,
            };
          }

          const response = await fetch(`${MOCK_ASSET_API_BASE}/portfolio`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          const payload = await parseJson(response);

          if (response.ok && hasPortfolioPayload(payload)) {
            set({
              ownerMemberId: memberId,
              isParticipated: true,
              usdtBalance: extractUsdtBalance(payload) ?? INITIAL_MOCK_USDT,
              holdings: extractHoldings(payload),
              isLoadingPortfolio: false,
              hasLoadedPortfolio: true,
            });

            return {
              success: true,
              status: "success",
            };
          }

          const message = extractMessage(payload);
          const status = getFailureStatus(response.status, message, "portfolio");

          if (status === "not_participating") {
            set({
              ...getInitialState(memberId),
              hasLoadedPortfolio: true,
              historyVersion: get().historyVersion,
            });

            return {
              success: false,
              status,
              message,
            };
          }

          set((state) => ({
            ...state,
            ownerMemberId: memberId,
            isLoadingPortfolio: false,
            hasLoadedPortfolio: true,
          }));

          if (status === "failed") {
            console.warn(
              "Failed to load mock wallet status:",
              message || response.statusText
            );
          }

          return {
            success: false,
            status,
            message,
          };
        } catch (error) {
          console.error("Failed to load mock wallet status.", error);

          set((state) => ({
            ...state,
            ownerMemberId: memberId,
            isLoadingPortfolio: false,
          }));

          return {
            success: false,
            status: "failed",
            message: "모의투자 상태를 불러오지 못했습니다.",
          };
        }
      },

      // 모의투자 참가 후 최신 포트폴리오를 다시 불러온다
      participateMock: async (memberId) => {
        try {
          const response = await fetch(`${MOCK_ASSET_API_BASE}/participate`, {
            method: "POST",
            credentials: "include",
          });

          const payload = await parseJson(response);

          if (!response.ok) {
            const message = extractMessage(payload);
            const status = getFailureStatus(
              response.status,
              message,
              "participate"
            );

            if (status === "already_participated") {
              await get().loadMockWallet(memberId, true);
            } else if (status === "failed") {
              console.warn(
                "Failed to start mock wallet:",
                message || response.statusText
              );
            }

            return {
              success: false,
              status,
              message,
            };
          }

          return get().loadMockWallet(memberId, true);
        } catch (error) {
          console.error("Failed to start mock wallet.", error);

          return {
            success: false,
            status: "failed",
            message: "모의투자 계좌 생성에 실패했습니다.",
          };
        }
      },

      // 모의투자 포기 후 상태를 초기화한다
      giveUpMock: async (memberId) => {
        try {
          const response = await fetch(`${MOCK_ASSET_API_BASE}/give-up`, {
            method: "POST",
            credentials: "include",
          });

          const payload = await parseJson(response);

          if (!response.ok) {
            const message = extractMessage(payload);
            const status = getFailureStatus(response.status, message, "give-up");

            if (status === "not_participating") {
              set({
                ...getInitialState(memberId),
                hasLoadedPortfolio: true,
              });
            } else if (status === "failed") {
              console.warn(
                "Failed to prepare mock wallet reset:",
                message || response.statusText
              );
            }

            return {
              success: false,
              status,
              message,
            };
          }

          set({
            ...getInitialState(memberId),
            hasLoadedPortfolio: true,
            historyVersion: get().historyVersion + 1,
          });

          return {
            success: true,
            status: "success",
          };
        } catch (error) {
          console.error("Failed to reset mock wallet.", error);

          return {
            success: false,
            status: "failed",
            message: "모의투자 초기화에 실패했습니다.",
          };
        }
      },

      // 현재는 reset 전용 API가 없어서 포기 후 재참가로 처리한다
      resetMockWallet: async (memberId) => {
        const giveUpResult = await get().giveUpMock(memberId);

        if (!giveUpResult.success && giveUpResult.status !== "not_participating") {
          return giveUpResult;
        }

        return get().participateMock(memberId);
      },

      // 시장가 주문 후 지갑과 거래내역 기준값을 다시 맞춘다
      executeMarketOrder: async ({
        memberId,
        symbol,
        side,
        quantity,
        totalAmount,
      }) => {
        try {
          await placeMarketOrder({
            symbol,
            assetType: "MOCK",
            side,
            quantity,
            totalAmount,
          });

          const refreshedWallet = await get().loadMockWallet(memberId, true);

          set((state) => ({
            ...state,
            historyVersion: state.historyVersion + 1,
          }));

          return refreshedWallet.success
            ? refreshedWallet
            : {
                success: true,
                status: "success",
              };
        } catch (error) {
          const message = getOrderErrorMessage(error);

          if (!isHandledOrderError(error)) {
            console.error("Failed to execute mock market order.", error);
          }

          return {
            success: false,
            status: getFailureStatus(getOrderErrorStatus(error), message, "order"),
            message: message || "주문 처리에 실패했습니다.",
          };
        }
      },

      // 지정가 주문 등록 후 지갑과 거래내역 기준값을 다시 맞춘다
      executeLimitOrder: async ({
        memberId,
        symbol,
        side,
        price,
        quantity,
      }) => {
        try {
          await placeLimitOrder({
            symbol,
            assetType: "MOCK",
            side,
            price,
            quantity,
          });

          const refreshedWallet = await get().loadMockWallet(memberId, true);

          set((state) => ({
            ...state,
            historyVersion: state.historyVersion + 1,
          }));

          return refreshedWallet.success
            ? refreshedWallet
            : {
                success: true,
                status: "success",
              };
        } catch (error) {
          const message = getOrderErrorMessage(error);

          if (!isHandledOrderError(error)) {
            console.error("Failed to execute mock limit order.", error);
          }

          return {
            success: false,
            status: getFailureStatus(getOrderErrorStatus(error), message, "order"),
            message: message || "주문 처리에 실패했습니다.",
          };
        }
      },
    }),
    {
      name: "mock-wallet",

      // 일시적인 로딩 상태는 저장하지 않고 핵심 지갑 상태만 보존한다
      partialize: (state) => ({
        isParticipated: state.isParticipated,
        usdtBalance: state.usdtBalance,
        holdings: state.holdings,
        ownerMemberId: state.ownerMemberId,
        hasLoadedPortfolio: state.hasLoadedPortfolio,
      }),
    }
  )
);


