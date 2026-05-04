"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Tabs, { type TabOption } from "@/components/ui/Tabs";
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
  ContestListTab,
  OngoingContest,
} from "./components/types";

const CONTEST_PAGE_SIZE = 5;

const CONTEST_TAB_OPTIONS: TabOption[] = [
  { label: "신청 가능 대회", value: "available" },
  { label: "승인 대기/완료", value: "approved" },
  { label: "반려된 대회", value: "rejected" },
  { label: "지난 대회", value: "past" },
];

const isApiStatusError = (error: unknown, statuses: number[]) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return statuses.some((status) => error.message.includes(String(status)));
};

const formatMonthDay = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${month}.${day}`;
};

const formatShortDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

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
  isRecruiting,
  isLive,
}: {
  isRecruiting?: boolean;
  isLive?: boolean;
}) => {
  if (isLive) {
    return "라이브 진행중";
  }

  if (isRecruiting) {
    return "모집중";
  }

  return "참가 중";
};

const mapRecruitingContestToListItem = (season: ContestSeason): ContestListItem => ({
  id: season.id,
  cardType: "apply",
  title: season.title,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  accentLabel: season.isRecruiting ? "모집중" : translateContestDisplayStatus(season),
  summaryLeft: `신청 기간 ${formatContestPeriod(
    season.recruitmentStartAt,
    season.recruitmentEndAt
  )}`,
  summaryRight: `대표 상태 ${translateContestDisplayStatus(season)}`,
  actionLabel:
    season.appliedByMe === true ? "이미 신청한 대회입니다" : "참가 신청하기",
  actionDisabled: season.appliedByMe === true || season.isRecruiting === false,
});

const mapPendingContestToListItem = (
  application: MyContestPendingApplication
): ContestListItem => ({
  id: application.seasonId,
  cardType: "wait",
  title: application.seasonTitle,
  period: formatContestPeriod(
    application.contestStartAt,
    application.contestEndAt
  ),
  accentLabel: "대기",
  summaryLeft: `신청일 ${formatShortDateTime(application.appliedAt)}`,
  summaryRight: `대표 상태 ${translateContestDisplayStatus({
    displayStatus: application.displayStatus,
  })}`,
  actionLabel: "승인 대기중",
  actionDisabled: true,
});

const mapParticipatingContestToListItem = (
  season: ContestParticipationSeason
): ContestListItem => ({
  id: season.seasonId,
  cardType: "approved",
  title: season.seasonTitle,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  accentLabel: season.isLive ? "진행중" : "승인",
  summaryLeft: `진행 상태 ${getContestProgressLabel(season)}`,
  summaryRight: `승인일 ${formatShortDateTime(season.approvedAt)}`,
  actionLabel: season.isLive ? "라이브 진행중" : "승인 완료",
  actionDisabled: true,
});

const mapRejectedContestToListItem = (
  application: MyContestLatestRejectedApplication
): ContestListItem => ({
  id: application.seasonId,
  cardType: "reject",
  title: application.seasonTitle,
  period: "-",
  accentLabel: "반려",
  rejectReason: application.rejectReason,
  summaryLeft: `반려일 ${formatShortDateTime(application.rejectedAt)}`,
  summaryRight: `관리자 ${application.rejectedByAdminNickname}`,
  actionLabel: "반려된 대회",
  actionDisabled: true,
});

const mapPastContestToListItem = (
  season: ContestParticipationSeason
): ContestListItem => ({
  id: season.seasonId,
  cardType: "past",
  title: season.seasonTitle,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  accentLabel: "종료",
  metricPrimaryLabel: "대표 상태",
  metricPrimaryValue: translateContestDisplayStatus({
    displayStatus: season.displayStatus,
  }),
  metricSecondaryLabel: "승인일",
  metricSecondaryValue: formatShortDateTime(season.approvedAt),
  metricSecondaryTone: "neutral",
  actionLabel: "지난 대회",
  actionDisabled: true,
});

const mapOngoingContest = (season: ContestParticipationSeason): OngoingContest => ({
  id: season.seasonId,
  title: season.seasonTitle,
  period: formatContestPeriod(season.contestStartAt, season.contestEndAt),
  statusText: getContestProgressLabel(season),
  targetDateAt: season.isLive ? season.contestEndAt : season.recruitmentEndAt,
  primaryLabel: "진행 상태",
  primaryValue: getContestProgressLabel(season),
  secondaryLabel: "참가 승인일",
  secondaryValue: formatShortDateTime(season.approvedAt),
  secondaryTone: "neutral",
  tertiaryLabel: "대표 상태",
  tertiaryValue: translateContestDisplayStatus({
    displayStatus: season.displayStatus,
  }),
});

type ContestPageData = {
  availableContests: ContestListItem[];
  approvedContests: ContestListItem[];
  rejectedContests: ContestListItem[];
  pastContests: ContestListItem[];
  ongoingContests: OngoingContest[];
  hasPartialError: boolean;
};

const fetchContestPageData = async ({
  isPrivateContestEnabled,
  memberId,
}: {
  isPrivateContestEnabled: boolean;
  memberId?: number;
}): Promise<ContestPageData> => {
  let hasPartialError = false;

  const safeRequest = async <T,>(
    request: Promise<T>,
    fallbackValue: T,
    expectedStatuses: number[] = [401, 403, 404]
  ) => {
    try {
      return await request;
    } catch (error) {
      if (!isApiStatusError(error, expectedStatuses)) {
        hasPartialError = true;
      }

      return fallbackValue;
    }
  };

  const emptyCursorResponse = { content: [] as ContestSeason[] };
  const emptyParticipationResponse = {
    content: [] as ContestParticipationSeason[],
  };
  const emptyPendingResponse = {
    content: [] as MyContestPendingApplication[],
  };

  const recruitingResponse = await safeRequest(
    getRecruitingContestSeasons({ size: CONTEST_PAGE_SIZE }),
    emptyCursorResponse
  );

  const participatingResponse = isPrivateContestEnabled
    ? await safeRequest(
        getMyParticipatingContestSeasons({ size: CONTEST_PAGE_SIZE }),
        emptyParticipationResponse
      )
    : emptyParticipationResponse;

  const pendingResponse = isPrivateContestEnabled
    ? await safeRequest(
        getMyPendingContestApplications({ size: CONTEST_PAGE_SIZE }),
        emptyPendingResponse
      )
    : emptyPendingResponse;

  const rejectedResponse = isPrivateContestEnabled
    ? await safeRequest<MyContestLatestRejectedApplication | null>(
        getMyLatestRejectedContestApplication(),
        null
      )
    : null;

  const participationHistoryResponse =
    memberId !== undefined
      ? await safeRequest(
          getContestParticipationSeasonsByMember(memberId, {
            size: CONTEST_PAGE_SIZE,
          }),
          emptyParticipationResponse
        )
      : emptyParticipationResponse;

  const recruitingContests = Array.isArray(recruitingResponse.content)
    ? recruitingResponse.content
    : [];
  const participatingContests = Array.isArray(participatingResponse.content)
    ? participatingResponse.content
    : [];
  const pendingContests = Array.isArray(pendingResponse.content)
    ? pendingResponse.content
    : [];
  const participationHistory = Array.isArray(participationHistoryResponse.content)
    ? participationHistoryResponse.content
    : [];
  const participatingContestItems =
    participatingContests.map(mapParticipatingContestToListItem);
  const participatingContestIds = new Set(
    participatingContestItems.map((contest) => contest.id)
  );
  const pendingContestItems = pendingContests
    .map(mapPendingContestToListItem)
    .filter((contest) => !participatingContestIds.has(contest.id));

  return {
    availableContests: recruitingContests
      .filter((season) => season.appliedByMe !== true)
      .map(mapRecruitingContestToListItem),
    approvedContests: [
      ...pendingContestItems,
      ...participatingContestItems,
    ].slice(0, CONTEST_PAGE_SIZE),
    rejectedContests: rejectedResponse
      ? [mapRejectedContestToListItem(rejectedResponse)]
      : [],
    pastContests: participationHistory
      .filter((season) => season.displayStatus === "FINISHED")
      .map(mapPastContestToListItem),
    ongoingContests: participatingContests
      .filter((season) => season.isLive === true)
      .map(mapOngoingContest),
    hasPartialError,
  };
};

export default function ContestMainPage() {
  const router = useRouter();
  const { alert, toast } = useFeedback();
  const requireVerifiedUser = useRequireVerifiedUser({
    loginRedirectMode: "push",
    verifyRedirectMode: "push",
  });
  const isLogin = useAuthStore((state) => state.isLogin);
  const user = useAuthStore((state) => state.user);
  const [bottomTab, setBottomTab] = useState<ContestListTab>("available");
  const [selectedActiveId, setSelectedActiveId] = useState(0);
  const [ongoingContests, setOngoingContests] = useState<OngoingContest[]>([]);
  const [availableContests, setAvailableContests] = useState<ContestListItem[]>(
    []
  );
  const [approvedContests, setApprovedContests] = useState<ContestListItem[]>([]);
  const [rejectedContests, setRejectedContests] = useState<ContestListItem[]>([]);
  const [pastContests, setPastContests] = useState<ContestListItem[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageErrorMessage, setPageErrorMessage] = useState("");
  const [isApplyingContestId, setIsApplyingContestId] = useState<number | null>(
    null
  );

  const canViewContestList = isLogin && !!user && user.role !== "USER";

  const loadContestPageData = useCallback(async () => {
    setIsLoadingPage(true);
    setPageErrorMessage("");

    const nextData = await fetchContestPageData({
      isPrivateContestEnabled: isLogin && !!user,
      memberId: user?.memberId,
    });

    setAvailableContests(nextData.availableContests);
    setApprovedContests(nextData.approvedContests);
    setRejectedContests(nextData.rejectedContests);
    setPastContests(nextData.pastContests);
    setOngoingContests(nextData.ongoingContests);
    setPageErrorMessage(
      nextData.hasPartialError
        ? "일부 대회 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요."
        : ""
    );
    setIsLoadingPage(false);
  }, [isLogin, user]);

  useEffect(() => {
    void loadContestPageData();
  }, [loadContestPageData]);

  useEffect(() => {
    if (ongoingContests.length === 0) {
      setSelectedActiveId(0);
      return;
    }

    const hasSelectedContest = ongoingContests.some(
      (contest) => contest.id === selectedActiveId
    );

    if (!hasSelectedContest) {
      setSelectedActiveId(ongoingContests[0].id);
    }
  }, [ongoingContests, selectedActiveId]);

  const activeTabContent = useMemo(
    (): {
      items: ContestListItem[];
      emptyMessage: string;
    } => {
      if (bottomTab === "available") {
        return {
          items: availableContests,
          emptyMessage: canViewContestList
            ? "현재 신청 가능한 대회가 없습니다."
            : !isLogin || !user
              ? "로그인 후 신청 가능한 대회를 확인할 수 있습니다."
              : "인증회원만 신청 가능한 대회를 확인할 수 있습니다.",
        };
      }

      if (bottomTab === "approved") {
        return {
          items: approvedContests,
          emptyMessage: isLogin
            ? "승인 대기 또는 참가 중인 대회가 없습니다."
            : "로그인 후 내 대회 현황을 확인할 수 있습니다.",
        };
      }

      if (bottomTab === "rejected") {
        return {
          items: rejectedContests,
          emptyMessage: isLogin
            ? "최근 반려된 대회가 없습니다."
            : "로그인 후 반려 이력을 확인할 수 있습니다.",
        };
      }

      return {
        items: pastContests,
        emptyMessage: isLogin
          ? "지난 대회 이력이 없습니다."
          : "로그인 후 지난 대회 이력을 확인할 수 있습니다.",
      };
    },
    [
      approvedContests,
      availableContests,
      bottomTab,
      canViewContestList,
      isLogin,
      pastContests,
      rejectedContests,
      user,
    ]
  );

  const handleApplyContest = useCallback(
    async (contest: ContestListItem) => {
      const canApplyContest = await requireVerifiedUser();

      if (!canApplyContest) {
        return;
      }

      try {
        setIsApplyingContestId(contest.id);
        await applyContestSeason(contest.id);
        toast({
          title: "대회 신청이 완료되었습니다.",
          tone: "success",
        });
        await loadContestPageData();
      } catch (error) {
        if (isApiStatusError(error, [401, 403])) {
          await alert("인증회원만 대회에 참가할 수 있습니다.");
          return;
        }

        if (isApiStatusError(error, [409])) {
          await alert("이미 신청했거나 신청이 불가능한 대회입니다.");
          await loadContestPageData();
          return;
        }

        await alert("대회 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setIsApplyingContestId(null);
      }
    },
    [alert, loadContestPageData, requireVerifiedUser, toast]
  );

  return (
    <div className="mx-auto max-w-[1280px] space-y-10">
      <ContestOngoingSection
        isLoading={isLoadingPage}
        contests={ongoingContests}
        selectedContestId={selectedActiveId}
        onSelectContest={setSelectedActiveId}
        onMoveTrading={(contestId) => router.push(`/contest/${contestId}/trading`)}
      />

      <section className="space-y-6">
        {pageErrorMessage ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-500">
            {pageErrorMessage}
          </div>
        ) : null}

        <Tabs
          tabs={CONTEST_TAB_OPTIONS}
          activeTab={bottomTab}
          onChange={(value) => setBottomTab(value as ContestListTab)}
        />

        {isLoadingPage ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm font-bold text-gray-400">
            대회 목록을 불러오는 중입니다.
          </div>
        ) : activeTabContent.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activeTabContent.items.map((contest) => (
              <ContestListCard
                key={contest.id}
                contest={contest}
                type={contest.cardType}
                onAction={
                  bottomTab === "available" ? handleApplyContest : undefined
                }
                isActionLoading={isApplyingContestId === contest.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm font-bold text-gray-400">
            {activeTabContent.emptyMessage}
          </div>
        )}
      </section>
    </div>
  );
}
