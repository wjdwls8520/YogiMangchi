"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getLikedPosts,
  getLikedReplies,
  getMemberPosts,
  getMemberReplies,
} from "@/lib/api/me-community";
import { formatTime } from "@/lib/utils/date";
import type { Post, Reply } from "@/app/(default)/community/types/post";

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
type CommunityTab = "posts" | "replies" | "likedPosts" | "likedReplies";

type MemberRole = "USER" | "VERIFIED_USER" | "ADMIN";
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
  role: MemberRole;
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

type LikedPost = {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
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

const getRoleLabel = (role?: "USER" | "VERIFIED_USER" | "ADMIN") => {
  if (role === "VERIFIED_USER") return "인증회원";
  if (role === "ADMIN") return "관리자";
  return "일반회원";
};

const getRoleBadgeClassName = (role?: "USER" | "VERIFIED_USER" | "ADMIN") => {
  if (role === "VERIFIED_USER") {
    return "bg-blue-50 text-blue-600";
  }

  if (role === "ADMIN") {
    return "bg-orange-50 text-orange-600";
  }

  return "bg-gray-100 text-gray-600";
};


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

const getSymbolLabel = (symbol: string) => {
  return symbol.replace("USDT", "");
};

const getJson = async (response: Response) => {
  return response.json().catch(() => null);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
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
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("portfolio");
  const [portfolioTab, setPortfolioTab] = useState<PortfolioTab>("mock");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("posts");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [mockErrorMessage, setMockErrorMessage] = useState("");

  const [mockPortfolio, setMockPortfolio] = useState<MockPortfolio | null>(null);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [communityReplies, setCommunityReplies] = useState<Reply[]>([]);
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [likedReplies, setLikedReplies] = useState<Reply[]>([]);
  const [isLoadingCommunityPosts, setIsLoadingCommunityPosts] = useState(false);
  const [isLoadingCommunityReplies, setIsLoadingCommunityReplies] = useState(false);
  const [isLoadingLikedPosts, setIsLoadingLikedPosts] = useState(false);
  const [isLoadingLikedReplies, setIsLoadingLikedReplies] = useState(false);
  const [communityPostsErrorMessage, setCommunityPostsErrorMessage] = useState("");
  const [communityRepliesErrorMessage, setCommunityRepliesErrorMessage] = useState("");
  const [likedPostsErrorMessage, setLikedPostsErrorMessage] = useState("");
  const [likedRepliesErrorMessage, setLikedRepliesErrorMessage] = useState("");

  const logout = useAuthStore((state) => state.logout);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);


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
          if (isActive) {
            logout();
            setMemberProfile(null);
            setProfileErrorMessage("");
          }
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("failed to load member profile");
        }

        const data = await getJson(response);
        const nextProfile = isRecord(data) && isRecord(data.data)
          ? (data.data as MemberProfile)
          : (data as MemberProfile | null);

        if (isActive && nextProfile) {
          setMemberProfile(nextProfile);
          setProfileErrorMessage("");
        }
      } catch (error) {
        console.error("failed to load member profile:", error);
        if (isActive) {
          setMemberProfile(null);
          setProfileErrorMessage("회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        }
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
  }, [isMounted, logout, router]);

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
          logout();
          setMemberProfile(null);
          setMockPortfolio(null);
          setProfileErrorMessage("");
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
          setIsLoadingMock(false);
          return;
        }

      } catch (error) {
        console.error("포트폴리오 조회 실패:", error);
        setMockPortfolio(null);
        setMockErrorMessage("모의투자 포트폴리오를 불러오지 못했습니다.");
      }

      setIsLoadingMock(false);
    };

    void loadMockData();
  }, [isMounted, logout, memberProfile, portfolioTab, router]);

  useEffect(() => {
    if (!isMounted || !memberProfile) return;
    if (mainTab !== "community" || communityTab !== "posts") return;

    let isActive = true;

    const loadCommunityPosts = async () => {
      setIsLoadingCommunityPosts(true);
      setCommunityPostsErrorMessage("");

      try {
        const response = await getMemberPosts(memberProfile.memberId, { size: 5 });
        const nextPosts =
          response && Array.isArray(response.content) ? (response.content as Post[]) : [];

        if (!isActive) return;

        setCommunityPosts(nextPosts);
      } catch (error) {
        console.error("failed to load member community posts:", error);

        if (!isActive) return;

        setCommunityPosts([]);
        setCommunityPostsErrorMessage("작성한 게시글을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingCommunityPosts(false);
        }
      }
    };

    void loadCommunityPosts();

    return () => {
      isActive = false;
    };
  }, [communityTab, isMounted, mainTab, memberProfile]);

  useEffect(() => {
    if (!isMounted || !memberProfile) return;
    if (mainTab !== "community" || communityTab !== "replies") return;

    let isActive = true;

    const loadCommunityReplies = async () => {
      setIsLoadingCommunityReplies(true);
      setCommunityRepliesErrorMessage("");

      try {
        const response = await getMemberReplies(memberProfile.memberId, { size: 5 });
        const nextReplies =
          response && Array.isArray(response.content) ? (response.content as Reply[]) : [];

        if (!isActive) return;

        setCommunityReplies(nextReplies);
      } catch (error) {
        console.error("failed to load member community replies:", error);

        if (!isActive) return;

        setCommunityReplies([]);
        setCommunityRepliesErrorMessage("작성한 댓글을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingCommunityReplies(false);
        }
      }
    };

    void loadCommunityReplies();

    return () => {
      isActive = false;
    };
  }, [communityTab, isMounted, mainTab, memberProfile]);

  useEffect(() => {
    if (!isMounted || !memberProfile) return;
    if (mainTab !== "community" || communityTab !== "likedPosts") return;

    let isActive = true;

    const loadLikedPosts = async () => {
      setIsLoadingLikedPosts(true);
      setLikedPostsErrorMessage("");

      try {
        const response = await getLikedPosts({ size: 5 });
        const nextPosts =
          response && Array.isArray(response.content)
            ? (response.content as LikedPost[])
            : [];

        if (!isActive) return;

        setLikedPosts(nextPosts);
      } catch (error) {
        console.error("failed to load liked posts:", error);

        if (!isActive) return;

        setLikedPosts([]);
        setLikedPostsErrorMessage("좋아요한 게시글을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingLikedPosts(false);
        }
      }
    };

    void loadLikedPosts();

    return () => {
      isActive = false;
    };
  }, [communityTab, isMounted, mainTab, memberProfile]);

  useEffect(() => {
    if (!isMounted || !memberProfile) return;
    if (mainTab !== "community" || communityTab !== "likedReplies") return;

    let isActive = true;

    const loadLikedReplies = async () => {
      setIsLoadingLikedReplies(true);
      setLikedRepliesErrorMessage("");

      try {
        const response = await getLikedReplies({ size: 5 });
        const nextReplies =
          response && Array.isArray(response.content)
            ? (response.content as Reply[])
            : [];

        if (!isActive) return;

        setLikedReplies(nextReplies);
      } catch (error) {
        console.error("failed to load liked replies:", error);

        if (!isActive) return;

        setLikedReplies([]);
        setLikedRepliesErrorMessage("좋아요한 댓글을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingLikedReplies(false);
        }
      }
    };

    void loadLikedReplies();

    return () => {
      isActive = false;
    };
  }, [communityTab, isMounted, mainTab, memberProfile]);

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
      console.error("failed to logout:", error);
    } finally {
      logout();
      setMemberProfile(null);
      setMockPortfolio(null);
      setProfileErrorMessage("");
      alert("로그아웃되었습니다.");
      router.replace("/");
    }
  };

  // 회원탈퇴
  const handleWithdraw = async () => {
    if (isDeletingAccount) return;

    const confirmed = window.confirm("정말 회원 탈퇴하시겠습니까?");
    if (!confirmed) return;

    setIsDeletingAccount(true);

    try {
      const response = await fetch("http://localhost:8080/api/v1/member/me", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        setMemberProfile(null);
        setMockPortfolio(null);
        setProfileErrorMessage("");
        alert("로그인 정보가 만료되었습니다.");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("failed to withdraw member");
      }

      logout();
      setMemberProfile(null);
      setMockPortfolio(null);
      setProfileErrorMessage("");
      alert("회원 탈퇴가 완료되었습니다.");
      router.replace("/");
    } catch (error) {
      console.error("failed to withdraw member:", error);
      alert("회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDeletingAccount(false);
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

  if (profileErrorMessage) {
    return <div className="p-20 text-center">{profileErrorMessage}</div>;
  }

  if (!memberProfile) {
    return <div className="p-20 text-center">로그인이 필요합니다.</div>;
  }

  const user = memberProfile;
  const isGeneralUser = user.role === "USER";

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
              <div className="relative h-24 w-24 mb-3 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 overflow-hidden text-gray-400">
                <img
                  src={memberProfile.profileImgUrl || "/user_default.png"}
                  alt="profile"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/user_default.png";
                  }}
                  />
              </div>

              <span
                className={`inline-flex rounded-full mb-2 px-3 py-1 text-xs font-bold ${getRoleBadgeClassName(user.role)}`}
              >
                {getRoleLabel(user.role)}
              </span>

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

              {isGeneralUser ? (
                <Button variant="white" fullWidth={true} className="mt-2" onClick={() => router.push("/verify")}>
                  회원 인증하기
                </Button>
              ) : null}

              <div className="grid grid-cols-3 w-full mt-3 pt-6 border-t border-gray-50">
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

          <Button
            variant="white"
            fullWidth={true}
            onClick={handleWithdraw}
            disabled={isDeletingAccount}
          >
            {isDeletingAccount ? "탈퇴 처리 중..." : "회원 탈퇴"}
          </Button>

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
                      { label: "모의투자(예시)", value: "mock" },
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
                <div className="p-6 md:p-10">
                  {portfolioTab !== "mock" ? (
                    <div className="py-32 text-center text-gray-300 font-bold">
                      아직 해당 자산 데이터는 준비 중입니다.
                    </div>
                  ) : isLoadingMock ? (
                    <div className="py-32 text-center text-gray-300 font-bold">
                      데이터를 불러오는 중입니다.
                    </div>
                  ) : mockPortfolio && mockPortfolio.holdings.length > 0 ? (
                    <div className="space-y-4">
                      <div className="mb-2">
                        <h3 className="text-lg font-black text-gray-900">
                          보유자산 목록
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          현재 보유 중인 자산 수량과 평가 정보를 확인할 수 있습니다.
                        </p>
                      </div>
                      {mockPortfolio.holdings.map((item) => (
                        <HoldingRow key={item.symbol} item={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="보유 중인 모의투자 자산이 없습니다." />
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <Tabs
                  tabs={[
                    { label: "내 게시글", value: "posts" },
                    { label: "내 댓글", value: "replies" },
                    { label: "좋아요한 게시글", value: "likedPosts" },
                    { label: "좋아요한 댓글", value: "likedReplies" },
                  ]}
                  activeTab={communityTab}
                  onChange={(value) => setCommunityTab(value as CommunityTab)}
                />

                <div className="mt-8">
                  {communityTab === "posts" ? (
                    isLoadingCommunityPosts ? (
                      <EmptyState text="작성한 게시글을 불러오는 중입니다." />
                    ) : communityPostsErrorMessage ? (
                      <EmptyState text={communityPostsErrorMessage} />
                    ) : communityPosts.length > 0 ? (
                      <div className="space-y-4">
                        {communityPosts.map((post) => (
                          <MyPostRow key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="작성한 게시글이 없습니다." />
                    )
                  ) : communityTab === "replies" ? (
                    isLoadingCommunityReplies ? (
                      <EmptyState text="작성한 댓글을 불러오는 중입니다." />
                    ) : communityRepliesErrorMessage ? (
                      <EmptyState text={communityRepliesErrorMessage} />
                    ) : communityReplies.length > 0 ? (
                      <div className="space-y-4">
                        {communityReplies.map((reply) => (
                          <MyReplyRow key={reply.id} reply={reply} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="작성한 댓글이 없습니다." />
                    )
                  ) : communityTab === "likedPosts" ? (
                    isLoadingLikedPosts ? (
                      <EmptyState text="좋아요한 게시글을 불러오는 중입니다." />
                    ) : likedPostsErrorMessage ? (
                      <EmptyState text={likedPostsErrorMessage} />
                    ) : likedPosts.length > 0 ? (
                      <div className="space-y-4">
                        {likedPosts.map((post) => (
                          <LikedPostRow key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="좋아요한 게시글이 없습니다." />
                    )
                  ) : (
                    isLoadingLikedReplies ? (
                      <EmptyState text="좋아요한 댓글을 불러오는 중입니다." />
                    ) : likedRepliesErrorMessage ? (
                      <EmptyState text={likedRepliesErrorMessage} />
                    ) : likedReplies.length > 0 ? (
                      <div className="space-y-4">
                        {likedReplies.map((reply) => (
                          <MyReplyRow key={reply.id} reply={reply} />
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="좋아요한 댓글이 없습니다." />
                    )
                  )}
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

function MyPostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/community/latest/${post.id}`}
      className="block rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-black text-gray-900">
            {post.title}
          </h4>
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {post.content}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-gray-400">
          {formatTime(post.createdAt)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
        <span>좋아요 {post.likeCount}</span>
        <span>댓글 {post.replyCount}</span>
      </div>
    </Link>
  );
}

function MyReplyRow({ reply }: { reply: Reply }) {
  return (
    <Link
      href={`/community/latest/${reply.postId}`}
      className="block rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-gray-900">
            {reply.targetNickname ? `${reply.targetNickname}님에게 남긴 댓글` : "작성한 댓글"}
          </h4>
          <p className="mt-2 line-clamp-3 text-sm text-gray-500">
            {reply.content}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-gray-400">
          {formatTime(reply.createdAt)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
        <span>좋아요 {reply.likeCount}</span>
        <span>답글 {reply.replyCount}</span>
      </div>
    </Link>
  );
}

function LikedPostRow({ post }: { post: LikedPost }) {
  return (
    <Link
      href={`/community/latest/${post.id}`}
      className="block rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-black text-gray-900">
            {post.title}
          </h4>
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {post.content}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-gray-400">
          {formatTime(post.createdAt)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
        <span>좋아요 {post.likeCount}</span>
        <span>댓글 {post.replyCount}</span>
      </div>
    </Link>
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
