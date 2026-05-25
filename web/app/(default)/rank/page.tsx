"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import RankItem from "./components/RankItem";
import { RankItemProps } from "./types/user";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import Tabs from "@/components/ui/Tabs";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  getMemberInfo,
  followMember,
  unfollowMember,
  MemberProfileInfo,
} from "@/lib/api/member";
import { getPosts } from "@/lib/api/post";
import {
  getContestResults,
  ContestRanking,
  ContestParticipationSeason,
  getContestParticipationSeasonsByMember,
} from "@/lib/api/contest";

// ─── 탭 정의 ─────────────────────────────────────────────────────────────────
type ListTab = "followers" | "contest";

const RANK_TABS = [
  { value: "followers", label: "팔로워 많은순" },
  { value: "contest", label: "종료된 대회 순위" },
];

const PAGE_SIZE = 20;

// ─── 커뮤니티 게시글 작성자에서 고유 멤버 ID 수집 ───────────────────────────
async function discoverMemberIdsFromPosts(maxPages = 3): Promise<number[]> {
  const memberIdSet = new Set<number>();
  let cursorId: number | undefined = undefined;

  for (let page = 0; page < maxPages; page++) {
    const res = await getPosts({ cursorId, size: 50 });
    if (!res || !res.content || res.content.length === 0) break;
    res.content.forEach((post) => {
      if (post.memberId) memberIdSet.add(post.memberId);
    });
    if (!res.hasNext || !res.nextCursorId) break;
    cursorId = res.nextCursorId;
  }

  return Array.from(memberIdSet);
}

// ─── 멤버 참가 이력에서 종료된 시즌 추출 ────────────────────────────────────
async function fetchFinishedSeasonsForMember(
  memberId: number
): Promise<ContestParticipationSeason[]> {
  const allSeasons: ContestParticipationSeason[] = [];
  let cursorId: number | undefined = undefined;

  for (let page = 0; page < 5; page++) {
    const res = await getContestParticipationSeasonsByMember(memberId, {
      cursorId,
      size: 50,
    });
    if (!res || !res.content || res.content.length === 0) break;
    allSeasons.push(...(res.content as ContestParticipationSeason[]));
    if (!res.hasNext || !res.nextCursorId) break;
    cursorId = res.nextCursorId;
  }

  return allSeasons.filter(
    (s) =>
      s.displayStatus === "FINISHED" ||
      s.displayStatus === "SETTLED" ||
      s.displayStatus === "종료"
  );
}

