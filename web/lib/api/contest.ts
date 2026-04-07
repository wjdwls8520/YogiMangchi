import { fetchClient } from "./client";

// 대회 시즌 상태 코드와 라벨
export type ContestSeasonStatus = {
  code: string;
  label: string;
};

// 모집중/진행중 대회 시즌 한 건 정보
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
  status?: ContestSeasonStatus;
  appliedByMe?: boolean;
};

// 커서 기반 대회 시즌 목록 응답
type ContestSeasonCursorResponse = {
  content?: ContestSeason[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

// 현재 참가 신청을 받고 있는 대회 시즌 목록 조회
export const getRecruitingContestSeasons = async ({
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
    `contest/seasons/recruiting${query ? `?${query}` : ""}`
  ) as Promise<ContestSeasonCursorResponse>;
};

// 선택한 시즌에 참가 신청
export const applyContestSeason = async (seasonId: number) => {
  await fetchClient(`contest/seasons/${seasonId}/applications`, {
    method: "POST",
  });
};
