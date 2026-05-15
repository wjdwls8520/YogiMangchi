import type { ContestSeason } from "./contest";
import { fetchClient } from "./client";

// 관리자 페이지에서 사용하는 대회 시즌 생성/수정/운영용 API 모음입니다.
export type ContestCreateParams = {
  title: string;
  description: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
};

export type ContestSeasonUpdateParams = ContestCreateParams;

export type ContestSeasonStatusUpdateParams = {
  isPublic: boolean;
  isCancel: boolean;
};

export type ContestSeasonCursorResponse = {
  content?: ContestSeason[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

export type ContestApplicant = {
  applicantId: number;
  memberId: number;
  nickname: string;
  profileImgUrl?: string;
  appliedAt: string;
};

export type ContestParticipant = {
  participantId: number;
  memberId: number;
  nickname: string;
  profileImgUrl?: string;
  appliedAt: string;
  approvedAt?: string;
  approvedByAdminId?: number;
  approvedByAdminNickname?: string;
  approvedByAdminProfileImgUrl?: string;
};

export type ContestRejectedApplicant = {
  rejectedApplicantId: number;
  memberId: number;
  nickname: string;
  profileImgUrl?: string;
  appliedAt: string;
  rejectedAt?: string;
  rejectReason: string;
  rejectedByAdminId?: number;
  rejectedByAdminNickname?: string;
  rejectedByAdminProfileImgUrl?: string;
};

export type ContestSettlementResult = {
  seasonId: number;
  seasonTitle: string;
  settledAt: string;
  deactivatedWalletCount: number;
  liquidatedPositionCount: number;
  participantCount: number;
  finalizedParticipantCount: number;
  alreadySettled: boolean;
};

export type ContestCursorResponse<T> = {
  content?: T[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

// datetime-local 입력값은 초가 빠지므로 백엔드 date-time 형식에 맞게 보정합니다.
const toApiDateTimeString = (value: string) => {
  return value.length === 16 ? `${value}:00` : value;
};

// 관리자용 대회 시즌 생성
export const createContestSeason = async (
  params: ContestCreateParams
) => {
  return fetchClient("admin/contest/seasons", {
    method: "POST",
    body: {
      ...params,
      recruitmentStartAt: toApiDateTimeString(params.recruitmentStartAt),
      recruitmentEndAt: toApiDateTimeString(params.recruitmentEndAt),
      contestStartAt: toApiDateTimeString(params.contestStartAt),
      contestEndAt: toApiDateTimeString(params.contestEndAt),
    },
  }) as Promise<ContestSeason>;
};

// 관리자용 대회 시즌 목록 조회
export const getAdminContestSeasons = async ({
  cursorId,
  size,
}: {
  cursorId?: number;
  size?: number;
} = {}) => {
  const params = new URLSearchParams();

  if (cursorId !== undefined) {
    params.set("cursorId", String(cursorId));
  }

  if (size !== undefined) {
    params.set("size", String(size));
  }

  const query = params.toString();

  return fetchClient(
    `admin/contest/seasons${query ? `?${query}` : ""}`
  ) as Promise<ContestSeasonCursorResponse>;
};

// 상세 전용 API가 없어 목록을 순회하며 특정 시즌을 찾습니다.
export const getAdminContestSeasonById = async (seasonId: number) => {
  let cursorId: number | undefined;

  while (true) {
    const response = await getAdminContestSeasons({ cursorId, size: 10 });
    const seasons = response.content ?? [];
    const targetSeason = seasons.find((season) => season.id === seasonId);

    if (targetSeason) {
      return targetSeason;
    }

    if (!response.hasNext || response.nextCursorId == null) {
      return null;
    }

    cursorId = response.nextCursorId;
  }
};

// 관리자용 대회 시즌 기본 정보 수정
export const updateContestSeason = async (
  seasonId: number,
  params: ContestSeasonUpdateParams
) => {
  return fetchClient(`admin/contest/seasons/${seasonId}`, {
    method: "PUT",
    body: {
      ...params,
      recruitmentStartAt: toApiDateTimeString(params.recruitmentStartAt),
      recruitmentEndAt: toApiDateTimeString(params.recruitmentEndAt),
      contestStartAt: toApiDateTimeString(params.contestStartAt),
      contestEndAt: toApiDateTimeString(params.contestEndAt),
    },
  }) as Promise<ContestSeason>;
};

// 관리자용 공개/취소 상태 변경
export const updateContestSeasonStatus = async (
  seasonId: number,
  params: ContestSeasonStatusUpdateParams
) => {
  return fetchClient(`admin/contest/seasons/${seasonId}/status`, {
    method: "PATCH",
    body: params,
  }) as Promise<ContestSeason>;
};

// 특정 시즌의 승인 대기 신청자 목록 조회
export const getContestApplicants = async (
  seasonId: number,
  {
    cursorId,
    size,
  }: {
    cursorId?: number;
    size?: number;
  } = {}
) => {
  const params = new URLSearchParams();

  if (cursorId !== undefined) {
    params.set("cursorId", String(cursorId));
  }

  if (size !== undefined) {
    params.set("size", String(size));
  }

  const query = params.toString();

  return fetchClient(
    `admin/contest/seasons/${seasonId}/applicants${query ? `?${query}` : ""}`
  ) as Promise<ContestCursorResponse<ContestApplicant>>;
};

// 특정 시즌의 참가 승인 완료 사용자 목록 조회
export const getContestParticipants = async (
  seasonId: number,
  {
    cursorId,
    size,
  }: {
    cursorId?: number;
    size?: number;
  } = {}
) => {
  const params = new URLSearchParams();

  if (cursorId !== undefined) {
    params.set("cursorId", String(cursorId));
  }

  if (size !== undefined) {
    params.set("size", String(size));
  }

  const query = params.toString();

  return fetchClient(
    `admin/contest/seasons/${seasonId}/participants${query ? `?${query}` : ""}`
  ) as Promise<ContestCursorResponse<ContestParticipant>>;
};

// 특정 시즌의 반려 이력 목록 조회
export const getRejectedContestApplicants = async (
  seasonId: number,
  {
    cursorId,
    size,
  }: {
    cursorId?: number;
    size?: number;
  } = {}
) => {
  const params = new URLSearchParams();

  if (cursorId !== undefined) {
    params.set("cursorId", String(cursorId));
  }

  if (size !== undefined) {
    params.set("size", String(size));
  }

  const query = params.toString();

  return fetchClient(
    `admin/contest/seasons/${seasonId}/rejected-applicants${
      query ? `?${query}` : ""
    }`
  ) as Promise<ContestCursorResponse<ContestRejectedApplicant>>;
};

// 단건 신청 승인
export const approveContestApplicant = async (
  seasonId: number,
  applicantId: number
) => {
  return fetchClient(
    `admin/contest/seasons/${seasonId}/applicants/${applicantId}/approve`,
    {
      method: "POST",
    }
  );
};

// 단건 신청 반려
export const rejectContestApplicant = async (
  seasonId: number,
  applicantId: number,
  rejectReason: string
) => {
  return fetchClient(
    `admin/contest/seasons/${seasonId}/applicants/${applicantId}/reject`,
    {
      method: "POST",
      body: {
        rejectReason,
      },
    }
  );
};

// 대회 강제 종료 (정산)
export const settleContestSeason = async (seasonId: number) => {
  return fetchClient(`admin/contest/seasons/${seasonId}/settlement`, {
    method: "POST",
  }) as Promise<ContestSettlementResult>;
};
