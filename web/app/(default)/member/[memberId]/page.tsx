"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";

import type { Post, Reply } from "@/app/(default)/community/types/post";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import Button from "@/components/ui/Button";
import ProfileSidebar from "@/components/user/profile/ProfileSidebar";
import ProfileCommunitySection, {
  ProfileEmptyState,
} from "@/components/user/profile/ProfileCommunitySection";
import type { MemberProfileInfo } from "@/components/user/profile/types";
import { getMemberPosts, getMemberReplies } from "@/lib/api/me-community";
import { followMember, getMemberInfo, unfollowMember } from "@/lib/api/member";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getMemberPortfolio,
  type ProfilePortfolioResponse,
  type AssetType
} from "@/lib/api/portfolio";
import {
  getContestParticipationSeasonsByMember,
  getMyContestSeasonResult, // Note: This might need a member-specific version if rank is private, but rank for finished contests is usually public.
  type ContestParticipationSeason,
  type MyContestSeasonResult,
} from "@/lib/api/contest";
import { 
  getFuturesWalletStatus,
  getContestFuturesOpenPositions,
  type FuturesWalletStatus 
} from "@/lib/api/contest-futures";
import FolderTabs from "@/components/ui/FolderTabs";
import Tabs from "@/components/ui/Tabs";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Label 
} from "recharts";
import { cn } from "@/lib/utils/cs";
import { 
  formatNumber, 
  formatSignedNumber, 
  formatSignedPercent 
} from "@/lib/utils/number";
import { getProfitColorClass } from "@/lib/utils/cs";
import {
  getBaseAssetLabel,
  getDisplaySymbolLabel,
  getDefaultQuoteAssetLabel,
} from "@/lib/utils/market-display";
import { useMarketStore, type MarketSymbolMeta } from "@/stores/useMarketStore";
import TickerCell from "@/components/trade/TickerCell";
import type { FuturesPositionItem } from "@/types/futures";
import type { FuturesPositionDetail } from "@/lib/api/asset";

const CHART_COLORS = ["#0058FF", "#00C2FF", "#00E0FF", "#00FFC2", "#FFC200", "#FF5800"];


type MainTab = "portfolio" | "community";
type PortfolioTab = "trade" | "contest" | "mock";
type TradingSubTab = "spot" | "futures";
type CommunityTab = "posts" | "replies";


