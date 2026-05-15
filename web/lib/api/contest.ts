import { fetchClient } from "./client";

export type ContestDisplayStatusCode =
  | "DRAFT"
  | "PUBLISHED"
  | "FINISHED"
  | "CANCELED";

export type ContestSeasonDisplayStatus =
  | "비공개"
  | "공개중"
  | "종료"
  | "취소됨";

export type ContestSeason = {
  id: number;
  title: string;
  description: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
  createdAt?: string;
  updatedAt?: string;
  isRecruiting?: boolean;
  isLive?: boolean;
  isPublic?: boolean;
  isCancel?: boolean;
  settledAt?: string;
  displayStatus?: ContestDisplayStatusCode | string;
  appliedByMe?: boolean;
};

export type ContestSeasonStatusResponse = {
  code: string;
  label: string;
};

export type ContestParticipationSeason = {
  participantId: number;
  appliedAt: string;
  approvedAt: string;
  seasonId: number;
  seasonTitle: string;
  seasonDescription: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
  seasonCreatedAt: string;
  seasonUpdatedAt: string;
  isRecruiting: boolean;
  isLive: boolean;
  displayStatus: string;
};

export type MyContestPendingApplication = {
  applicantId: number;
  appliedAt: string;
  seasonId: number;
  seasonTitle: string;
  seasonDescription: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
  seasonCreatedAt: string;
  seasonUpdatedAt: string;
  isRecruiting: boolean;
  isLive: boolean;
  displayStatus: string;
};

export type MyContestLatestRejectedApplication = {
  rejectedApplicantId: number;
  seasonId: number;
  seasonTitle: string;
  seasonDescription: string;
  isRecruiting: boolean;
  isLive: boolean;
  displayStatus: string;
  appliedAt: string;
  rejectedAt: string;
  rejectReason: string;
  rejectedByAdminId: number;
  rejectedByAdminNickname: string;
  rejectedByAdminProfileImgUrl?: string;
};

export type ContestCursorResponse<T> = {
  content?: T[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

type CursorParams = {
  cursorId?: number;
  size?: number;
};

const buildCursorQuery = ({ cursorId, size }: CursorParams = {}) => {
  const params = new URLSearchParams();

  if (cursorId !== undefined) {
    params.set("cursorId", String(cursorId));
  }

  if (size !== undefined) {
    params.set("size", String(size));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

// displayStatus는 대표 상태만 표현하고, 모집/진행 여부는 isRecruiting/isLive로 따로 봅니다.
export const translateContestDisplayStatus = ({
  displayStatus,
}: {
  displayStatus?: string;
}): ContestSeasonDisplayStatus => {
  if (displayStatus === "DRAFT") {
    return "비공개";
  }

  if (displayStatus === "PUBLISHED") {
    return "공개중";
  }

  if (displayStatus === "FINISHED") {
    return "종료";
  }

  if (displayStatus === "CANCELED") {
    return "취소됨";
  }

  return "비공개";
};

export const inferContestIsPublic = ({
  isPublic,
  displayStatus,
}: Pick<ContestSeason, "isPublic" | "displayStatus">) => {
  if (typeof isPublic === "boolean") {
    return isPublic;
  }

  return displayStatus === "PUBLISHED" || displayStatus === "FINISHED";
};

export const inferContestIsCanceled = ({
  isCancel,
  displayStatus,
}: Pick<ContestSeason, "isCancel" | "displayStatus">) => {
  if (typeof isCancel === "boolean") {
    return isCancel;
  }

  return displayStatus === "CANCELED";
};

// 현재 참가 신청을 받고 있는 대회 시즌 목록 조회
export const getRecruitingContestSeasons = async ({
  cursorId,
  size,
}: CursorParams = {}) => {
  return fetchClient(
    `contest/seasons/recruiting${buildCursorQuery({ cursorId, size })}`
  ) as Promise<ContestCursorResponse<ContestSeason>>;
};

// 선택한 시즌에 참가 신청
export const applyContestSeason = async (seasonId: number) => {
  await fetchClient(`contest/seasons/${seasonId}/applications`, {
    method: "POST",
  });
};

// 대회 표시 상태 목록 조회
export const getContestSeasonStatuses = async () => {
  return fetchClient(
    "contest/seasons/statuses"
  ) as Promise<ContestSeasonStatusResponse[]>;
};

// 특정 회원의 전체 대회 참가 이력 조회
export const getContestParticipationSeasonsByMember = async (
  memberId: number,
  { cursorId, size }: CursorParams = {}
) => {
  return fetchClient(
    `contest/member/${memberId}/participation-seasons${buildCursorQuery({
      cursorId,
      size,
    })}`
  ) as Promise<ContestCursorResponse<ContestParticipationSeason>>;
};

// 내 참가 중인 대회 목록 조회
export const getMyParticipatingContestSeasons = async ({
  cursorId,
  size,
}: CursorParams = {}) => {
  return fetchClient(
    `me/contest/participating-seasons${buildCursorQuery({ cursorId, size })}`
  ) as Promise<ContestCursorResponse<ContestParticipationSeason>>;
};

// 내 승인 대기 중인 대회 신청 목록 조회
export const getMyPendingContestApplications = async ({
  cursorId,
  size,
}: CursorParams = {}) => {
  return fetchClient(
    `me/contest/pending-applications${buildCursorQuery({ cursorId, size })}`
  ) as Promise<ContestCursorResponse<MyContestPendingApplication>>;
};

// 내 최근 반려된 대회 신청 이력 조회
export const getMyLatestRejectedContestApplication = async () => {
  return fetchClient(
    "me/contest/rejected-applications/latest"
  ) as Promise<MyContestLatestRejectedApplication>;
};

export type MyContestSeasonResult = {
  participantId: number;
  seasonId: number;
  seasonTitle: string;
  contestStartAt: string;
  contestEndAt: string;
  settledAt: string;
  finalRealizedPnl: number;
  finalProfitRate: number;
  finalRank: number;
};

// 내 특정 시즌 정산 결과 조회 (순위 포함)
export const getMyContestSeasonResult = async (seasonId: number) => {
  return fetchClient(`me/contest/seasons/${seasonId}/result`, {
    method: "GET",
  }) as Promise<MyContestSeasonResult>;
};

