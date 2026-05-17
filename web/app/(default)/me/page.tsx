"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBinanceWebSocket } from "@/hooks/useBinanceWebSocket";
import { useTickerStore } from "@/stores/useTickerStore";
import { useMarketStore, type MarketSymbolMeta } from "@/stores/useMarketStore";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { cn, getProfitColorClass, getSideColorClass } from "@/lib/utils/cs";

import {
  cancelReportedPost,
  cancelReportedReply,
  getLikedPosts,
  getLikedReplies,
  getMemberPosts,
  getMemberReplies,
  getReportedPosts,
  getReportedReplies,
} from "@/lib/api/me-community";
import type { Post, Reply } from "@/app/(default)/community/types/post";
import ProfileSidebar from "@/components/user/profile/ProfileSidebar";
import ProfileCommunitySection, {
  ProfileEmptyState,
} from "@/components/user/profile/ProfileCommunitySection";
import FollowMembersModal from "@/components/user/profile/FollowMembersModal";
import type {
  LikedPost,
  MyMemberProfile,
  ProfileReportItem,
  ReportedPost,
  ReportedReply,
} from "@/components/user/profile/types";
import {
  getMemberFollowers,
  getMemberFollowings,
  type FollowMember,
} from "@/lib/api/member";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Label,
} from "recharts";
import FolderTabs from "@/components/ui/FolderTabs";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import TickerCell from "@/components/trade/TickerCell";
import AssetSummaryCard, { type AssetSummary } from "@/components/asset/AssetSummaryCard";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  formatNumber,
  formatSignedNumber,
  formatSignedPercent
} from "@/lib/utils/number";
import {
  getBaseAssetLabel,
  getDefaultQuoteAssetLabel,
  getDisplaySymbolLabel,
} from "@/lib/utils/market-display";

import {
  getUnifiedRealAssetDetail,
  type RealAssetUnifiedResponse,
  type AssetPortfolioDetail,
  type FuturesPortfolioDetail,
  type FuturesPositionDetail
} from "@/lib/api/asset";
import {
  getMyParticipatingContestSeasons,
  getContestParticipationSeasonsByMember,
  getMyContestSeasonResult,
  type ContestParticipationSeason,
  type MyContestSeasonResult
} from "@/lib/api/contest";
import {
  getFuturesWalletStatus,
  getFinishedContestWalletStatus,
  getContestFuturesOpenPositions,
  type FuturesWalletStatus
} from "@/lib/api/contest-futures";
import type { FuturesPositionItem } from "@/types/futures";



type MainTab = "portfolio" | "community";
type PortfolioTab = "trade" | "contest" | "mock";
type TradingSubTab = "spot" | "futures";
type CommunityTab = "posts" | "replies" | "likedPosts" | "likedReplies" | "reports";
type FollowListType = "followers" | "followings";


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


const CHART_COLORS = [
  "#0058FF",
  "#9CB34E",
  "#1D7CA7",
  "#5F5592",
  "#B5679B",
  "#E97A31",
  "#00A6A6",
];

const FOLLOW_MEMBERS_PAGE_SIZE = 5;


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
    message.includes("현재 참여 중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("활성화된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.")
  );
};

