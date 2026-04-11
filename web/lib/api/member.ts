import { fetchClient } from "./client";

export type MemberProfileInfo = {
  memberId: number;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  bestCount: number;
  followerCount: number;
  followingCount: number;
  followedByMe: boolean;
  followingMe: boolean;
};

// 다른 유저 공개 프로필 정보 조회
export const getMemberInfo = async (memberId: number) => {
  return fetchClient(`member/${memberId}/info`) as Promise<MemberProfileInfo>;
};

export type FollowResponse = {
  targetId: number;
  followerCount: number;
  followedByMe: boolean;
};

export type FollowMember = {
  memberId: number;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  bestCount: number;
  followerCount: number;
  followingCount: number;
  followCreatedAt: string;
};

export type CursorResponse<T> = {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
};

const getMemberFollowListQueryString = (params?: {
  cursorId?: number;
  size?: number;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.cursorId !== undefined) {
    searchParams.set("cursorId", String(params.cursorId));
  }

  if (params?.size !== undefined) {
    searchParams.set("size", String(params.size));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

// 다른 유저 팔로우
export const followMember = async (targetMemberId: number) => {
  return fetchClient(`member/${targetMemberId}/follows`, {
    method: "PUT",
  }) as Promise<FollowResponse>;
};

// 다른 유저 언팔로우
export const unfollowMember = async (targetMemberId: number) => {
  return fetchClient(`member/${targetMemberId}/follows`, {
    method: "DELETE",
  }) as Promise<FollowResponse>;
};

// 특정 멤버의 팔로워 목록 조회
export const getMemberFollowers = async (
  memberId: number,
  params?: {
    cursorId?: number;
    size?: number;
  }
) => {
  return fetchClient(
    `member/${memberId}/followers${getMemberFollowListQueryString(params)}`
  ) as Promise<CursorResponse<FollowMember>>;
};

// 특정 멤버의 팔로잉 목록 조회
export const getMemberFollowings = async (
  memberId: number,
  params?: {
    cursorId?: number;
    size?: number;
  }
) => {
  return fetchClient(
    `member/${memberId}/followings${getMemberFollowListQueryString(params)}`
  ) as Promise<CursorResponse<FollowMember>>;
};
