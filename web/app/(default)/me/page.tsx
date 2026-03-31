"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Label,
} from "recharts";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";

type MainTab = "portfolio" | "community";
type PortfolioTab = "trade" | "contest" | "mock";
type MockSubTab = "holdings" | "open" | "orders" | "trades";

type MemberProfile = {
  memberId: number;
  provider: string;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  bestCount: number;
  followerCount: number;
  followingCount: number;
  term_agree: boolean;
  private_agree: boolean;
};

type MockHolding = {
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
};

type MockPortfolio = {
  assetType: string;
  holdingCount: number;
  seedMoney: number;
  cashBalance: number;
  totalBuyAmount: number;
  totalCoinValue: number;
  totalAsset: number;
  totalProfit: number;
  totalRoi: number;
  holdings: MockHolding[];
};

type OpenOrderItem = {
  orderId: number;
  assetType: string;
  symbol: string;
  displayNameKr: string;
  orderType: string;
  side: "BUY" | "SELL";
  orderStatus: "PENDING" | "PARTIALLY_FILLED" | "COMPLETED" | "CANCELED";
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
};

type OrderHistoryItem = OpenOrderItem;

type TradeHistoryItem = {
  tradeId: number;
  orderId: number;
  assetType: string;
  symbol: string;
  displayNameKr: string;
  side: "BUY" | "SELL";
  orderType: string;
  orderStatus: "PENDING" | "PARTIALLY_FILLED" | "COMPLETED" | "CANCELED";
  price: number;
  quantity: number;
  totalAmount: number;
  fee: number;
  realizedProfit: number | null;
  orderedAt: string;
  executedAt: string | null;
};

const CHART_COLORS = [
  "#0058FF",
  "#9CB34E",
  "#1D7CA7",
  "#5F5592",
  "#B5679B",
  "#E97A31",
  "#00A6A6",
];

const MOCK_POSTS = [
  {
    id: 1,
    title: "오늘 비트코인 1차 반등 나오면 어디까지 보실까요?",
    date: "방금 전",
    comments: 12,
    likes: 45,
  },
  {
    id: 2,
    title: "솔라나 수익률 30% 찍었습니다! 익절할지 고민 중",
    date: "2시간 전",
    comments: 8,
    likes: 32,
  },
  {
    id: 3,
    title: "코인 처음 시작하는데 포트폴리오 조언 부탁드려요.",
    date: "어제",
    comments: 5,
    likes: 10,
  },
];

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
};

const formatSignedNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0";
  }

  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
};

const formatSignedPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR", {
    hour12: false,
  });
};

const formatOrderStatus = (status?: string) => {
  if (status === "PENDING") return "대기중";
  if (status === "PARTIALLY_FILLED") return "부분체결";
  if (status === "COMPLETED") return "체결완료";
  if (status === "CANCELED") return "취소";
  return status || "-";
};

const getSymbolLabel = (symbol: string) => {
  return symbol.replace("USDT", "");
};

const getJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getCursorContent = <T,>(payload: unknown): T[] => {
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.content)) return payload.content as T[];

  const data = isRecord(payload.data) ? payload.data : null;
  if (data && Array.isArray(data.content)) return data.content as T[];

  const nestedData = data && isRecord(data.data) ? data.data : null;
  if (nestedData && Array.isArray(nestedData.content)) {
    return nestedData.content as T[];
  }

  return [];
};

const getArrayContent = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload.content)) return payload.content as T[];

  return [];
};

const extractErrorMessage = (payload: unknown) => {
  if (!isRecord(payload)) return "";

  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;

  const data = isRecord(payload.data) ? payload.data : null;
  if (data && typeof data.message === "string") return data.message;

  return "";
};

