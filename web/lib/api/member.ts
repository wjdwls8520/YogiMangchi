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
