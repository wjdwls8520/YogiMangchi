"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireVerifiedUser } from "@/hooks/useWithAuth";
import {
  applyContestSeason,
  getContestParticipationSeasonsByMember,
  getMyLatestRejectedContestApplication,
  getMyParticipatingContestSeasons,
  getMyPendingContestApplications,
  getRecruitingContestSeasons,
  translateContestDisplayStatus,
  type ContestParticipationSeason,
  type ContestSeason,
  type MyContestLatestRejectedApplication,
  type MyContestPendingApplication,
} from "@/lib/api/contest";
import { useAuthStore } from "@/stores/useAuthStore";
import ContestListCard from "./components/ContestListCard";
import ContestOngoingSection from "./components/ContestOngoingSection";
import Tabs from "@/components/ui/Tabs";
import type {
  ContestListItem,
  OngoingContest,
} from "./components/types";

const CONTEST_PAGE_SIZE = 10;

const formatMonthDay = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

const formatContestPeriod = (startAt: string, endAt: string) => {
  return `${formatMonthDay(startAt)} - ${formatMonthDay(endAt)}`;
};

const getContestProgressLabel = ({
  isLive,
}: {
  isLive?: boolean;
}) => (isLive ? "라이브 진행중" : "참가 중");

const mapRecruitingContestToListItem = (season: ContestSeason): ContestListItem => ({
  id: season.id,
  cardType: "apply",
  title: season.title,
  description: season.description,
  recruitmentEndAt: season.recruitmentEndAt,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  accentLabel: season.isRecruiting ? "모집중" : translateContestDisplayStatus(season),
  actionLabel: season.appliedByMe === true ? "신청 완료" : "신청하기",
  actionDisabled: season.appliedByMe === true || season.isRecruiting === false,
});

const mapPendingContestToListItem = (application: MyContestPendingApplication): ContestListItem => ({
  id: application.seasonId,
  cardType: "wait",
  title: application.seasonTitle,
  description: application.seasonDescription,
  recruitmentEndAt: application.recruitmentEndAt,
  period: formatContestPeriod(application.contestStartAt, application.contestEndAt),
  accentLabel: "대기",
  actionLabel: "승인 대기중",
  actionDisabled: true,
});

const mapParticipatingContestToListItem = (season: ContestParticipationSeason): ContestListItem => ({
  id: season.seasonId,
  cardType: "approved",
  title: season.seasonTitle,
  description: season.seasonDescription,
  recruitmentEndAt: season.recruitmentEndAt,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  accentLabel: season.isLive ? "진행중" : "승인",
  actionLabel: season.isLive ? "라이브 진행중" : "승인 완료",
  actionDisabled: true,
});

const mapRejectedContestToListItem = (application: MyContestLatestRejectedApplication): ContestListItem => ({
  id: application.seasonId,
  cardType: "reject",
  title: application.seasonTitle,
  description: application.seasonDescription,
  period: "-",
  accentLabel: "반려",
  rejectReason: application.rejectReason,
  actionLabel: "반려됨",
  actionDisabled: true,
});

const mapPastContestToListItem = (season: ContestParticipationSeason): ContestListItem => ({
  id: season.seasonId,
  cardType: "past",
  title: season.seasonTitle,
  description: season.seasonDescription,
  recruitmentEndAt: season.recruitmentEndAt,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  accentLabel: "종료",
  actionLabel: "지난 대회",
  actionDisabled: true,
});

const mapOngoingContest = (season: ContestParticipationSeason): OngoingContest => ({
  id: season.seasonId,
  title: season.seasonTitle,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  statusText: getContestProgressLabel(season),
  targetDateAt: season.isLive ? season.contestEndAt : season.recruitmentEndAt,
  myRank: 0, // Placeholder
  myYield: 0, // Placeholder
});