export default function MemberProfilePage() {
  const params = useParams<{ memberId: string }>();
  const router = useRouter();
  const memberId = Number(params.memberId);
  const isLogin = useAuthStore((state) => state.isLogin);
  const currentUser = useAuthStore((state) => state.user);
  const { alert, toast } = useFeedback();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [memberProfile, setMemberProfile] = useState<MemberProfileInfo | null>(
    null
  );
  const [mainTab, setMainTab] = useState<MainTab>("portfolio");
  const [portfolioTab, setPortfolioTab] = useState<PortfolioTab>("trade");
  const [tradingSubTab, setTradingSubTab] = useState<TradingSubTab>("spot");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("posts");
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [communityReplies, setCommunityReplies] = useState<Reply[]>([]);
  const [isLoadingCommunityPosts, setIsLoadingCommunityPosts] = useState(false);
  const [isLoadingCommunityReplies, setIsLoadingCommunityReplies] = useState(false);
  const [communityPostsErrorMessage, setCommunityPostsErrorMessage] = useState("");
  const [communityRepliesErrorMessage, setCommunityRepliesErrorMessage] =
    useState("");
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  // Portfolio states
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [portfolioData, setPortfolioData] = useState<ProfilePortfolioResponse | null>(null);
  const [futuresPortfolioData, setFuturesPortfolioData] = useState<ProfilePortfolioResponse | null>(null);
  const [mockPortfolioData, setMockPortfolioData] = useState<ProfilePortfolioResponse | null>(null);
  
  const [participatingContests, setParticipatingContests] = useState<ContestParticipationSeason[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [contestResult, setContestResult] = useState<MyContestSeasonResult | null>(null);
  const [contestWallet, setContestWallet] = useState<FuturesWalletStatus | null>(null);
  const [contestPositions, setContestPositions] = useState<FuturesPositionItem[]>([]);
  const [isLoadingContestWallet, setIsLoadingContestWallet] = useState(false);
  const [isLoadingContestPositions, setIsLoadingContestPositions] = useState(false);
  const [isLoadingContests, setIsLoadingContests] = useState(false);
  const [isLoadingContestResult, setIsLoadingContestResult] = useState(false);


  const marketSymbols = useMarketStore((state: any) => state.marketSymbols);
  const fetchMarketSymbols = useMarketStore((state: any) => state.fetchMarketSymbols);


  useEffect(() => {
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setIsLoadingProfile(false);
      setProfileErrorMessage("올바른 회원 정보를 찾을 수 없습니다.");
      return;
    }

    let isActive = true;

    const loadMemberProfile = async () => {
      try {
        const data = await getMemberInfo(memberId);

        if (!isActive) return;

        setMemberProfile(data);
        setProfileErrorMessage("");
      } catch (error) {
        console.error("failed to load public member profile:", error);

        if (!isActive) return;

        setMemberProfile(null);
        setProfileErrorMessage("회원 정보를 불러오지 못했습니다.");
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
  }, [memberId]);

  useEffect(() => {
    if (!memberProfile) return;
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
        console.error("failed to load public member posts:", error);

        if (!isActive) return;

        setCommunityPosts([]);
        setCommunityPostsErrorMessage("게시글을 불러오지 못했습니다.");
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
  }, [communityTab, mainTab, memberProfile]);

  useEffect(() => {
    if (!memberProfile) return;
    if (mainTab !== "community" || communityTab !== "replies") return;

    let isActive = true;

    const loadCommunityReplies = async () => {
      setIsLoadingCommunityReplies(true);
      setCommunityRepliesErrorMessage("");

      try {
        const response = await getMemberReplies(memberProfile.memberId, { size: 5 });
        const nextReplies =
          response && Array.isArray(response.content)
            ? (response.content as Reply[])
            : [];

        if (!isActive) return;

        setCommunityReplies(nextReplies);
      } catch (error) {
        console.error("failed to load public member replies:", error);

        if (!isActive) return;

        setCommunityReplies([]);
        setCommunityRepliesErrorMessage("댓글을 불러오지 못했습니다.");
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
  }, [communityTab, mainTab, memberProfile]);

  // Load Portfolio Data (Spot)
  useEffect(() => {
    if (!memberProfile || mainTab !== "portfolio" || portfolioTab !== "trade" || tradingSubTab !== "spot") return;

    const loadSpotPortfolio = async () => {
      setIsLoadingPortfolio(true);
      try {
        const data = await getMemberPortfolio(memberProfile.memberId, "TRADE_SPOT");
        setPortfolioData(data);
      } catch (error) {
        console.error("failed to load member spot portfolio:", error);
        setPortfolioData(null);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    void loadSpotPortfolio();
  }, [memberProfile, mainTab, portfolioTab, tradingSubTab]);

  // Load Portfolio Data (Futures)
  useEffect(() => {
    if (!memberProfile || mainTab !== "portfolio" || portfolioTab !== "trade" || tradingSubTab !== "futures") return;

    const loadFuturesPortfolio = async () => {
      setIsLoadingPortfolio(true);
      try {
        const data = await getMemberPortfolio(memberProfile.memberId, "TRADE_FUTURE");
        setFuturesPortfolioData(data);
      } catch (error) {
        console.error("failed to load member futures portfolio:", error);
        setFuturesPortfolioData(null);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    void loadFuturesPortfolio();
  }, [memberProfile, mainTab, portfolioTab, tradingSubTab]);

  // Load Mock Portfolio
  useEffect(() => {
    if (!memberProfile || mainTab !== "portfolio" || portfolioTab !== "mock") return;

    const loadMockPortfolio = async () => {
      setIsLoadingPortfolio(true);
      try {
        const data = await getMemberPortfolio(memberProfile.memberId, "MOCK");
        setMockPortfolioData(data);
      } catch (error) {
        console.error("failed to load member mock portfolio:", error);
        setMockPortfolioData(null);
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    void loadMockPortfolio();
  }, [memberProfile, mainTab, portfolioTab]);

  // Load Market Symbols
  useEffect(() => {
    void fetchMarketSymbols();
  }, [fetchMarketSymbols]);

  // Load Contests
  useEffect(() => {
    if (!memberProfile || mainTab !== "portfolio" || portfolioTab !== "contest") return;

    const loadContests = async () => {
      setIsLoadingContests(true);
      try {
        const response = await getContestParticipationSeasonsByMember(memberProfile.memberId);
        const content = response.content || [];
        setParticipatingContests(content);
        if (content.length > 0 && !selectedContestId) {
          setSelectedContestId(content[0].seasonId);
        }
      } catch (error) {
        console.error("failed to load member contests:", error);
        setParticipatingContests([]);
      } finally {
        setIsLoadingContests(false);
      }
    };

    void loadContests();
  }, [memberProfile, mainTab, portfolioTab]);

  // Load Contest Wallet & Positions
  useEffect(() => {
    if (!selectedContestId || mainTab !== "portfolio" || portfolioTab !== "contest") return;

    const loadContestData = async () => {
      setIsLoadingContestWallet(true);
      setIsLoadingContestPositions(true);
      try {
        const [wallet, positions] = await Promise.all([
          getFuturesWalletStatus(selectedContestId),
          getContestFuturesOpenPositions(selectedContestId)
        ]);
        setContestWallet(wallet);
        setContestPositions(positions.content || []);
      } catch (error) {
        console.error("failed to load contest wallet/positions:", error);
        setContestWallet(null);
        setContestPositions([]);
      } finally {
        setIsLoadingContestWallet(false);
        setIsLoadingContestPositions(false);
      }
    };

    void loadContestData();
  }, [selectedContestId, mainTab, portfolioTab]);

  // Load Contest Result (Public version if exists, else handle)
  useEffect(() => {
    if (!selectedContestId || mainTab !== "portfolio" || portfolioTab !== "contest") return;

    const loadContestResult = async () => {
      setIsLoadingContestResult(true);
      try {
        // NOTE: If the backend provides a public result API, use it here.
        // For now, we'll try getMyContestSeasonResult which might work if the backend allows viewing others.
        // If not, it will fail and we'll just not show the rank card.
        const result = await getMyContestSeasonResult(selectedContestId);
        setContestResult(result);
      } catch (error) {
        setContestResult(null);
      } finally {
        setIsLoadingContestResult(false);
      }
    };

    void loadContestResult();
  }, [selectedContestId, mainTab, portfolioTab]);


  const spotPieData = useMemo(() => {
    if (!portfolioData) return [];
    const holdingsData = portfolioData.holdings
      .filter((item) => item.quantity > 0)
      .map((item, index) => {
        const totalValue = item.coinTotalValue;
        return {
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: portfolioData.totalAsset > 0 ? (totalValue / portfolioData.totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        };
      });
    const cashRatio = portfolioData.totalAsset > 0 ? (portfolioData.cashBalance / portfolioData.totalAsset) * 100 : 0;
    if (cashRatio > 0) {
      holdingsData.unshift({
        name: "현금",
        value: cashRatio,
        color: CHART_COLORS[0],
      });
    }
    return holdingsData.filter((item) => item.value > 0);
  }, [portfolioData, marketSymbols]);

  const mockPieData = useMemo(() => {
    if (!mockPortfolioData) return [];
    const holdingsData = mockPortfolioData.holdings
      .filter((item) => item.quantity > 0)
      .map((item, index) => {
        const totalValue = item.coinTotalValue;
        return {
          name: getBaseAssetLabel(item.symbol, marketSymbols),
          value: mockPortfolioData.totalAsset > 0 ? (totalValue / mockPortfolioData.totalAsset) * 100 : 0,
          color: CHART_COLORS[(index + 1) % CHART_COLORS.length],
        };
      });
    const cashRatio = mockPortfolioData.totalAsset > 0 ? (mockPortfolioData.cashBalance / mockPortfolioData.totalAsset) * 100 : 0;
    if (cashRatio > 0) {
      holdingsData.unshift({
        name: "현금",
        value: cashRatio,
        color: CHART_COLORS[0],
      });
    }
    return holdingsData.filter((item) => item.value > 0);
  }, [mockPortfolioData, marketSymbols]);

  const contestAssetPieData = useMemo(() => {
    if (!contestWallet) return [];
    const totalAsset = contestWallet.currentMoney;
    const totalMargin = contestWallet.marginInUse;
    const availableBalance = totalAsset - totalMargin;
    return [
      { name: "대회 증거금", value: totalAsset > 0 ? (totalMargin / totalAsset) * 100 : 0, color: "#1D7CA7" },
      { name: "사용 가능 잔고", value: totalAsset > 0 ? (availableBalance / totalAsset) * 100 : 0, color: "#F0F9FF" },
    ].filter(item => item.value > 0);
  }, [contestWallet]);

  const contestLongShortData = useMemo(() => {
    if (contestPositions.length === 0) return { long: 0, short: 0 };
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
  }, [contestPositions]);


  const relationBadges = useMemo(() => {
    if (!memberProfile) return [];

    return [
      memberProfile.followedByMe ? "내가 팔로우 중" : "",
      memberProfile.followingMe ? "나를 팔로우 중" : "",
    ].filter(Boolean);
  }, [memberProfile]);

  if (isLoadingProfile) {
    return <div className="p-20 text-center">Loading...</div>;
  }

  if (profileErrorMessage) {
    return <div className="p-20 text-center">{profileErrorMessage}</div>;
  }

  if (!memberProfile) {
    return <div className="p-20 text-center">회원 정보를 찾을 수 없습니다.</div>;
  }

  const isOwnProfile = currentUser?.memberId === memberProfile.memberId;

  const handleToggleFollow = async () => {
    if (isSubmittingFollow || isOwnProfile) return;

    if (!isLogin) {
      router.push("/login");
      return;
    }

    setIsSubmittingFollow(true);

    try {
      const response = memberProfile.followedByMe
        ? await unfollowMember(memberProfile.memberId)
        : await followMember(memberProfile.memberId);

      setMemberProfile((prev) =>
        prev
          ? {
              ...prev,
              followerCount: response.followerCount,
              followedByMe: response.followedByMe,
            }
          : prev
      );
      toast({
        title: memberProfile.followedByMe
          ? "팔로우를 취소했습니다."
          : "팔로우했습니다.",
        tone: "success",
      });
    } catch (error) {
      console.error("failed to toggle follow state:", error);

      if (
        error instanceof Error &&
        (error.message === "API 에러: 401" || error.message === "API 에러: 403")
      ) {
        router.push("/login");
        return;
      }

      await alert("팔로우 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const renderPortfolioTabContent = (tab: PortfolioTab) => {
    if (tab === "trade") {
      return (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setTradingSubTab("spot")}
                className={cn(
                  "px-8 py-2.5 text-xs font-black rounded-lg transition-all",
                  tradingSubTab === "spot" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                현물
              </button>
              <button
                onClick={() => setTradingSubTab("futures")}
                className={cn(
                  "px-8 py-2.5 text-xs font-black rounded-lg transition-all",
                  tradingSubTab === "futures" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                선물
              </button>
            </div>
          </div>

          {tradingSubTab === "spot" ? (
            <div className="space-y-10">
              <div className="card p-8">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="w-full md:w-1/2 h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={spotPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {spotPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                          formatter={(val) => [`${Number(val).toFixed(2)}%`, "비중"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</span>
                      <span className="text-lg font-black text-gray-900 uppercase">Spot</span>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 space-y-3">
                    <h4 className="text-sm font-black text-gray-900 mb-4">자산 구성</h4>
                    {spotPieData.length > 0 ? spotPieData.map((item, i) => (
                      <div key={i} className="flex justify-between items-center group">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-gray-900">{item.value.toFixed(2)}%</span>
                      </div>
                    )) : <p className="text-xs text-gray-400 font-bold">보유 자산이 없습니다.</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-black text-gray-900">보유 종목</h3>
                  <span className="text-xs font-bold text-gray-400">Total {portfolioData?.holdings.length || 0} Assets</span>
                </div>
                {isLoadingPortfolio ? (
                  <div className="py-20 text-center text-gray-400 font-bold">데이터를 불러오는 중...</div>
                ) : portfolioData && portfolioData.holdings.length > 0 ? (
                  portfolioData.holdings.map((item, i) => (
                    <HoldingRow key={i} item={item} marketSymbols={marketSymbols} quoteAssetName="USDT" />
                  ))
                ) : (
                  <ProfileEmptyState text="보유 중인 현물 자산이 없습니다." />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black text-gray-900">선물 포지션</h3>
                <span className="text-xs font-bold text-gray-400">Open Positions</span>
              </div>
              {isLoadingPortfolio ? (
                <div className="py-20 text-center text-gray-400 font-bold">데이터를 불러오는 중...</div>
              ) : futuresPortfolioData && futuresPortfolioData.holdings.length > 0 ? (
                futuresPortfolioData.holdings.map((pos, i) => (
                  <PositionRow key={i} position={pos} marketSymbols={marketSymbols} />
                ))
              ) : (
                <ProfileEmptyState text="보유 중인 선물 포지션이 없습니다." />
              )}
            </div>
          )}
        </div>
      );
    }

    if (tab === "contest") {
      return (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex justify-center mb-6">
            <select
              value={selectedContestId || ""}
              onChange={(e) => setSelectedContestId(Number(e.target.value))}
              className="bg-gray-50 border border-gray-100 text-gray-900 text-xs font-black rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 min-w-[240px] outline-none transition-all hover:bg-white"
            >
              <option value="" disabled>대회 시즌 선택</option>
              {participatingContests.map((season) => (
                <option key={season.seasonId} value={season.seasonId}>
                  {season.seasonTitle}
                </option>
              ))}
            </select>
          </div>

          {contestResult && (
            <div className="relative overflow-hidden card p-0 mb-10 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
              <div className="flex items-center p-8 gap-10">
                <div className="flex flex-col items-center gap-2 border-r border-blue-100 pr-10">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Final Rank</span>
                  <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
                    <span className="text-3xl font-black">{contestResult.finalRank}</span>
                    <span className="text-sm font-bold ml-0.5 mt-1">위</span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">실현 손익</p>
                    <p className={cn("text-xl font-black", getProfitColorClass(contestResult.finalRealizedPnl))}>
                      {formatSignedNumber(contestResult.finalRealizedPnl)} <span className="text-xs ml-1">USDT</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">최종 수익률</p>
                    <p className={cn("text-xl font-black", getProfitColorClass(contestResult.finalProfitRate))}>
                      {formatSignedPercent(contestResult.finalProfitRate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-blue-600 w-full opacity-10" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card p-6">
              <h4 className="text-xs font-black text-gray-900 mb-6 uppercase tracking-wider">대회 증거금 비중</h4>
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Margin</span>
                  <span className="text-sm font-black text-cyan-600">
                    {contestAssetPieData.find(d => d.name === "대회 증거금")?.value.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h4 className="text-xs font-black text-gray-900 mb-6 uppercase tracking-wider">롱/숏 포지션 비율</h4>
              <div className="flex flex-col justify-center h-full -mt-4">
                <div className="flex justify-between text-[10px] font-black mb-2">
                  <span className="text-red-500">LONG {contestLongShortData.long.toFixed(1)}%</span>
                  <span className="text-blue-500">SHORT {contestLongShortData.short.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden flex">
                  <div className="h-full bg-red-500" style={{ width: `${contestLongShortData.long}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${contestLongShortData.short}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-10 border-t border-gray-100">
            <h3 className="text-lg font-black text-gray-900">대회 포지션 현황</h3>
            {isLoadingContestPositions ? (
              <div className="py-20 text-center text-gray-400 font-bold">데이터를 불러오는 중...</div>
            ) : contestPositions.length > 0 ? (
              contestPositions.map((pos, i) => (
                <PositionRow key={i} position={pos} marketSymbols={marketSymbols} />
              ))
            ) : (
              <ProfileEmptyState text="참여 중인 대회 포지션이 없습니다." />
            )}
          </div>
        </div>
      );
    }

    if (tab === "mock") {
      return (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="card p-8">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-1/2 h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      formatter={(val) => [`${Number(val).toFixed(2)}%`, "비중"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asset</span>
                  <span className="text-lg font-black text-gray-900 uppercase">Mock</span>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                <h4 className="text-sm font-black text-gray-900 mb-4">자산 구성</h4>
                {mockPieData.length > 0 ? mockPieData.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{item.value.toFixed(2)}%</span>
                  </div>
                )) : <p className="text-xs text-gray-400 font-bold">보유 자산이 없습니다.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-black text-gray-900">모의투자 보유 종목</h3>
              <span className="text-xs font-bold text-gray-400">Total {mockPortfolioData?.holdings.length || 0} Assets</span>
            </div>
            {isLoadingPortfolio ? (
              <div className="py-20 text-center text-gray-400 font-bold">데이터를 불러오는 중...</div>
            ) : mockPortfolioData && mockPortfolioData.holdings.length > 0 ? (
              mockPortfolioData.holdings.map((item, i) => (
                <HoldingRow key={i} item={item} marketSymbols={marketSymbols} quoteAssetName="USDT" />
              ))
            ) : (
              <ProfileEmptyState text="보유 중인 모의투자 자산이 없습니다." />
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-[400px] lg:sticky lg:top-24 space-y-6">
          <ProfileSidebar
            profile={memberProfile}
            relationArea={
              <div className="w-full space-y-3">
                {!isOwnProfile ? (
                  <Button
                    variant={memberProfile.followedByMe ? "white" : "blue"}
                    fullWidth={true}
                    onClick={handleToggleFollow}
                    disabled={isSubmittingFollow}
                    className="gap-1.5"
                  >
                    {memberProfile.followedByMe ? (
                      <>
                        <Check size={15} strokeWidth={2.4} />
                        팔로잉
                      </>
                    ) : (
                      "팔로우"
                    )}
                  </Button>
                ) : null}

                {relationBadges.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {relationBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            }
          />
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
              포트폴리오
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
              <FolderTabs
                tabs={[
                  { id: "trade", label: "트레이딩", content: renderPortfolioTabContent("trade") },
                  { id: "contest", label: "대회", content: renderPortfolioTabContent("contest") },
                  { id: "mock", label: "모의투자", content: renderPortfolioTabContent("mock") },
                ]}
                activeId={portfolioTab}
                onChange={(id) => setPortfolioTab(id as PortfolioTab)}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ProfileCommunitySection
                communityTab={communityTab}
                onChange={(value) => setCommunityTab(value as CommunityTab)}
                posts={communityPosts}
                replies={communityReplies}
                isLoadingPosts={isLoadingCommunityPosts}
                isLoadingReplies={isLoadingCommunityReplies}
                postsErrorMessage={communityPostsErrorMessage}
                repliesErrorMessage={communityRepliesErrorMessage}
                isOwnProfile={false}
              />
            </div>
          )}
        </main>
      </div>

      {/* Helper components can be added here or at the end */}
    </div>
  );
}

function HoldingRow({
  item,
  marketSymbols,
  quoteAssetName,
}: {
  item: any;
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

function PositionRow({
  position,
  marketSymbols,
}: {
  position: any;
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