const isWalletNotCreatedOrInactive = (error: any) => {
  const message = error?.message;
  if (!message) return false;
  return (
    message.includes("본투자 지갑이 비활성화 상태입니다") ||
    message.includes("인증 및 모의투자 3회를 완료") ||
    message.includes("활성화해주세요") ||
    message.includes("현재 참여중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("현재 참여 중인 모의투자 계좌가 존재하지 않습니다.") ||
    message.includes("생성된 모의투자 지갑을 찾을 수 없습니다.") ||
    message.includes("참가하기를 먼저 진행해주세요.") ||
    message.includes("참여 중인 대회가 존재하지 않습니다.") ||
    message.includes("지갑을 찾을 수 없습니다") ||
    message.includes("접근 권한이 없습니다.") ||
    message.includes("거래 가능한 대회 선물 지갑이 없습니다") ||
    message.includes("거래 가능한 대회 선물 지갑을 찾을 수 없습니다")
  );
};



/**
 * 특정 심볼의 실시간 시세를 구독하여 해당 셀만 업데이트하는 컴포넌트
 */

/**
 * 자산 요약 카드만 실시간으로 업데이트하는 래퍼 컴포넌트
 */
function RealtimeAssetSummary({
  portfolio,
  title,
  className
}: {
  portfolio: MockPortfolio;
  title: string;
  className?: string;
}) {
  const tickers = useTickerStore((state) => state.tickers);

  // 시세 기반 실시간 계산
  let totalCoinValue = 0;
  let totalBuyAmount = 0;

  portfolio.holdings.forEach((holding) => {
    const realtimePrice = tickers[holding.symbol]?.price ?? holding.currentPrice;
    totalCoinValue += holding.quantity * realtimePrice;
    totalBuyAmount += holding.buyAmount;
  });

  const totalProfit = totalCoinValue - totalBuyAmount;
  const totalRoi = totalBuyAmount > 0 ? (totalProfit / totalBuyAmount) * 100 : 0;
  const totalAsset = portfolio.cashBalance + totalCoinValue;

  const summary: AssetSummary = {
    title,
    cashBalance: portfolio.cashBalance,
    totalAsset,
    totalBuyAmount,
    totalCoinValue,
    totalProfit,
    totalRoi,
  };

  return <AssetSummaryCard summary={summary} className={className} />;
}

export default function MePage() {
  const router = useRouter();
  const { alert, confirm, toast } = useFeedback();

  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [memberProfile, setMemberProfile] = useState<MyMemberProfile | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("portfolio");
  const [portfolioTab, setPortfolioTab] = useState<PortfolioTab>("trade");
  const [tradingSubTab, setTradingSubTab] = useState<TradingSubTab>("spot");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("posts");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isLoadingMock, setIsLoadingMock] = useState(false);
  const [isLoadingReal, setIsLoadingReal] = useState(false);
  const [isLoadingContests, setIsLoadingContests] = useState(false);
  const [isLoadingContestResult, setIsLoadingContestResult] = useState(false);

  const [mockErrorMessage, setMockErrorMessage] = useState("");
  const [realErrorMessage, setRealErrorMessage] = useState("");
  const [contestErrorMessage, setContestErrorMessage] = useState("");

  const marketSymbols = useMarketStore((state: any) => state.marketSymbols);
  const fetchMarketSymbols = useMarketStore((state: any) => state.fetchMarketSymbols);

  const [mockPortfolio, setMockPortfolio] = useState<MockPortfolio | null>(null);
  const [realAsset, setRealAsset] = useState<RealAssetUnifiedResponse | null>(null);
  const [participatingContests, setParticipatingContests] = useState<ContestParticipationSeason[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [contestResult, setContestResult] = useState<MyContestSeasonResult | null>(null);
  const [contestWallet, setContestWallet] = useState<FuturesWalletStatus | null>(null);
  const [contestPositions, setContestPositions] = useState<FuturesPositionItem[]>([]);
  const [isLoadingContestWallet, setIsLoadingContestWallet] = useState(false);
  const [isLoadingContestPositions, setIsLoadingContestPositions] = useState(false);



  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [communityReplies, setCommunityReplies] = useState<Reply[]>([]);
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [likedReplies, setLikedReplies] = useState<Reply[]>([]);
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedReplies, setReportedReplies] = useState<ReportedReply[]>([]);
  const [isLoadingCommunityPosts, setIsLoadingCommunityPosts] = useState(false);
  const [isLoadingCommunityReplies, setIsLoadingCommunityReplies] = useState(false);
  const [isLoadingLikedPosts, setIsLoadingLikedPosts] = useState(false);
  const [isLoadingLikedReplies, setIsLoadingLikedReplies] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [communityPostsErrorMessage, setCommunityPostsErrorMessage] = useState("");
  const [communityRepliesErrorMessage, setCommunityRepliesErrorMessage] = useState("");
  const [likedPostsErrorMessage, setLikedPostsErrorMessage] = useState("");
  const [likedRepliesErrorMessage, setLikedRepliesErrorMessage] = useState("");
  const [reportsErrorMessage, setReportsErrorMessage] = useState("");
  const [cancellingReportKey, setCancellingReportKey] = useState<string | null>(null);

  const logout = useAuthStore((state) => state.logout);

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [followListType, setFollowListType] = useState<FollowListType | null>(null);
  const [followMembers, setFollowMembers] = useState<FollowMember[]>([]);
  const [isLoadingFollowMembers, setIsLoadingFollowMembers] = useState(false);
  const [isLoadingMoreFollowMembers, setIsLoadingMoreFollowMembers] = useState(false);
  const [followMembersErrorMessage, setFollowMembersErrorMessage] = useState("");
  const [nextFollowMembersCursorId, setNextFollowMembersCursorId] = useState<number | null>(null);
  const [hasNextFollowMembers, setHasNextFollowMembers] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isContestFinished = useMemo(() => {
    if (portfolioTab !== "contest" || !selectedContestId) return false;
    const selectedContest = participatingContests.find((c) => c.seasonId === selectedContestId);
    return selectedContest?.displayStatus === "FINISHED" || selectedContest?.displayStatus === "SETTLED";
  }, [portfolioTab, selectedContestId, participatingContests]);

  // 실시간 시세 웹소켓 연결
  useBinanceWebSocket();

  // 실시간 갱신 로직은 이제 개별 컴포넌트 내부로 이동하거나 
  // 필요한 최소 단위로 쪼개어 처리합니다.
  const [realtimeMockSummary, setRealtimeMockSummary] = useState<{
    totalAsset: number;
    totalProfit: number;
    totalRoi: number;
    totalCoinValue: number;
  } | null>(null);

  // SSE 체결 알림 수신 시 데이터 리프레시
  useEffect(() => {
    const handleTradeCompleted = () => {
      console.log("Real-time Me Dashboard Refreshing...");
      setRefreshKey((prev) => prev + 1);
    };

    const events = [
      "NOTIFICATION_MOCK_ORDER_COMPLETED",
      "NOTIFICATION_TRADE_ORDER_COMPLETED",
      "NOTIFICATION_CONTEST_ORDER_COMPLETED",
    ];

    const unsubs = events.map((event) => {
      const eventName = getNotificationSseBridgeEventName(event as any);
      window.addEventListener(eventName, handleTradeCompleted);
      return () => window.removeEventListener(eventName, handleTradeCompleted);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    void fetchMarketSymbols();
  }, [fetchMarketSymbols]);

  useEffect(() => {
    if (!isMounted) return;

    let isActive = true;

    const loadMemberProfile = async () => {
      try {
        const response = await fetch(`/api/v1/member/me/info`, {
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
          ? (data.data as MyMemberProfile)
          : (data as MyMemberProfile | null);

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
    if (!isMounted || !memberProfile || portfolioTab !== "trade") return;

    const loadRealData = async () => {
      setIsLoadingReal(true);
      setRealErrorMessage("");

      try {
        const data = await getUnifiedRealAssetDetail();
        setRealAsset(data);
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Real wallet is not created or inactive:", error.message);
          setRealAsset(null);
          setRealErrorMessage("보유 중인 본투자 자산이 없습니다.");
        } else {
          console.error("failed to load real asset:", error);
          setRealErrorMessage("트레이딩 자산 정보를 불러오지 못했습니다.");
        }
      } finally {
        setIsLoadingReal(false);
      }
    };

    void loadRealData();
  }, [isMounted, memberProfile, portfolioTab, refreshKey]);

  useEffect(() => {
    if (!isMounted || !memberProfile || portfolioTab !== "contest") return;

    const loadContests = async () => {
      setIsLoadingContests(true);
      setContestErrorMessage("");

      try {
        const response = await getContestParticipationSeasonsByMember(memberProfile.memberId, { size: 50 });
        const content = response.content || [];
        setParticipatingContests(content);

        if (content.length > 0 && !selectedContestId) {
          setSelectedContestId(content[0].seasonId);
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Contests load skipped: wallet inactive/not created.");
          setParticipatingContests([]);
          setContestErrorMessage("참여 중인 대회가 존재하지 않습니다.");
        } else {
          console.error("failed to load participating contests:", error);
          setContestErrorMessage("참여 중인 대회 목록을 불러오지 못했습니다.");
        }
      } finally {
        setIsLoadingContests(false);
      }
    };

    void loadContests();
  }, [isMounted, memberProfile, portfolioTab]);

  useEffect(() => {
    if (!isMounted || !selectedContestId || portfolioTab !== "contest") return;

    const loadContestResult = async () => {
      setIsLoadingContestResult(true);
      try {
        const result = await getMyContestSeasonResult(selectedContestId);
        setContestResult(result);
      } catch (error: any) {
        console.warn("Failed to load contest result on me page:", error?.message || error);
        setContestResult(null);
      } finally {
        setIsLoadingContestResult(false);
      }
    };

    void loadContestResult();
  }, [isMounted, selectedContestId, portfolioTab]);

  useEffect(() => {
    if (!isMounted || !selectedContestId || portfolioTab !== "contest") return;
    if (participatingContests.length === 0) return;

    const loadContestWallet = async () => {
      setIsLoadingContestWallet(true);
      try {
        const selectedContest = participatingContests.find(c => c.seasonId === selectedContestId);
        const isFinished = selectedContest?.displayStatus === "FINISHED" || selectedContest?.displayStatus === "SETTLED";

        const wallet = isFinished
          ? await getFinishedContestWalletStatus(selectedContestId)
          : await getFuturesWalletStatus(selectedContestId);

        setContestWallet(wallet);
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Contest wallet load skipped: wallet inactive/not created.");
          setContestWallet(null);
        } else {
          console.error("failed to load contest wallet:", error);
          setContestWallet(null);
        }
      } finally {
        setIsLoadingContestWallet(false);
      }
    };

    void loadContestWallet();
  }, [isMounted, selectedContestId, portfolioTab, participatingContests]);

  useEffect(() => {
    if (!isMounted || !selectedContestId || portfolioTab !== "contest") return;
    if (participatingContests.length === 0) return;

    const loadContestPositions = async () => {
      setIsLoadingContestPositions(true);
      try {
        const selectedContest = participatingContests.find(c => c.seasonId === selectedContestId);
        const isFinished = selectedContest?.displayStatus === "FINISHED" || selectedContest?.displayStatus === "SETTLED";

        if (isFinished) {
          setContestPositions([]);
        } else {
          const response = await getContestFuturesOpenPositions(selectedContestId);
          setContestPositions(response.content || []);
        }
      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Contest positions load skipped: wallet inactive/not created.");
          setContestPositions([]);
        } else {
          console.error("failed to load contest positions:", error);
          setContestPositions([]);
        }
      } finally {
        setIsLoadingContestPositions(false);
      }
    };

    void loadContestPositions();
  }, [isMounted, selectedContestId, portfolioTab, participatingContests]);



  useEffect(() => {
    if (!isMounted || !memberProfile || portfolioTab !== "mock") return;

    const loadMockData = async () => {
      setIsLoadingMock(true);
      setMockErrorMessage("");

      try {
        const portfolioResponse = await fetch(
          `/api/v1/asset/mock/portfolio`,
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

      } catch (error: any) {
        if (isWalletNotCreatedOrInactive(error)) {
          console.warn("Mock portfolio load skipped: wallet inactive/not created.");
          setMockPortfolio(null);
          setMockErrorMessage("모의투자 계좌를 생성하면 데이터가 표시됩니다.");
        } else {
          console.error("포트폴리오 조회 실패:", error);
          setMockPortfolio(null);
          setMockErrorMessage("모의투자 포트폴리오를 불러오지 못했습니다.");
        }
      }

      setIsLoadingMock(false);
    };

    void loadMockData();
  }, [isMounted, logout, memberProfile, portfolioTab, router, refreshKey]);

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
    if (!isMounted || !memberProfile || !followListType) return;

    let isActive = true;

    const loadFollowMembers = async () => {
      setIsLoadingFollowMembers(true);
      setFollowMembersErrorMessage("");

      try {
        const response =
          followListType === "followers"
            ? await getMemberFollowers(memberProfile.memberId, {
              size: FOLLOW_MEMBERS_PAGE_SIZE,
            })
            : await getMemberFollowings(memberProfile.memberId, {
              size: FOLLOW_MEMBERS_PAGE_SIZE,
            });

        if (!isActive) return;

        setFollowMembers(
          response && Array.isArray(response.content) ? response.content : []
        );
        setNextFollowMembersCursorId(response.nextCursorId ?? null);
        setHasNextFollowMembers(response.hasNext === true);
      } catch (error) {
        console.error("failed to load follow members:", error);

        if (!isActive) return;

        setFollowMembers([]);
        setFollowMembersErrorMessage("목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setNextFollowMembersCursorId(null);
        setHasNextFollowMembers(false);
      } finally {
        if (isActive) {
          setIsLoadingFollowMembers(false);
        }
      }
    };

    void loadFollowMembers();

    return () => {
      isActive = false;
    };
  }, [followListType, isMounted, memberProfile]);

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

  useEffect(() => {
    if (!isMounted || !memberProfile) return;
    if (mainTab !== "community" || communityTab !== "reports") return;

    let isActive = true;

    const loadReports = async () => {
      setIsLoadingReports(true);
      setReportsErrorMessage("");

      try {
        const [reportedPostsResponse, reportedRepliesResponse] = await Promise.all([
          getReportedPosts({ size: 5 }),
          getReportedReplies({ size: 5 }),
        ]);

        if (!isActive) return;

        setReportedPosts(
          reportedPostsResponse && Array.isArray(reportedPostsResponse.content)
            ? (reportedPostsResponse.content as ReportedPost[])
            : []
        );
        setReportedReplies(
          reportedRepliesResponse && Array.isArray(reportedRepliesResponse.content)
            ? (reportedRepliesResponse.content as ReportedReply[])
            : []
        );
      } catch (error) {
        console.error("failed to load reports:", error);

        if (!isActive) return;

        setReportedPosts([]);
        setReportedReplies([]);
        setReportsErrorMessage("신고내역을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingReports(false);
        }
      }
    };

    void loadReports();

    return () => {
      isActive = false;
    };
  }, [communityTab, isMounted, mainTab, memberProfile]);

  const handleMoveEdit = () => {
    router.push("/me/settings");
  };

  const handleOpenFollowers = () => {
    setFollowListType("followers");
  };

  const handleOpenFollowings = () => {
    setFollowListType("followings");
  };

  const handleCloseFollowMembersModal = () => {
    setFollowListType(null);
    setFollowMembers([]);
    setFollowMembersErrorMessage("");
    setNextFollowMembersCursorId(null);
    setHasNextFollowMembers(false);
    setIsLoadingMoreFollowMembers(false);
  };

  const handleLoadMoreFollowMembers = async () => {
    if (
      !memberProfile ||
      !followListType ||
      nextFollowMembersCursorId == null ||
      isLoadingMoreFollowMembers
    ) {
      return;
    }

    setIsLoadingMoreFollowMembers(true);

    try {
      const response =
        followListType === "followers"
          ? await getMemberFollowers(memberProfile.memberId, {
            cursorId: nextFollowMembersCursorId,
            size: FOLLOW_MEMBERS_PAGE_SIZE,
          })
          : await getMemberFollowings(memberProfile.memberId, {
            cursorId: nextFollowMembersCursorId,
            size: FOLLOW_MEMBERS_PAGE_SIZE,
          });

      setFollowMembers((prev) => [
        ...prev,
        ...(response && Array.isArray(response.content) ? response.content : []),
      ]);
      setNextFollowMembersCursorId(response.nextCursorId ?? null);
      setHasNextFollowMembers(response.hasNext === true);
    } catch (error) {
      console.error("failed to load more follow members:", error);
      await alert("목록을 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoadingMoreFollowMembers(false);
    }
  };

  const handleCancelReport = async (report: ProfileReportItem) => {
    const reportKey = `${report.type}-${report.id}`;

    if (cancellingReportKey) return;

    const confirmed = await confirm({
      description: "신고를 취소하시겠습니까?",
      confirmText: "확인",
      cancelText: "닫기",
    });
    if (!confirmed) return;

    setCancellingReportKey(reportKey);

    try {
      if (report.type === "post") {
        await cancelReportedPost(report.postId);
        setReportedPosts((prev) => prev.filter((item) => item.id !== report.id));
      } else {
        await cancelReportedReply(report.postId, report.id);
        setReportedReplies((prev) => prev.filter((item) => item.id !== report.id));
      }

      toast({
        title: "신고가 취소되었습니다.",
        tone: "success",
      });
    } catch (error) {
      console.error("failed to cancel report:", error);
      await alert("신고 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCancellingReportKey(null);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    const confirmed = await confirm("로그아웃 하시겠습니까?");
    if (!confirmed) return;

    setIsLoggingOut(true);

    try {
      await fetch(`/api/v1/auth/logout`, {
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
      toast({
        title: "로그아웃되었습니다.",
        tone: "success",
      });
      router.replace("/");
    }
  };

  // 회원탈퇴
  const handleWithdraw = async () => {
    if (isDeletingAccount) return;

    const confirmed = await confirm({
      description: "정말 회원 탈퇴하시겠습니까?",
      confirmText: "탈퇴",
      tone: "danger",
    });
    if (!confirmed) return;

    setIsDeletingAccount(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/member/me`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        logout();
        setMemberProfile(null);
        setMockPortfolio(null);
        setProfileErrorMessage("");
        await alert("로그인 정보가 만료되었습니다.");
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
      toast({
        title: "회원 탈퇴가 완료되었습니다.",
        tone: "success",
      });
      router.replace("/");
    } catch (error) {
      console.error("failed to withdraw member:", error);
      await alert("회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsDeletingAccount(false);
    }
  };


  const pieData = useMemo(() => {
    if (portfolioTab !== "mock" || !mockPortfolio) return [];

    const holdingsData = mockPortfolio.holdings
      .filter((item) => item.quantity > 0)
      .map((item, index) => {
        // 차트의 안정성을 위해 실시간 시세 대신 포트폴리오 로드 시점의 가격 사용
        const price = item.currentPrice;
        const totalValue = item.quantity * price;

        return {
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: mockPortfolio.totalAsset > 0 ? (totalValue / mockPortfolio.totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        };
      });

    const cashRatio =
      mockPortfolio.totalAsset > 0 ? (mockPortfolio.cashBalance / mockPortfolio.totalAsset) * 100 : 0;

    if (cashRatio > 0) {
      holdingsData.unshift({
        name: getDefaultQuoteAssetLabel(marketSymbols) || "현금",
        value: cashRatio,
        color: CHART_COLORS[0],
      });
    }

    return holdingsData.filter((item) => item.value > 0);
  }, [portfolioTab, mockPortfolio, marketSymbols]);

  const realSpotPieData = useMemo(() => {
    if (portfolioTab !== "trade" || !realAsset) return [];

    const holdingsData = realAsset.spot.holdings
      .filter((item) => item.quantity > 0)
      .map((item, index) => {
        const price = item.currentPrice;
        const totalValue = item.quantity * price;

        return {
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: realAsset.spot.totalAsset > 0 ? (totalValue / realAsset.spot.totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        };
      });

    const cashRatio =
      realAsset.spot.totalAsset > 0 ? (realAsset.spot.cashBalance / realAsset.spot.totalAsset) * 100 : 0;

    if (cashRatio > 0) {
      holdingsData.unshift({
        name: getDefaultQuoteAssetLabel(marketSymbols) || "현금",
        value: cashRatio,
        color: CHART_COLORS[0],
      });
    }

    return holdingsData.filter((item) => item.value > 0);
  }, [portfolioTab, realAsset, marketSymbols]);

  const futuresAssetPieData = useMemo(() => {
    if (portfolioTab !== "trade" || !realAsset) return [];

    const totalAsset = realAsset.futures.totalAsset;
    const totalMargin = realAsset.futures.totalMargin;
    const availableBalance = realAsset.futures.cashBalance;

    return [
      { name: "사용 중인 증거금", value: totalAsset > 0 ? (totalMargin / totalAsset) * 100 : 0, color: "#0058FF" },
      { name: "사용 가능 잔고", value: totalAsset > 0 ? (availableBalance / totalAsset) * 100 : 0, color: "#E0E7FF" },
    ].filter(item => item.value > 0);
  }, [portfolioTab, realAsset]);

  const futuresLongShortData = useMemo(() => {
    if (portfolioTab !== "trade" || !realAsset) return { long: 0, short: 0 };

    let longMargin = 0;
    let shortMargin = 0;

    realAsset.futures.positions.forEach(pos => {
      if (pos.positionSide === "LONG") longMargin += pos.margin;
      else shortMargin += pos.margin;
    });

    const totalMargin = longMargin + shortMargin;
    if (totalMargin === 0) return { long: 0, short: 0 };

    return {
      long: (longMargin / totalMargin) * 100,
      short: (shortMargin / totalMargin) * 100,
    };
  }, [portfolioTab, realAsset]);

  const contestAssetPieData = useMemo(() => {
    if (portfolioTab !== "contest" || !contestWallet) return [];

    const totalAsset = contestWallet.currentMoney;
    const totalMargin = contestWallet.marginInUse;
    const availableBalance = totalAsset - totalMargin;

    return [
      { name: "대회 증거금", value: totalAsset > 0 ? (totalMargin / totalAsset) * 100 : 0, color: "#1D7CA7" },
      { name: "사용 가능 잔고", value: totalAsset > 0 ? (availableBalance / totalAsset) * 100 : 0, color: "#F0F9FF" },
    ].filter(item => item.value > 0);
  }, [portfolioTab, contestWallet]);

  const contestLongShortData = useMemo(() => {
    if (portfolioTab !== "contest" || contestPositions.length === 0) return { long: 0, short: 0 };

    let longMargin = 0;
    let shortMargin = 0;

    contestPositions.forEach(pos => {
      if (pos.positionSide === "LONG") longMargin += pos.totalMargin;
      else shortMargin += pos.totalMargin;
    });

    const totalMargin = longMargin + shortMargin;
    if (totalMargin === 0) return { long: 0, short: 0 };

    return {
      long: (longMargin / totalMargin) * 100,
      short: (shortMargin / totalMargin) * 100,
    };
  }, [portfolioTab, contestPositions]);




  const reportItems = useMemo<ProfileReportItem[]>(() => {
    const normalizedReportedPosts = reportedPosts.map((post) => ({
      type: "post" as const,
      id: post.id,
      postId: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      likeCount: post.likeCount,
      replyCount: post.replyCount,
      reportCount: post.reportCount,
      reportReasonLabel: post.reportReason.label,
    }));

    const normalizedReportedReplies = reportedReplies.map((reply) => ({
      type: "reply" as const,
      id: reply.id,
      postId: reply.postId,
      title: reply.targetNickname
        ? `${reply.targetNickname}님에게 남긴 댓글`
        : "신고한 댓글",
      content: reply.content,
      createdAt: reply.createdAt,
      likeCount: reply.likeCount,
      replyCount: reply.replyCount,
      reportCount: reply.reportCount,
      reportReasonLabel: reply.reportReason.label,
    }));

    return [...normalizedReportedPosts, ...normalizedReportedReplies].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [reportedPosts, reportedReplies]);

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


  const renderCommunityTabContent = (tab: CommunityTab) => (
    <ProfileCommunitySection
      communityTab={tab}
      onChange={(value) => setCommunityTab(value as CommunityTab)}
      posts={communityPosts}
      replies={communityReplies}
      likedPosts={likedPosts}
      likedReplies={likedReplies}
      reports={reportItems}
      isLoadingPosts={isLoadingCommunityPosts}
      isLoadingReplies={isLoadingCommunityReplies}
      isLoadingLikedPosts={isLoadingLikedPosts}
      isLoadingLikedReplies={isLoadingLikedReplies}
      isLoadingReports={isLoadingReports}
      postsErrorMessage={communityPostsErrorMessage}
      repliesErrorMessage={communityRepliesErrorMessage}
      likedPostsErrorMessage={likedPostsErrorMessage}
      likedRepliesErrorMessage={likedRepliesErrorMessage}
      reportsErrorMessage={reportsErrorMessage}
      isOwnProfile={true}
      onCancelReport={(report) => void handleCancelReport(report)}
      cancellingReportKey={cancellingReportKey}
      showTabs={false}
      showSurface={false}
    />
  );

  const renderPortfolioTabContent = (tab: PortfolioTab) => {
    if (tab === "trade") {
      if (isLoadingReal) {
        return <div className="py-24 text-center text-gray-300 font-bold">트레이딩 데이터를 불러오는 중입니다.</div>;
      }

      if (!realAsset) {
        return <div className="py-24 text-center text-gray-300 font-bold">{realErrorMessage || "트레이딩 데이터가 없습니다."}</div>;
      }

      return (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTradingSubTab("spot")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-black transition-all",
                tradingSubTab === "spot"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              현물
            </button>
            <button
              onClick={() => setTradingSubTab("futures")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-black transition-all",
                tradingSubTab === "futures"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              선물
            </button>
          </div>

          {tradingSubTab === "spot" ? (
            <div className="space-y-10">
              <div>
                <h3 className="mb-8 text-lg font-black text-gray-900">
                  현물 자산 포트폴리오 비중
                </h3>

                {realSpotPieData.length === 0 ? (
                  <div className="py-24 text-center text-gray-300 font-bold">
                    비중을 표시할 자산이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="h-64 w-full md:w-1/2 relative">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={realSpotPieData}
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={400}
                            animationEasing="ease-out"
                          >
                            {realSpotPieData.map((entry, i) => (
                              <Cell key={entry.name} fill={entry.color || CHART_COLORS[i]} />
                            ))}
                            <Label
                              value="보유 비중(%)"
                              position="center"
                              fill="#999"
                              style={{ fontSize: "12px", fontWeight: "bold" }}
                            />
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            formatter={(value) => {
                              const parsedValue = Array.isArray(value)
                                ? Number(value[0])
                                : Number(value ?? 0);
                              const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;

                              return [`${safeValue.toFixed(2)}%`, "비중"];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 w-full md:w-1/2">
                      {realSpotPieData.map((item) => (
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
              </div>

              <div className="border-t border-gray-100 pt-10">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">현물 보유자산 목록</h3>
                </div>
                {realAsset.spot.holdings.length > 0 ? (
                  <div className="space-y-4">
                    {realAsset.spot.holdings.map((item) => (
                      <HoldingRow
                        key={item.symbol}
                        item={item as unknown as MockHolding}
                        marketSymbols={marketSymbols}
                        quoteAssetName={getDefaultQuoteAssetLabel(marketSymbols)}
                      />
                    ))}
                  </div>
                ) : (
                  <ProfileEmptyState text="보유 중인 현물 자산이 없습니다." />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card p-6">
                  <h4 className="text-sm font-black text-gray-900 mb-6">증거금 사용 비중</h4>
                  <div className="h-48 relative">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={futuresAssetPieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {futuresAssetPieData.map((entry, i) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(val) => [`${Number(val).toFixed(2)}%`, "비중"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xxs font-bold text-gray-400">증거금</span>
                      <span className="text-sm font-black text-blue-600">
                        {futuresAssetPieData.find(d => d.name === "사용 중인 증거금")?.value.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {futuresAssetPieData.map(item => (
                      <div key={item.name} className="flex justify-between items-center text-xxs font-bold">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-gray-900">{item.value.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h4 className="text-sm font-black text-gray-900 mb-6">롱/숏 포지션 비율</h4>
                  <div className="flex flex-col justify-center h-full -mt-4">
                    <div className="flex justify-between text-xxs font-black mb-2">
                      <span className="text-red-500 uppercase">Long {futuresLongShortData.long.toFixed(1)}%</span>
                      <span className="text-blue-500 uppercase">Short {futuresLongShortData.short.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${futuresLongShortData.long}%` }}
                      />
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${futuresLongShortData.short}%` }}
                      />
                    </div>
                    <p className="mt-4 text-[11px] text-gray-400 font-medium leading-relaxed">
                      현재 보유 중인 모든 포지션의 증거금 합계를 기준으로 계산된 투자 방향 비중입니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-10">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">선물 포지션 현황</h3>
                </div>
                {realAsset.futures.positions.length > 0 ? (
                  <div className="space-y-4">
                    {realAsset.futures.positions.map((position) => (
                      <PositionRow
                        key={`${position.symbol}-${position.positionSide}`}
                        position={position}
                        marketSymbols={marketSymbols}
                      />
                    ))}
                  </div>
                ) : (
                  <ProfileEmptyState text="보유 중인 선물 포지션이 없습니다." />
                )}
              </div>
            </div>
          )}

        </div>
      );
    }

    if (tab === "contest") {
      if (isLoadingContests) {
        return <div className="py-24 text-center text-gray-300 font-bold">참여 중인 대회 목록을 불러오는 중입니다.</div>;
      }

      if (participatingContests.length === 0) {
        return <div className="py-24 text-center text-gray-300 font-bold">참여 중인 대회가 없습니다.</div>;
      }

      return (
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-gray-500">참여 대회 선택</label>
            <Select
              fullWidth={true}
              options={participatingContests.map((contest) => {
                const isFinished = contest.displayStatus === "FINISHED" || contest.displayStatus === "SETTLED";
                return {
                  label: (
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-bold text-gray-900 dark:text-gray-100 truncate">{contest.seasonTitle}</span>
                      {isFinished ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-gray-50 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                          종료
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/30 text-[#0058FF] dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                          진행중
                        </span>
                      )}
                    </div>
                  ),
                  value: contest.seasonId,
                };
              })}
              value={selectedContestId || ""}
              onChange={(val) => setSelectedContestId(Number(val))}
              placeholder="대회 선택"
            />
          </div>

          {isContestFinished ? (
            (() => {
              const selectedContest = participatingContests.find(c => c.seasonId === selectedContestId);
              const displayTitle = contestResult?.seasonTitle || selectedContest?.seasonTitle || "대회";
              const displayRank = contestResult?.finalRank !== undefined && contestResult.finalRank > 0 
                ? `${contestResult.finalRank}위` 
                : "집계중";
              const displayRealizedPnl = contestResult?.finalRealizedPnl !== undefined
                ? contestResult.finalRealizedPnl
                : (contestWallet ? (contestWallet.currentMoney - contestWallet.seedMoney) : 0);
              const displayProfitRate = (contestResult?.finalProfitRate !== undefined && contestResult.finalProfitRate !== 0)
                ? contestResult.finalProfitRate
                : (contestWallet && contestWallet.seedMoney > 0 ? ((displayRealizedPnl / contestWallet.seedMoney) * 100) : 0);

              return (
                <div className="card p-8 bg-blue-50/30 border-blue-100 dark:border-blue-900/50 mb-10">
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-black">
                      {displayRank}
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-black text-gray-900 dark:text-gray-100">{displayTitle}</h4>
                      <p className="text-sm font-bold text-gray-500 mt-1">최종 순위: {displayRank}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 w-full mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">실현 손익</p>
                        <p className={cn("text-lg font-black", getProfitColorClass(displayRealizedPnl))}>
                          {formatSignedNumber(displayRealizedPnl)} USDT
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">수익률</p>
                        <p className={cn("text-lg font-black", getProfitColorClass(displayProfitRate))}>
                          {formatSignedPercent(displayProfitRate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : null}

          {!isContestFinished && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card p-6">
                  <h4 className="text-sm font-black text-gray-900 mb-6">대회 증거금 비중</h4>
                  <div className="h-48 relative">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={contestAssetPieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {contestAssetPieData.map((entry, i) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(val) => [`${Number(val).toFixed(2)}%`, "비중"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xxs font-bold text-gray-400">증거금</span>
                      <span className="text-sm font-black text-cyan-600">
                        {contestAssetPieData.find(d => d.name === "대회 증거금")?.value.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {contestAssetPieData.map(item => (
                      <div key={item.name} className="flex justify-between items-center text-xxs font-bold">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </span>
                        <span className="text-gray-900">{item.value.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h4 className="text-sm font-black text-gray-900 mb-6">대회 포지션 비율</h4>
                  <div className="flex flex-col justify-center h-full -mt-4">
                    <div className="flex justify-between text-xxs font-black mb-2">
                      <span className="text-red-500 uppercase">Long {contestLongShortData.long.toFixed(1)}%</span>
                      <span className="text-blue-500 uppercase">Short {contestLongShortData.short.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{ width: `${contestLongShortData.long}%` }}
                      />
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${contestLongShortData.short}%` }}
                      />
                    </div>
                    <p className="mt-4 text-[11px] text-gray-400 font-medium leading-relaxed">
                      선택한 대회에서 보유 중인 포지션의 증거금 합계를 기준으로 계산된 비중입니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-10">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">대회 포지션 현황</h3>
                </div>
                {isLoadingContestPositions ? (
                  <div className="py-12 text-center text-gray-400 font-bold">포지션 정보를 불러오는 중...</div>
                ) : contestPositions.length > 0 ? (
                  <div className="space-y-4">
                    {contestPositions.map((position) => (
                      <PositionRow
                        key={`${position.symbol}-${position.positionSide}`}
                        position={position as unknown as FuturesPositionDetail}
                        marketSymbols={marketSymbols}
                      />
                    ))}
                  </div>
                ) : (
                  <ProfileEmptyState text="현재 보유 중인 대회 포지션이 없습니다." />
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tab !== "mock") {
      return (
        <div className="py-24 text-center text-gray-300 font-bold">
          {tab === "trade"
            ? "트레이딩 데이터는 아직 준비 중입니다."
            : "대회 데이터는 아직 준비 중입니다."}
        </div>
      );
    }

    if (isLoadingMock) {
      return (
        <div className="py-24 text-center text-gray-300 font-bold">
          모의투자 데이터를 불러오는 중입니다.
        </div>
      );
    }

    if (!mockPortfolio) {
      return (
        <div className="py-24 text-center text-gray-300 font-bold">
          {mockErrorMessage || "모의투자 데이터가 없습니다."}
        </div>
      );
    }

    return (
      <div className="space-y-10">
        <div>
          <h3 className="mb-8 text-lg font-black text-gray-900">
            자산 포트폴리오 비중
          </h3>

          {pieData.length === 0 ? (
            <div className="py-24 text-center text-gray-300 font-bold">
              비중을 표시할 자산이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="h-64 w-full md:w-1/2 relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={75}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      animationDuration={400}
                      animationEasing="ease-out"
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
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value) => {
                        const parsedValue = Array.isArray(value)
                          ? Number(value[0])
                          : Number(value ?? 0);
                        const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;

                        return [`${safeValue.toFixed(2)}%`, "비중"];
                      }}
                    />
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
        </div>

        <div className="border-t border-gray-100 pt-10">
          <div className="mb-6">
            <h3 className="text-lg font-black text-gray-900">
              보유자산 목록
            </h3>
          </div>

          {mockPortfolio.holdings.length > 0 ? (
            <div className="space-y-4">
              {mockPortfolio.holdings.map((item) => (
                <HoldingRow
                  key={item.symbol}
                  item={item}
                  marketSymbols={marketSymbols}
                  quoteAssetName={getDefaultQuoteAssetLabel(marketSymbols)}
                />
              ))}
            </div>
          ) : (
            <ProfileEmptyState text="보유 중인 모의투자 자산이 없습니다." />
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-96 lg:sticky lg:top-24 space-y-6">
          <ProfileSidebar
            profile={memberProfile}
            onClickFollowers={handleOpenFollowers}
            onClickFollowings={handleOpenFollowings}
            actionArea={
              <>
                <div className="grid grid-cols-2 gap-2 w-full mb-2">
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
                  <Button
                    variant="white"
                    fullWidth={true}
                    className="mb-2"
                    onClick={() => router.push("/verify?source=me")}
                  >
                    회원 인증하기
                  </Button>
                ) : null}
              </>
            }
          />

          {portfolioTab === "mock" && mockPortfolio ? (
            <RealtimeAssetSummary
              portfolio={mockPortfolio}
              title="모의투자 자산"
            />
          ) : portfolioTab === "trade" && realAsset ? (
            <AssetSummaryCard
              summary={{
                title: "트레이딩 자산",
                cashBalance: realAsset.totalAsset - (realAsset.spot.totalCoinValue + realAsset.futures.totalMargin),
                totalAsset: realAsset.totalAsset,
                totalBuyAmount: realAsset.spot.totalBuyAmount,
                totalCoinValue: realAsset.spot.totalCoinValue + realAsset.futures.totalMargin,
                totalProfit: realAsset.totalProfit,
                totalRoi: (realAsset.totalProfit / (realAsset.totalAsset - realAsset.totalProfit)) * 100,
              }}
            />
          ) : portfolioTab === "contest" && contestWallet && !isContestFinished ? (
            <AssetSummaryCard
              summary={{
                title: "대회 자산",
                cashBalance: contestWallet.currentMoney - contestWallet.marginInUse,
                totalAsset: contestWallet.currentMoney,
                totalBuyAmount: contestWallet.seedMoney,
                totalCoinValue: contestWallet.marginInUse,
                totalProfit: contestWallet.currentMoney - contestWallet.seedMoney,
                totalRoi: contestWallet.seedMoney > 0 ? ((contestWallet.currentMoney - contestWallet.seedMoney) / contestWallet.seedMoney) * 100 : 0,
              }}
            />
          ) : !isContestFinished ? (
            <AssetSummaryCard
              summary={{
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
              }}
            />
          ) : null}



          <div className="hidden lg:block">
            <Button
              variant="white"
              fullWidth={true}
              onClick={handleWithdraw}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "탈퇴 처리 중..." : "회원 탈퇴"}
            </Button>
          </div>

        </aside>

        <main className="flex-1 w-full space-y-6">
          <Tabs
            tabs={[
              { label: "나의 포트폴리오", value: "portfolio" },
              { label: "커뮤니티", value: "community" },
            ]}
            activeTab={mainTab}
            onChange={(value) => setMainTab(value as MainTab)}
            fullWidth={false}
          />

          {mainTab === "portfolio" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <FolderTabs
                tabs={[
                  { id: "mock", label: "모의투자", content: renderPortfolioTabContent("mock") },
                  { id: "trade", label: "트레이딩", content: renderPortfolioTabContent("trade") },
                  { id: "contest", label: "대회", content: renderPortfolioTabContent("contest") },
                ]}
                activeId={portfolioTab}
                onChange={(id) => setPortfolioTab(id as PortfolioTab)}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <FolderTabs
                tabs={[
                  { id: "posts", label: "게시글", content: renderCommunityTabContent("posts") },
                  { id: "replies", label: "댓글", content: renderCommunityTabContent("replies") },
                  { id: "likedPosts", label: "좋아요", content: renderCommunityTabContent("likedPosts") },
                  { id: "likedReplies", label: "좋아요 댓글", content: renderCommunityTabContent("likedReplies") },
                  { id: "reports", label: "신고내역", content: renderCommunityTabContent("reports") },
                ]}
                activeId={communityTab}
                onChange={(id) => setCommunityTab(id as CommunityTab)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile-only Account Deletion Button at the bottom of the page */}
      <div className="block lg:hidden mt-8 w-full">
        <Button
          variant="white"
          fullWidth={true}
          onClick={handleWithdraw}
          disabled={isDeletingAccount}
        >
          {isDeletingAccount ? "탈퇴 처리 중..." : "회원 탈퇴"}
        </Button>
      </div>

      <FollowMembersModal
        type={followListType}
        members={followMembers}
        isLoading={isLoadingFollowMembers}
        isLoadingMore={isLoadingMoreFollowMembers}
        errorMessage={followMembersErrorMessage}
        hasNext={hasNextFollowMembers}
        onClose={handleCloseFollowMembersModal}
        onLoadMore={() => void handleLoadMoreFollowMembers()}
      />
    </div>
  );
}

function HoldingRow({
  item,
  marketSymbols,
  quoteAssetName,
}: {
  item: MockHolding;
  marketSymbols: MarketSymbolMeta[];
  quoteAssetName: string;
}) {
  const baseAssetName = getBaseAssetLabel(item.symbol, marketSymbols);
  const displaySymbol = getDisplaySymbolLabel(item.symbol, marketSymbols);

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xxs font-black text-gray-400">
            {baseAssetName}
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900">
              {baseAssetName}
            </h4>
            <p className="text-xxs text-gray-400 font-bold uppercase">
              {displaySymbol}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm">
            <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="profit" />
            {quoteAssetName ? (
              <span className="text-xxs ml-1">{quoteAssetName}</span>
            ) : null}
          </p>
          <p className="text-xxs">
            <TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="roi" />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
        <DataBox
          label="보유수량"
          value={formatNumber(item.quantity)}
          unit={baseAssetName}
        />
        <DataBox
          label="평가금액"
          value={<TickerCell symbol={item.symbol} fallbackPrice={item.currentPrice} quantity={item.quantity} buyAmount={item.buyAmount} type="value" />}
          unit={quoteAssetName}
        />
        <DataBox
          label="매수평균가"
          value={formatNumber(item.averageBuyPrice)}
          unit={quoteAssetName}
        />
        <DataBox
          label="매수금액"
          value={formatNumber(item.buyAmount)}
          unit={quoteAssetName}
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
  value: React.ReactNode;
  unit: string;
}) {
  return (
    <div>
      <p className="text-xxs text-gray-400 font-bold mb-1 uppercase">
        {label}
      </p>
      <p className="text-xxs font-black text-gray-800 flex items-center gap-1">
        {value}
        {unit ? (
          <span className="text-xxs text-gray-400 font-medium ml-1">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

function PositionRow({
  position,
  marketSymbols,
}: {
  position: FuturesPositionDetail;
  marketSymbols: MarketSymbolMeta[];
}) {
  const baseAssetName = getBaseAssetLabel(position.symbol, marketSymbols);
  const displaySymbol = getDisplaySymbolLabel(position.symbol, marketSymbols);

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xxs font-black text-gray-400">
            {baseAssetName}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-gray-900">
                {baseAssetName}
              </h4>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black",
                position.positionSide === "LONG" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
              )}>
                {position.positionSide} {position.leverage}x
              </span>
            </div>
            <p className="text-xxs text-gray-400 font-bold uppercase">
              {displaySymbol}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={cn("text-sm font-black", getProfitColorClass(position.unrealizedPnl))}>
            {formatSignedNumber(position.unrealizedPnl)} USDT
          </p>
          <p className={cn("text-xxs font-bold", getProfitColorClass(position.unrealizedPnl))}>
            {formatSignedPercent(position.roi)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
        <DataBox
          label="포지션 수량"
          value={formatNumber(position.quantity)}
          unit={baseAssetName}
        />
        <DataBox
          label="진입가격"
          value={formatNumber(position.entryPrice)}
          unit="USDT"
        />
        <DataBox
          label="현재가격"
          value={formatNumber(position.currentPrice)}
          unit="USDT"
        />
        <DataBox
          label="청산추정가"
          value={formatNumber(position.liquidationPrice)}
          unit="USDT"
        />
      </div>
    </div>
  );
}

