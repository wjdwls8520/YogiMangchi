import { fetchClient } from "./client";

export type AdminMemberRole = "USER" | "VERIFIED_USER" | "ADMIN";

export type AdminMember = {
  memberId: number;
  nickname: string;
  profileImgUrl?: string;
  role: AdminMemberRole;
  deleteYn: "Y" | "N";
  createdAt: string;
  oauthEmail?: string;
  oauthProvider?: string;
  oauthProviderUserId?: string;
};

export type AdminMemberCursorResponse = {
  content?: AdminMember[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

export type AdminMemberSearchParams = {
  status?: "ALL" | "ACTIVE" | "WITHDRAWN";
  role?: "ALL" | "USER" | "VERIFIED_USER" | "ADMIN";
  memberId?: number;
  nickname?: string;
  cursorId?: number;
  size?: number;
};

// 어드민용 회원 목록 조회
export const getAdminMembers = async (searchParams: AdminMemberSearchParams = {}) => {
  const params = new URLSearchParams();

  if (searchParams.status) {
    params.set("status", searchParams.status);
  }
  if (searchParams.role) {
    params.set("role", searchParams.role);
  }
  if (searchParams.memberId !== undefined) {
    params.set("memberId", String(searchParams.memberId));
  }
  if (searchParams.nickname) {
    params.set("nickname", searchParams.nickname);
  }
  if (searchParams.cursorId !== undefined) {
    params.set("cursorId", String(searchParams.cursorId));
  }
  if (searchParams.size !== undefined) {
    params.set("size", String(searchParams.size));
  }

  const query = params.toString();
  return fetchClient(`admin/members${query ? `?${query}` : ""}`, {
    method: "GET",
  }) as Promise<AdminMemberCursorResponse>;
};

// 어드민용 회원 강제 탈퇴
export const withdrawMemberByAdmin = async (memberId: number) => {
  return fetchClient(`admin/members/${memberId}`, {
    method: "DELETE",
  });
};
