import type { MemberInfo } from "@/types/member";
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

export type OAuthEmailResponse = {
  email: string;
};

export type MyMemberProfileResponse = {
  memberId: number;
  provider: string;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  bestCount: number;
  followerCount: number;
  followingCount: number;
  term_agree: boolean;
  private_agree: boolean;
  role: MemberInfo["role"] | string;
  phone_number?: string;
  phoneNumber?: string;
  address_code?: string;
  addressCode?: string;
  address1?: string | null;
  address2?: string | null;
};

export type MyVerifiedInfoResponse = {
  email?: string;
  verifiedEmail?: string;
  phone_number?: string;
  phoneNumber?: string;
  address_code?: string;
  addressCode?: string;
  address1?: string;
  address2?: string | null;
  isVerified?: boolean;
  isVeried?: boolean;
};

export type CompleteVerificationRequest = {
  phoneNumber: string;
  addressCode: string;
  address1: string;
  address2?: string;
};

export type UpdateMyProfileRequest = {
  nickname?: string;
  profileMsg?: string;
  type?: "reset";
  profileImage?: File;
};

// 다른 유저 공개 프로필 정보 조회
export const getMemberInfo = async (memberId: number) => {
  return fetchClient(`member/${memberId}/info`) as Promise<MemberProfileInfo>;
};

// 현재 로그인한 회원 정보 조회
export const getMyMemberInfo = async () => {
  return fetchClient("member/me/info") as Promise<MemberInfo>;
};

// 현재 로그인한 회원의 확장 프로필 정보 조회
export const getMyMemberProfile = async () => {
  return fetchClient("member/me/info") as Promise<MyMemberProfileResponse>;
};

// 현재 로그인한 회원의 인증회원 상세 정보 조회
export const getMyVerifiedInfo = async () => {
  return fetchClient("member/me/verified-info") as Promise<MyVerifiedInfoResponse>;
};

// 현재 로그인한 회원 기본 프로필 수정
export const updateMyProfileInfo = async ({
  nickname,
  profileMsg,
  type,
  profileImage,
}: UpdateMyProfileRequest) => {
  const params = new URLSearchParams();

  if (nickname !== undefined) {
    params.set("nickname", nickname);
  }

  if (profileMsg !== undefined) {
    params.set("profileMsg", profileMsg);
  }

  if (type) {
    params.set("type", type);
  }

  const formData = new FormData();

  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const queryString = params.toString();

  return fetchClient(
    `member/me/info${queryString ? `?${queryString}` : ""}`,
    {
      method: "PATCH",
      body: formData,
    }
  ) as Promise<MyMemberProfileResponse>;
};

// 소셜 로그인 이메일 조회
export const getOAuthEmail = async () => {
  return fetchClient("member/email/oauth") as Promise<OAuthEmailResponse>;
};

// 이메일 인증코드 발송
export const sendEmailVerificationCode = async (email: string) => {
  return fetchClient("member/email/send", {
    method: "POST",
    body: { email },
  });
};

// 이메일 인증코드 검증
export const verifyEmailVerificationCode = async (
  email: string,
  code: string
) => {
  return fetchClient("member/email/verify", {
    method: "POST",
    body: { email, code },
  });
};

// 인증회원 전환 완료
export const completeMemberVerification = async (
  payload: CompleteVerificationRequest
) => {
  return fetchClient("member/email/complete", {
    method: "POST",
    body: payload,
  });
};

// 인증회원 상세 정보 수정
export const updateMyVerifiedInfo = async (
  payload: CompleteVerificationRequest
) => {
  return fetchClient("member/me/verified-info", {
    method: "PATCH",
    body: payload,
  });
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
