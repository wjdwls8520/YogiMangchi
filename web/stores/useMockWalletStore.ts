import { create } from "zustand";
import { persist } from "zustand/middleware";

// mock 지갑 관련 API 기본 경로
const MOCK_ASSET_API_BASE = "http://localhost:8080/api/v1/asset/mock";

// 시장가 주문 API
const MOCK_MARKET_ORDER_API = "http://localhost:8080/api/v1/trade/order/market";

// 참여 직후 기본 지급금
const INITIAL_MOCK_USDT = 10000;

// 백엔드 메시지를 상태 코드처럼 프론트에서 해석하기 위한 문자열들
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

// 보유 코인 1개에 대한 정보
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
  // 주문 후 같은 사용자의 지갑을 다시 조회할 때 필요
  memberId: number;
  symbol: string;
  side: "BUY" | "SELL";

  // BUY일 때는 totalAmount, SELL일 때는 quantity를 주는 식으로 사용
  quantity?: number;
  totalAmount?: number;
}

interface MockWalletState {
  isParticipated: boolean;
  usdtBalance: number;
  holdings: MockHolding[];
  ownerMemberId: number | null;

  // 포트폴리오 조회 중인지 여부
  isLoadingPortfolio: boolean;

  // 한 번이라도 조회했는지 여부
  hasLoadedPortfolio: boolean;

  // 주문/리셋 후 거래내역 재조회 트리거용 버전 값
  historyVersion: number;

  // 로그인 사용자 변경 시 이전 사람 지갑 상태가 섞이지 않게 맞춰주는 함수
  syncWalletOwner: (memberId: number | null) => void;

  // mock 포트폴리오 조회
  loadMockWallet: (
    memberId: number,
    force?: boolean
  ) => Promise<MockWalletResult>;

  // mock 참여
  participateMock: (memberId: number) => Promise<MockWalletResult>;

  // mock 포기
  giveUpMock: (memberId: number) => Promise<MockWalletResult>;

  // UX상 "초기화"가 필요하므로 giveUp + participate를 묶은 함수
  resetMockWallet: (memberId: number) => Promise<MockWalletResult>;

  // 시장가 주문
  executeMarketOrder: (
    params: MarketOrderParams
  ) => Promise<MockWalletResult>;
}

// 공통 초기 상태
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

// number 또는 number string을 안전하게 숫자로 바꾼다
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

// 백엔드 응답 구조가 조금 달라도 잔고를 찾아내기 위한 함수
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

// "이 응답이 포트폴리오 응답처럼 보이는가?"를 검사
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

// holdings 배열을 프론트 타입으로 정리
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

// 백엔드의 status/message를 프론트용 상태값으로 정리
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

  // participate가 아닌 경우에는 "아직 참가 안 함" 상태도 분리해두는 게 편하다
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

// 응답 body가 비어 있어도 죽지 않게 안전하게 json 파싱
const parseJson = async (response: Response) =>
  response.json().catch(() => null);

export const useMockWalletStore = create<MockWalletState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      syncWalletOwner: (memberId) =>
        set((state) => {
          // 로그아웃이면 mock 상태를 전부 비운다
          if (memberId === null) {
            return getInitialState();
          }

          // 같은 사용자면 그대로 둔다
          if (state.ownerMemberId === memberId) {
            return state;
          }

          // 다른 사용자로 바뀌면 이전 사용자 지갑이 섞이지 않게 초기화
          return getInitialState(memberId);
        }),

      loadMockWallet: async (memberId, force = false) => {
        const currentState = get();

        // 이미 같은 사용자 지갑을 불러왔으면 중복 호출을 줄인다
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

        // 로딩 시작 전에 현재 사용자 상태만 잠깐 유지하고 다시 조회
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

          // 아직 mock 참여 안 한 사람은 "지갑 없음" 상태로 저장
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

            // 이미 참가 중이면 그냥 현재 지갑을 다시 불러오면 된다
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

          // 참여 성공 후에는 응답 본문보다 포트폴리오 재조회 결과를 믿는 편이 안전하다
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

            // 원래 지갑이 없었으면 그냥 "초기화된 상태"로 둔다
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

      resetMockWallet: async (memberId) => {
        // reset 전용 API가 없으므로 "포기 -> 다시 참여" 흐름으로 묶는다
        const giveUpResult = await get().giveUpMock(memberId);

        if (!giveUpResult.success && giveUpResult.status !== "not_participating") {
          return giveUpResult;
        }

        return get().participateMock(memberId);
      },

      executeMarketOrder: async ({
        memberId,
        symbol,
        side,
        quantity,
        totalAmount,
      }) => {
        try {
          const response = await fetch(MOCK_MARKET_ORDER_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              symbol,
              assetType: "MOCK",
              side,
              quantity,
              totalAmount,
            }),
          });

          const payload = await parseJson(response);

          if (!response.ok) {
            const message = extractMessage(payload);

            console.warn(
              "Failed to execute mock market order:",
              message || response.statusText
            );

            return {
              success: false,
              status: getFailureStatus(response.status, message, "order"),
              message,
            };
          }

          // 주문 성공 후 지갑을 다시 읽어와서 잔고/holdings를 최신 상태로 맞춘다
          const refreshedWallet = await get().loadMockWallet(memberId, true);

          // 거래내역 컴포넌트가 이 값을 보고 재조회할 수 있게 version 증가
          set((state) => ({
            ...state,
            historyVersion: state.historyVersion + 1,
          }));

          // 포트폴리오 재조회가 살짝 실패하더라도 주문 자체는 성공했을 수 있으니 success는 유지
          return refreshedWallet.success
            ? refreshedWallet
            : {
                success: true,
                status: "success",
              };
        } catch (error) {
          console.error("Failed to execute mock market order.", error);

          return {
            success: false,
            status: "failed",
            message: "주문 처리에 실패했습니다.",
          };
        }
      },
    }),
    {
      name: "mock-wallet",

      // persist에는 로딩 상태 같은 일시적인 값은 넣지 않는다
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