export default function ContestMainPage() {
  const router = useRouter();
  const { alert, toast } = useFeedback();
  const requireVerifiedUser = useRequireVerifiedUser({ loginRedirectMode: "push", verifyRedirectMode: "push" });
  const isLogin = useAuthStore((state) => state.isLogin);
  const user = useAuthStore((state) => state.user);

  const [ongoingContests, setOngoingContests] = useState<OngoingContest[]>([]);
  const [availableContests, setAvailableContests] = useState<ContestListItem[]>([]);
  const [pendingContests, setPendingContests] = useState<ContestListItem[]>([]);
  const [rejectedContests, setRejectedContests] = useState<ContestListItem[]>([]);
  const [pastContests, setPastContests] = useState<ContestListItem[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isApplyingContestId, setIsApplyingContestId] = useState<number | null>(null);
  const [activeListTab, setActiveListTab] = useState("available");

  const loadContestPageData = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const recruitingResponse = await getRecruitingContestSeasons({ size: CONTEST_PAGE_SIZE });
      const participatingResponse = isLogin ? await getMyParticipatingContestSeasons({ size: CONTEST_PAGE_SIZE }) : { content: [] };
      const pendingResponse = isLogin ? await getMyPendingContestApplications({ size: CONTEST_PAGE_SIZE }) : { content: [] };
      const rejectedResponse = isLogin ? await getMyLatestRejectedContestApplication() : null;
      const historyResponse = user?.memberId ? await getContestParticipationSeasonsByMember(user.memberId, { size: CONTEST_PAGE_SIZE }) : { content: [] };

      setAvailableContests((recruitingResponse.content || []).filter((s: any) => !s.appliedByMe).map(mapRecruitingContestToListItem));
      setPendingContests((pendingResponse.content || []).map(mapPendingContestToListItem));
      setOngoingContests((participatingResponse.content || []).filter((s: any) => s.isLive).map(mapOngoingContest));
      setRejectedContests(rejectedResponse ? [mapRejectedContestToListItem(rejectedResponse)] : []);
      setPastContests((historyResponse.content || []).filter((s: any) => s.displayStatus === "FINISHED").map(mapPastContestToListItem));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPage(false);
    }
  }, [isLogin, user]);

  useEffect(() => {
    void loadContestPageData();
  }, [loadContestPageData]);

  const handleApplyContest = useCallback(async (contest: ContestListItem) => {
    const canApply = await requireVerifiedUser();
    if (!canApply) return;
    try {
      setIsApplyingContestId(contest.id);
      await applyContestSeason(contest.id);
      toast({ title: "대회 신청이 완료되었습니다.", tone: "success" });
      await loadContestPageData();
    } catch (e) {
      await alert("대회 신청에 실패했습니다.");
    } finally {
      setIsApplyingContestId(null);
    }
  }, [alert, loadContestPageData, requireVerifiedUser, toast]);

  const combinedHistoryContests = [...rejectedContests, ...pastContests];

  return (
    <div className="min-h-full pb-20 selection:bg-blue-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Header Section */}
        <header className="border-b border-gray-200 dark:border-gray-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              요기망치 투자 대회
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              실시간 투자 감각을 겨루고 상금을 획득해보세요.
            </p>
          </div>
        </header>

        {/* 1. Ongoing Contests */}
        <ContestOngoingSection
          isLoading={isLoadingPage}
          contests={ongoingContests}
          selectedContestId={0}
          onSelectContest={() => {}}
          onMoveTrading={(id) => router.push(`/contest/${id}/trading`)}
        />

        {/* 2. Sub-List Section (Tabs: Available, Pending, Past/Rejected) */}
        <section className="space-y-4 pt-2">
          <Tabs
            tabs={[
              { 
                label: `참가 신청 가능 (${availableContests.length})`, 
                value: "available", 
                activeColor: "text-emerald-600 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400" 
              },
              { 
                label: `참가 심사 중 (${pendingContests.length})`, 
                value: "pending", 
                activeColor: "text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-400" 
              },
              { 
                label: `종료 및 반려 (${combinedHistoryContests.length})`, 
                value: "history", 
                activeColor: "text-gray-900 border-gray-900 dark:text-white dark:border-white" 
              },
            ]}
            activeTab={activeListTab}
            onChange={setActiveListTab}
            variant="underline"
            className="gap-4 sm:gap-8 overflow-x-auto scrollbar-custom"
            tabClassName="text-xs sm:text-base pt-2 pb-2 sm:pt-3 sm:pb-3 min-w-0 sm:min-w-[112px]"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {isLoadingPage ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
              ))
            ) : activeListTab === "available" ? (
              availableContests.length > 0 ? (
                availableContests.map((contest) => (
                  <ContestListCard
                    key={contest.id}
                    contest={contest}
                    type="apply"
                    onAction={handleApplyContest}
                    isActionLoading={isApplyingContestId === contest.id}
                  />
                ))
              ) : (
                <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500">현재 신청 가능한 대회가 없습니다.</p>
                </div>
              )
            ) : activeListTab === "pending" ? (
              pendingContests.length > 0 ? (
                pendingContests.map((contest) => (
                  <ContestListCard
                    key={contest.id}
                    contest={contest}
                    type="wait"
                  />
                ))
              ) : (
                <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500">심사 중인 대회가 없습니다.</p>
                </div>
              )
            ) : (
              combinedHistoryContests.length > 0 ? (
                combinedHistoryContests.map((contest) => (
                  <ContestListCard
                    key={contest.id}
                    contest={contest}
                    type={contest.cardType === "reject" ? "reject" : "past"}
                  />
                ))
              ) : (
                <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500">내역이 없습니다.</p>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