const isNoMockWalletMessage = (message: string) => {
  return (
    message.includes("현재 참여중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("활성화된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.")
  );
};

export default function MePage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("portfolio");
  const [portfolioTab, setPortfolioTab] = useState<PortfolioTab>("mock");
  const [mockSubTab, setMockSubTab] = useState<MockSubTab>("holdings");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [mockErrorMessage, setMockErrorMessage] = useState("");

  const [mockPortfolio, setMockPortfolio] = useState<MockPortfolio | null>(null);
  const [openOrders, setOpenOrders] = useState<OpenOrderItem[]>([]);
  const [orderHistories, setOrderHistories] = useState<OrderHistoryItem[]>([]);
  const [tradeHistories, setTradeHistories] = useState<TradeHistoryItem[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let isActive = true;

    const loadMemberProfile = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("failed to load member profile");
        }

        const data = await getJson(response);
        if (isActive && data) {
          setMemberProfile(data as MemberProfile);
        }
      } catch (error) {
        console.error("회원정보 조회 실패:", error);
      } finally {
        if (isActive) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadMemberProfile();

    return () => {
      isActive = false;
    };
  }, [isMounted, router]);

  useEffect(() => {
    if (!isMounted || !memberProfile || portfolioTab !== "mock") return;

    const loadMockData = async () => {
      setIsLoadingMock(true);
      setMockErrorMessage("");

      try {
        const portfolioResponse = await fetch(
          "http://localhost:8080/api/v1/asset/mock/portfolio",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (portfolioResponse.status === 401 || portfolioResponse.status === 403) {
          setMemberProfile(null);
          router.replace("/login");
          return;
        }

        const portfolioJson = await getJson(portfolioResponse);
        const portfolioMessage = extractErrorMessage(portfolioJson);

        if (portfolioResponse.ok) {
          const portfolioData = isRecord(portfolioJson) && "data" in portfolioJson
            ? (portfolioJson.data as MockPortfolio)
            : (portfolioJson as MockPortfolio);

          setMockPortfolio(portfolioData);
        } else {
          setMockPortfolio(null);
          setMockErrorMessage(
            isNoMockWalletMessage(portfolioMessage)
              ? "모의투자 계좌를 생성하면 데이터가 표시됩니다."
              : portfolioMessage || "모의투자 포트폴리오를 불러오지 못했습니다."
          );
          setOpenOrders([]);
          setOrderHistories([]);
          setTradeHistories([]);
          setIsLoadingMock(false);
          return;
        }

      } catch (error) {
        console.error("포트폴리오 조회 실패:", error);
        setMockPortfolio(null);
        setMockErrorMessage("모의투자 포트폴리오를 불러오지 못했습니다.");
      }

      try {
        const openOrdersResponse = await fetch(
          "http://localhost:8080/api/v1/trade/orders/open?assetType=MOCK",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (openOrdersResponse.status === 401 || openOrdersResponse.status === 403) {
          setMemberProfile(null);
          router.replace("/login");
          return;
        }

        if (openOrdersResponse.ok) {
          const openOrdersJson = await getJson(openOrdersResponse);
          setOpenOrders(getArrayContent<OpenOrderItem>(openOrdersJson));
        } else {
          setOpenOrders([]);
        }
      } catch (error) {
        console.error("미체결 주문 조회 실패:", error);
        setOpenOrders([]);
      }

      try {
        const ordersResponse = await fetch(
          "http://localhost:8080/api/v1/trade/orders?assetType=MOCK&size=20",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (ordersResponse.status === 401 || ordersResponse.status === 403) {
          setMemberProfile(null);
          router.replace("/login");
          return;
        }

        if (ordersResponse.ok) {
          const ordersJson = await getJson(ordersResponse);
          setOrderHistories(getCursorContent<OrderHistoryItem>(ordersJson));
        } else {
          setOrderHistories([]);
        }
      } catch (error) {
        console.error("주문내역 조회 실패:", error);
        setOrderHistories([]);
      }

      try {
        const historiesResponse = await fetch(
          "http://localhost:8080/api/v1/trade/histories?assetType=MOCK&status=COMPLETED&size=20",
          {
            method: "GET",
            credentials: "include",
          }
        );


        if (historiesResponse.status === 401 || historiesResponse.status === 403) {
          setMemberProfile(null);
          router.replace("/login");
          return;
        }

        if (historiesResponse.ok) {
          const historiesJson = await getJson(historiesResponse);
          setTradeHistories(getCursorContent<TradeHistoryItem>(historiesJson));
        } else {
          setTradeHistories([]);
        }
      } catch (error) {
        console.error("거래내역 조회 실패:", error);
        setTradeHistories([]);
      }

      setIsLoadingMock(false);
    };

    void loadMockData();
  }, [isMounted, memberProfile, portfolioTab, router]);

  const handleMoveEdit = () => {
    router.push("/me/settings");
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = window.confirm("로그아웃 하시겠습니까?");
    if (!confirmed) return;

    setIsLoggingOut(true);

    try {
      await fetch("http://localhost:8080/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("로그아웃 요청 실패:", error);
    } finally {
      setMemberProfile(null);
      alert("로그아웃되었습니다.");
      router.replace("/");
    }
  };

  const pieData = useMemo(() => {
    if (portfolioTab !== "mock" || !mockPortfolio) return [];

    const holdingsData = mockPortfolio.holdings
      .filter((item) => item.coinTotalValue > 0)
      .map((item, index) => ({
        name: getSymbolLabel(item.symbol),
        value:
          mockPortfolio.totalAsset > 0
            ? (item.coinTotalValue / mockPortfolio.totalAsset) * 100
            : 0,
        color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
      }));

    const cashRatio =
      mockPortfolio.totalAsset > 0
        ? (mockPortfolio.cashBalance / mockPortfolio.totalAsset) * 100
        : 0;

    if (cashRatio > 0) {
      holdingsData.unshift({
        name: "USDT",
        value: cashRatio,
        color: CHART_COLORS[0],
      });
    }

    return holdingsData.filter((item) => item.value > 0);
  }, [portfolioTab, mockPortfolio]);

  if (!isMounted) return null;

  if (isLoadingProfile) {
    return <div className="p-20 text-center">Loading...</div>;
  }

  if (!memberProfile) {
    return <div className="p-20 text-center">로그인이 필요합니다.</div>;
  }

  const user = memberProfile;

  const summary =
    portfolioTab === "mock" && mockPortfolio
      ? {
          title: "모의투자 자산",
          cashBalance: mockPortfolio.cashBalance,
          totalAsset: mockPortfolio.totalAsset,
          totalBuyAmount: mockPortfolio.totalBuyAmount,
          totalCoinValue: mockPortfolio.totalCoinValue,
          totalProfit: mockPortfolio.totalProfit,
          totalRoi: mockPortfolio.totalRoi,
        }
      : {
          title:
            portfolioTab === "trade"
              ? "트레이딩 자산"
              : portfolioTab === "contest"
                ? "대회 자산"
                : "모의투자 자산",
          cashBalance: 0,
          totalAsset: 0,
          totalBuyAmount: 0,
          totalCoinValue: 0,
          totalProfit: 0,
          totalRoi: 0,
        };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-[400px] lg:sticky lg:top-24 space-y-6">
          <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 overflow-hidden text-gray-400">
                <img
                  src={memberProfile.profileImgUrl || "/default-profile.png"}
                  alt="profile"
                  className="h-full w-full object-cover"
                />
              </div>

              <h2 className="text-2xl font-black text-gray-900">
                {memberProfile.nickname}
              </h2>

              <p className="text-sm text-gray-400 mt-1 font-medium text-center">
                {user.profileMsg || "소개글이 없습니다."}
              </p>

              <div className="grid grid-cols-2 gap-2 w-full mt-6">
                <Button
                  variant="white"
                  size="sm"
                  fullWidth={true}
                  onClick={handleMoveEdit}
                >
                  회원정보 수정
                </Button>

                <Button
                  variant="gray"
                  size="sm"
                  fullWidth={true}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
                </Button>
              </div>

              <div className="grid grid-cols-3 w-full mt-8 pt-6 border-t border-gray-50">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Followers
                  </p>
                  <p className="text-lg font-black">{user.followerCount}</p>
                </div>

                <div className="text-center border-l border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Following
                  </p>
                  <p className="text-lg font-black">{user.followingCount}</p>
                </div>

                <div className="text-center border-l border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Mangchi
                  </p>
                  <p className="text-lg font-black text-orange-500">
                    {user.bestCount}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] bg-[#0058FF] p-8 text-white shadow-xl shadow-blue-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold opacity-80">{summary.title}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold opacity-80">주문 가능 금액</span>
            </div>
            <h3 className="text-3xl font-black mb-5">
              {formatNumber(summary.cashBalance)}
            </h3>

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold opacity-80">총 보유 자산</span>
            </div>
            <h3 className="text-3xl font-black mb-1">
              {formatNumber(summary.totalAsset)}
            </h3>

            <div className="grid grid-cols-2 gap-y-4 mt-8 pt-6 border-t border-white/10">
              <AssetMiniInfo label="총매수" value={formatNumber(summary.totalBuyAmount)} />
              <AssetMiniInfo
                label="총평가"
                value={formatNumber(summary.totalCoinValue)}
                align="right"
              />
              <AssetMiniInfo
                label="총손익"
                value={formatSignedNumber(summary.totalProfit)}
              />
              <AssetMiniInfo
                label="수익률"
                value={formatSignedPercent(summary.totalRoi)}
                align="right"
              />
            </div>
          </section>
        </aside>

        <main className="flex-1 w-full space-y-6">
          <div className="flex p-1 bg-gray-200/50 rounded-2xl gap-1">
            <button
              onClick={() => setMainTab("portfolio")}
              className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${
                mainTab === "portfolio"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              나의 포트폴리오
            </button>

            <button
              onClick={() => setMainTab("community")}
              className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${
                mainTab === "community"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              커뮤니티
            </button>
          </div>

          {mainTab === "portfolio" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="mb-8">
                  <Tabs
                    tabs={[
                      { label: "트레이딩", value: "trade" },
                      { label: "대회", value: "contest" },
                      { label: "모의투자", value: "mock" },
                    ]}
                    activeTab={portfolioTab}
                    onChange={(value) => setPortfolioTab(value as PortfolioTab)}
                  />
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-8">
                  자산 포트폴리오 비중
                </h3>

                {portfolioTab !== "mock" ? (
                  <div className="py-24 text-center text-gray-300 font-bold">
                    {portfolioTab === "trade"
                      ? "트레이딩 데이터는 아직 준비 중입니다."
                      : "대회 데이터는 아직 준비 중입니다."}
                  </div>
                ) : isLoadingMock ? (
                  <div className="py-24 text-center text-gray-300 font-bold">
                    모의투자 데이터를 불러오는 중입니다.
                  </div>
                ) : !mockPortfolio ? (
                  <div className="py-24 text-center text-gray-300 font-bold">
                    {mockErrorMessage || "모의투자 데이터가 없습니다."}
                  </div>
                ) : pieData.length === 0 ? (
                  <div className="py-24 text-center text-gray-300 font-bold">
                    비중을 표시할 자산이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="h-[260px] w-full md:w-1/2 relative">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={pieData}
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={entry.name} fill={entry.color || CHART_COLORS[i]} />
                            ))}
                            <Label
                              value="보유 비중(%)"
                              position="center"
                              fill="#999"
                              style={{ fontSize: "12px", fontWeight: "bold" }}
                            />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 w-full md:w-1/2">
                      {pieData.map((item) => (
                        <div
                          key={item.name}
                          className="flex justify-between items-center border-b border-gray-50 pb-2"
                        >
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                          </span>
                          <span className="text-sm font-black text-gray-900">
                            {item.value.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-[32px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 pt-6">
                  <Tabs
                    tabs={[
                      { label: "보유자산", value: "holdings" },
                      { label: "미체결", value: "open" },
                      { label: "주문내역", value: "orders" },
                      { label: "거래내역", value: "trades" },
                    ]}
                    activeTab={mockSubTab}
                    onChange={(value) => setMockSubTab(value as MockSubTab)}
                    fullWidth={true}
                  />
                </div>

                <div className="p-6 md:p-10">
                  {portfolioTab !== "mock" ? (
                    <div className="py-32 text-center text-gray-300 font-bold">
                      아직 해당 탭 데이터는 준비 중입니다.
                    </div>
                  ) : isLoadingMock ? (
                    <div className="py-32 text-center text-gray-300 font-bold">
                      데이터를 불러오는 중입니다.
                    </div>
                  ) : mockSubTab === "holdings" ? (
                    mockPortfolio && mockPortfolio.holdings.length > 0 ? (
                      <div className="space-y-4">
                        {mockPortfolio.holdings.map((item) => (
                          <HoldingRow key={item.symbol} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="보유 중인 모의투자 자산이 없습니다." />
                    )
                  ) : mockSubTab === "open" ? (
                    openOrders.length > 0 ? (
                      <div className="space-y-4">
                        {openOrders.map((item) => (
                          <OrderRow key={item.orderId} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="미체결 주문이 없습니다." />
                    )
                  ) : mockSubTab === "orders" ? (
                    orderHistories.length > 0 ? (
                      <div className="space-y-4">
                        {orderHistories.map((item) => (
                          <OrderRow key={item.orderId} item={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="주문내역이 없습니다." />
                    )
                  ) : tradeHistories.length > 0 ? (
                    <div className="space-y-4">
                      {tradeHistories.map((item) => (
                        <TradeHistoryRow key={item.tradeId} item={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="거래내역이 없습니다." />
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <CommunityStatCard label="작성 글" count={12} />
                <CommunityStatCard label="좋아요 받은 글" count={124} />
                <CommunityStatCard label="팔로워" count={user.followerCount} />
                <CommunityStatCard label="팔로잉" count={user.followingCount} />
              </div>

              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-gray-900">
                    최근 작성한 글
                  </h3>
                  <button className="text-xs font-bold text-gray-400 hover:text-blue-500 transition-colors">
                    전체보기
                  </button>
                </div>

                <div className="space-y-6">
                  {MOCK_POSTS.map((post) => (
                    <div
                      key={post.id}
                      className="group cursor-pointer border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                    >
                      <h4 className="text-base font-bold text-gray-800 group-hover:text-[#0058FF] transition-colors mb-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                        <span>{post.date}</span>
                        <span>댓글 {post.comments}</span>
                        <span>좋아요 {post.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AssetMiniInfo({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="text-[10px] opacity-60 font-bold mb-0.5 uppercase">
        {label}
      </p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
}

function CommunityStatCard({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center gap-1">
      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
        {label}
      </p>
      <p className="text-xl font-black text-gray-900">
        {count.toLocaleString()}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="py-32 text-center text-gray-300 font-bold">{text}</div>;
}

function HoldingRow({ item }: { item: MockHolding }) {
  const isLoss = item.profit < 0;
  const color = isLoss ? "text-blue-500" : "text-red-500";

  return (
    <div className="p-6 rounded-[24px] border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400">
            {getSymbolLabel(item.symbol)}
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900">
              {getSymbolLabel(item.symbol)}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase">
              {item.symbol}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-sm font-black ${color}`}>
            {formatSignedNumber(item.profit)}
            <span className="text-[10px] ml-1">USDT</span>
          </p>
          <p className={`text-[11px] font-black ${color}`}>
            {formatSignedPercent(item.roi)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
        <DataBox
          label="보유수량"
          value={formatNumber(item.quantity)}
          unit={getSymbolLabel(item.symbol)}
        />
        <DataBox
          label="평가금액"
          value={formatNumber(item.coinTotalValue)}
          unit="USDT"
        />
        <DataBox
          label="매수평균가"
          value={formatNumber(item.averageBuyPrice)}
          unit="USDT"
        />
        <DataBox
          label="매수금액"
          value={formatNumber(item.buyAmount)}
          unit="USDT"
        />
      </div>
    </div>
  );
}

function OrderRow({ item }: { item: OpenOrderItem | OrderHistoryItem }) {
  const sideColor = item.side === "BUY" ? "text-red-500" : "text-blue-500";

  return (
    <div className="p-6 rounded-[24px] border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-black text-gray-900">
            {item.displayNameKr || getSymbolLabel(item.symbol)}
            <span className={`ml-2 ${sideColor}`}>
              {item.side === "BUY" ? "매수" : "매도"}
            </span>
          </p>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            주문일시 {formatDateTime(item.orderedAt)}
          </p>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            체결완료 {formatDateTime(item.executedAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-gray-900">
            {formatOrderStatus(item.orderStatus)}
          </p>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            {item.orderType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
        <DataBox
          label="주문가격"
          value={formatNumber(item.orderPrice)}
          unit="USDT"
        />
        <DataBox
          label="주문수량"
          value={formatNumber(item.orderQuantity)}
          unit={getSymbolLabel(item.symbol)}
        />
        <DataBox
          label="주문금액"
          value={formatNumber(item.orderAmount)}
          unit="USDT"
        />
        <DataBox
          label="체결수량"
          value={formatNumber(item.filledQuantity)}
          unit={getSymbolLabel(item.symbol)}
        />
        <DataBox
          label="남은수량"
          value={formatNumber(item.remainingQuantity)}
          unit={getSymbolLabel(item.symbol)}
        />
      </div>
    </div>
  );
}

function TradeHistoryRow({ item }: { item: TradeHistoryItem }) {
  const sideColor = item.side === "BUY" ? "text-red-500" : "text-blue-500";

  return (
    <div className="p-6 rounded-[24px] border border-gray-100 bg-white hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-black text-gray-900">
            {item.displayNameKr || getSymbolLabel(item.symbol)}
            <span className={`ml-2 ${sideColor}`}>
              {item.side === "BUY" ? "매수" : "매도"}
            </span>
          </p>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            주문일시 {formatDateTime(item.orderedAt)}
          </p>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            체결일시 {formatDateTime(item.executedAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-black text-gray-900">
            {formatOrderStatus(item.orderStatus)}
          </p>
          <p className="text-[11px] text-gray-400 font-bold mt-1">
            {item.orderType}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
        <DataBox label="체결가" value={formatNumber(item.price)} unit="USDT" />
        <DataBox
          label="체결수량"
          value={formatNumber(item.quantity)}
          unit={getSymbolLabel(item.symbol)}
        />
        <DataBox
          label="총금액"
          value={formatNumber(item.totalAmount)}
          unit="USDT"
        />
        <DataBox label="수수료" value={formatNumber(item.fee)} unit="USDT" />
        <DataBox
          label="실현손익"
          value={formatSignedNumber(item.realizedProfit ?? 0)}
          unit="USDT"
        />
      </div>
    </div>
  );
}

function DataBox({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div>
      <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase">
        {label}
      </p>
      <p className="text-[11px] font-black text-gray-800">
        {value}
        <span className="text-[9px] text-gray-400 font-medium ml-1">{unit}</span>
      </p>
    </div>
  );
}
