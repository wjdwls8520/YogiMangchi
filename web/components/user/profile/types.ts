import type { Reply } from "@/app/(default)/community/types/post";

export type MemberRole = "USER" | "VERIFIED_USER" | "ADMIN";

export type BaseMemberProfile = {
  memberId: number;
  nickname: string;
  profileImgUrl: string | null;
  profileMsg: string | null;
  bestCount: number;
  followerCount: number;
  followingCount: number;
};

export type MyMemberProfile = BaseMemberProfile & {
  provider: string;
  term_agree: boolean;
  private_agree: boolean;
  role: MemberRole;
};

export type MemberProfileInfo = BaseMemberProfile & {
  followedByMe: boolean;
  followingMe: boolean;
};

export type LikedPost = {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
};

export type ProfileCommunityTab =
  | "posts"
  | "replies"
  | "likedPosts"
  | "likedReplies";

export type ProfileReply = Reply;