export default function RankPage() {
  const [activeTab, setActiveTab] = useState<ListTab>("followers");
  const user = useAuthStore((state) => state.user);
  const isLogin = useAuthStore((state) => state.isLogin);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const { toast } = useFeedback();

  // ─── 팔로워 순 상태 ────────────────────────────────────────────────────
  const [allFollowerProfiles, setAllFollowerProfiles] = useState<MemberProfileInfo[]>([]);
  const [followerRanking, setFollowerRanking] = useState<RankItemProps[]>([]);
  const [followerPage, setFollowerPage] = useState(0); // 현재 표시 페이지
  const [followerHasMore, setFollowerHasMore] = useState(false);
  const [followerLoading, setFollowerLoading] = useState(false);
  const [followerError, setFollowerError] = useState<string | null>(null);
  const followerFetched = useRef(false);

  // ─── 팔로우 로딩 맵 ────────────────────────────────────────────────────
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<number, boolean>>({});

  // ─── 대회 순위 상태 ────────────────────────────────────────────────────
  const [finishedSeasons, setFinishedSeasons] = useState<ContestParticipationSeason[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [contestRanking, setContestRanking] = useState<RankItemProps[]>([]);
  const [contestCursor, setContestCursor] = useState<number | undefined>(undefined);
  const [contestHasMore, setContestHasMore] = useState(false);
  const [contestLoading, setContestLoading] = useState(false);
  const [contestLoadingMore, setContestLoadingMore] = useState(false);
  const [contestError, setContestError] = useState<string | null>(null);
  const contestInitFetched = useRef<Record<number, boolean>>({});

  // ─── IntersectionObserver 대상 ref ─────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ────────────────────────────────────────────────────────────────────────
  // 팔로워 순: 초기 전체 데이터 로드 (한 번만)
  // ────────────────────────────────────────────────────────────────────────
  const fetchFollowerRanking = useCallback(async () => {
    if (followerFetched.current) return;
    followerFetched.current = true;
    setFollowerLoading(true);
    setFollowerError(null);

    try {
      const memberIds = await discoverMemberIdsFromPosts(3);

      const results = await Promise.allSettled(
        memberIds.map((id) => getMemberInfo(id))
      );

      const valid: MemberProfileInfo[] = results
        .filter(
          (r): r is PromiseFulfilledResult<MemberProfileInfo> =>
            r.status === "fulfilled" && r.value !== null
        )
        .map((r) => r.value)
        .filter((m) => (m.followerCount ?? 0) > 0) // 팔로워가 0명인 유저 제외
        .sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0));

      setAllFollowerProfiles(valid);
      // 첫 페이지 표시
      const firstPage = valid.slice(0, PAGE_SIZE);
      setFollowerRanking(
        firstPage.map((m, idx) => profileToRankItem(m, idx + 1))
      );
      setFollowerPage(1);
      setFollowerHasMore(valid.length > PAGE_SIZE);
    } catch (err) {
      console.error(err);
      setFollowerError("팔로워 순위를 불러오는 데 실패했습니다.");
      followerFetched.current = false;
    } finally {
      setFollowerLoading(false);
    }
  }, []);

  // 팔로워 추가 페이지 로드
  const loadMoreFollowers = useCallback(() => {
    setAllFollowerProfiles((all) => {
      setFollowerPage((prev) => {
        const nextPage = prev + 1;
        const nextSlice = all.slice(0, nextPage * PAGE_SIZE);
        setFollowerRanking(
          nextSlice.map((m, idx) => profileToRankItem(m, idx + 1))
        );
        setFollowerHasMore(all.length > nextPage * PAGE_SIZE);
        return nextPage;
      });
      return all;
    });
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // 대회 순위: 시즌 목록 로드
  // ────────────────────────────────────────────────────────────────────────
  const fetchFinishedSeasons = useCallback(async () => {
    if (!user?.memberId) return;
    setContestLoading(true);
    setContestError(null);
    try {
      const seasons = await fetchFinishedSeasonsForMember(user.memberId);
      setFinishedSeasons(seasons);
      if (seasons.length > 0) {
        setSelectedSeasonId(seasons[0].seasonId);
      }
    } catch (err) {
      console.error(err);
      setContestError("종료된 대회 목록을 불러오는 데 실패했습니다.");
    } finally {
      setContestLoading(false);
    }
  }, [user]);

  // 시즌 순위 초기 로드
  const fetchContestRanking = useCallback(async (seasonId: number) => {
    setContestLoading(true);
    setContestError(null);
    setContestRanking([]);
    setContestCursor(undefined);
    setContestHasMore(false);

    try {
      const res = await getContestResults(seasonId, { size: PAGE_SIZE });
      const items = (res?.content ?? []).map(rankingToRankItem);
      setContestRanking(items);
      setContestCursor(res?.nextCursorId ?? undefined);
      setContestHasMore(res?.hasNext ?? false);
    } catch (err) {
      console.error(err);
      setContestError("대회 순위를 불러오는 데 실패했습니다.");
    } finally {
      setContestLoading(false);
    }
  }, []);

  // 대회 순위 추가 로드 (무한 스크롤)
  const loadMoreContest = useCallback(async () => {
    if (!selectedSeasonId || contestLoadingMore || !contestHasMore) return;
    setContestLoadingMore(true);
    try {
      const res = await getContestResults(selectedSeasonId, {
        cursorId: contestCursor,
        size: PAGE_SIZE,
      });
      setContestRanking((prev) => [
        ...prev,
        ...(res?.content ?? []).map(rankingToRankItem),
      ]);
      setContestCursor(res?.nextCursorId ?? undefined);
      setContestHasMore(res?.hasNext ?? false);
    } catch (err) {
      console.error(err);
    } finally {
      setContestLoadingMore(false);
    }
  }, [selectedSeasonId, contestCursor, contestHasMore, contestLoadingMore]);

  // ────────────────────────────────────────────────────────────────────────
  // IntersectionObserver: sentinel이 보이면 더 불러오기
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "followers" && followerHasMore && !followerLoading) {
            loadMoreFollowers();
          }
          if (activeTab === "contest" && contestHasMore && !contestLoading && !contestLoadingMore) {
            loadMoreContest();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    activeTab,
    followerHasMore,
    followerLoading,
    loadMoreFollowers,
    contestHasMore,
    contestLoading,
    contestLoadingMore,
    loadMoreContest,
  ]);

  // ────────────────────────────────────────────────────────────────────────
  // 탭 전환 시 데이터 로드
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "followers") {
      fetchFollowerRanking();
    } else if (activeTab === "contest" && isLogin) {
      if (finishedSeasons.length === 0) {
        fetchFinishedSeasons();
      }
    }
  }, [activeTab, isLogin, finishedSeasons.length, fetchFollowerRanking, fetchFinishedSeasons]);

  // 시즌 선택 변경 시 순위 로드
  useEffect(() => {
    if (activeTab === "contest" && selectedSeasonId !== null) {
      fetchContestRanking(selectedSeasonId);
    }
  }, [activeTab, selectedSeasonId, fetchContestRanking]);

  // ────────────────────────────────────────────────────────────────────────
  // 팔로우 토글
  // ────────────────────────────────────────────────────────────────────────
  const handleFollowToggle = useCallback(
    async (memberId: number, isFollowing: boolean) => {
      setFollowLoadingMap((prev) => ({ ...prev, [memberId]: true }));
      try {
        if (isFollowing) {
          const res = await unfollowMember(memberId);
          if (res) {
            toast({ title: "팔로우를 취소했습니다.", tone: "success" });
            
            // 팔로워 랭킹 상태 업데이트
            setFollowerRanking((prev) =>
              prev.map((item) =>
                item.memberId === memberId
                  ? { ...item, followedByMe: false, followerCount: res.followerCount ?? (item.followerCount ?? 1) - 1 }
                  : item
              )
            );
            
            // 대회 랭킹 상태 업데이트
            setContestRanking((prev) =>
              prev.map((item) =>
                item.memberId === memberId
                  ? { ...item, followedByMe: false }
                  : item
              )
            );
          }
        } else {
          const res = await followMember(memberId);
          if (res) {
            toast({ title: "팔로우했습니다.", tone: "success" });
            
            // 팔로워 랭킹 상태 업데이트
            setFollowerRanking((prev) =>
              prev.map((item) =>
                item.memberId === memberId
                  ? { ...item, followedByMe: true, followerCount: res.followerCount ?? (item.followerCount ?? 0) + 1 }
                  : item
              )
            );

            // 대회 랭킹 상태 업데이트
            setContestRanking((prev) =>
              prev.map((item) =>
                item.memberId === memberId
                  ? { ...item, followedByMe: true }
                  : item
              )
            );
          }
        }
      } catch (err) {
        console.error(err);
        toast({ title: "요청 처리에 실패했습니다.", tone: "error" });
      } finally {
        setFollowLoadingMap((prev) => ({ ...prev, [memberId]: false }));
      }
    },
    [toast]
  );

  // ────────────────────────────────────────────────────────────────────────
  // 현재 탭 상태
  // ────────────────────────────────────────────────────────────────────────
  const isInitialLoading = activeTab === "followers" ? followerLoading : contestLoading;
  const errorMsg = activeTab === "followers" ? followerError : contestError;
  const displayList = activeTab === "followers" ? followerRanking : contestRanking;
  const hasMore = activeTab === "followers" ? followerHasMore : contestHasMore;
  const isLoadingMore = activeTab === "contest" ? contestLoadingMore : false;

  return (
    <div className="flex flex-col gap-6 min-h-screen transition-colors">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <Tabs
          tabs={RANK_TABS}
          activeTab={activeTab}
          onChange={(v) => setActiveTab(v as ListTab)}
          variant="underline"
          size="md"
          mode={isDarkMode ? "dark" : "light"}
        />
      </div>

      {/* ── 종료된 대회 셀렉트 ───────────────────────────────────────────── */}
      {activeTab === "contest" && isLogin && (
        <div className="max-w-7xl mx-auto px-4 w-full">
          {finishedSeasons.length > 0 ? (
            <div className="flex items-center gap-3">
              <select
                id="season-select"
                value={selectedSeasonId ?? ""}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                className="flex-1 max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {finishedSeasons.map((season) => (
                  <option key={season.seasonId} value={season.seasonId}>
                    {season.seasonTitle}
                  </option>
                ))}
              </select>
            </div>
          ) : !contestLoading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              참가한 종료된 대회가 없습니다.
            </p>
          ) : null}
        </div>
      )}

      {/* ── 비로그인 안내 ────────────────────────────────────────────────── */}
      {activeTab === "contest" && !isLogin && (
        <div className="max-w-7xl mx-auto px-4 w-full flex flex-col items-center py-20 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            대회 순위를 보려면 로그인이 필요합니다.
          </p>
        </div>
      )}

      {/* ── 리스트 + 무한스크롤 ─────────────────────────────────────────── */}
      {(activeTab === "followers" || isLogin) && (
        <div className="max-w-7xl mx-auto px-4 w-full pb-10">
          {isInitialLoading ? (
            /* 초기 로딩 스켈레톤 */
            <ul className="grid md:grid-cols-3 grid-cols-1 md:gap-7 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="border border-gray-200 dark:border-gray-700 p-[25px] rounded-2xl bg-white dark:bg-gray-800 animate-pulse"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-700" />
                    <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-700 mt-2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : errorMsg ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-gray-500 dark:text-gray-400">{errorMsg}</p>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "followers") {
                    followerFetched.current = false;
                    fetchFollowerRanking();
                  } else if (selectedSeasonId !== null) {
                    delete contestInitFetched.current[selectedSeasonId];
                    fetchContestRanking(selectedSeasonId);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400 dark:text-gray-500">
              <p className="text-base">데이터가 없습니다.</p>
            </div>
          ) : (
            <>
              <ul className="grid md:grid-cols-3 grid-cols-1 md:gap-7 gap-5">
                {displayList.map((item) => (
                  <RankItem
                    key={`${item.mode}-${item.memberId}-${item.rank}`}
                    {...item}
                    isFollowLoading={!!followLoadingMap[item.memberId]}
                    onFollowToggle={
                      item.mode === "followers" && user?.memberId !== item.memberId 
                        ? handleFollowToggle 
                        : undefined
                    }
                    />                ))}
              </ul>

              {/* 무한스크롤 센티넬 */}
              {hasMore && (
                <div ref={sentinelRef} className="mt-8">
                  {isLoadingMore ? (
                    /* 추가 로딩 스켈레톤 (대회 탭) */
                    <ul className="grid md:grid-cols-3 grid-cols-1 md:gap-7 gap-5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <li
                          key={i}
                          className="border border-gray-200 dark:border-gray-700 p-[25px] rounded-2xl bg-white dark:bg-gray-800 animate-pulse"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-gray-700 mt-2" />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-4" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 유틸리티 매퍼 ───────────────────────────────────────────────────────────
function profileToRankItem(m: MemberProfileInfo, rank: number): RankItemProps {
  return {
    rank,
    memberId: m.memberId,
    nickname: m.nickname,
    profileImgUrl: m.profileImgUrl,
    mode: "followers",
    profileMsg: m.profileMsg,
    followerCount: m.followerCount ?? 0,
    followedByMe: m.followedByMe ?? false,
  };
}

function rankingToRankItem(r: ContestRanking): RankItemProps {
  return {
    rank: r.rank,
    memberId: r.memberId,
    nickname: r.nickname,
    profileImgUrl: r.profileImgUrl,
    mode: "contest",
    profitRate: r.profitRate ?? 0,
    realizedPnl: r.realizedPnl ?? 0,
  };
}