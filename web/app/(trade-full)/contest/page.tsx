"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, TrendingUp, Zap, Clock, XCircle } from "lucide-react";
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

const formatShortDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
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

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-200 pb-20 selection:bg-emerald-500 selection:text-white relative">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none -z-0" />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16 relative z-10">
        {/* Header Section */}
        <header className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-3">
              {/* <Sparkles className="w-8 h-8 text-emerald-400" /> */}
              요기망치 투자 대회
            </h1>
            <p className="text-slate-400 font-bold text-base">당신의 투자 감각을 증명할 시간입니다.</p>
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

        {/* 2. Sub-Grid (Available, Pending, Rejected/Past) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Available Contests */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Zap className="w-5 h-5 text-violet-400" />
              참가 신청 가능
            </h2>
            <div className="space-y-3">
              {isLoadingPage ? (
                 Array.from({ length: 2 }).map((_, i) => (
                   <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-white/5 border border-white/10" />
                 ))
              ) : availableContests.length > 0 ? (
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
                <p className="text-slate-500 text-[11px] font-bold py-10 text-center border border-dashed border-white/5 rounded-xl">현재 신청 가능한 대회가 없습니다.</p>
              )}
            </div>
          </section>

          {/* Pending Contests (Approved/Wait) */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-amber-400" />
              참가 심사 중
            </h2>
            <div className="space-y-3">
               {isLoadingPage ? (
                 Array.from({ length: 2 }).map((_, i) => (
                   <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-white/5 border border-white/10" />
                 ))
              ) : pendingContests.length > 0 ? (
                pendingContests.map((contest) => (
                  <ContestListCard
                    key={contest.id}
                    contest={contest}
                    type="wait"
                  />
                ))
              ) : (
                <p className="text-slate-500 text-[11px] font-bold py-10 text-center border border-dashed border-white/5 rounded-xl">심사 중인 대회가 없습니다.</p>
              )}
            </div>
          </section>

          {/* Rejected & Past Contests */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <XCircle className="w-5 h-5 text-rose-400" />
              종료 및 반려
            </h2>
            <div className="space-y-3">
               {isLoadingPage ? (
                 Array.from({ length: 2 }).map((_, i) => (
                   <div key={i} className="h-32 w-full animate-pulse rounded-xl bg-white/5 border border-white/10" />
                 ))
              ) : [...rejectedContests, ...pastContests].length > 0 ? (
                [...rejectedContests, ...pastContests].map((contest) => (
                  <ContestListCard
                    key={contest.id}
                    contest={contest}
                    type={contest.cardType === "reject" ? "reject" : "past"}
                  />
                ))
              ) : (
                <p className="text-slate-500 text-[11px] font-bold py-10 text-center border border-dashed border-white/5 rounded-xl">내역이 없습니다.</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
