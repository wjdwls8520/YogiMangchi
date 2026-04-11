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
  | "likedReplies"
  | "reports";

export type ReportReason = {
  code: string;
  label: string;
};

export type ReportedPost = {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  memberId: number;
  nickname: string;
  profileImg: string | null;
  reportReason: ReportReason;
};

export type ReportedReply = {
  id: number;
  content: string;
  likeCount: number;
  likedByMe: boolean;
  reportCount: number;
  reportedByMe: boolean;
  replyCount: number;
  parentReplyId: number | null;
  targetReplyId: number | null;
  targetMemberId: number | null;
  targetNickname: string | null;
  createdAt: string;
  updatedAt: string;
  memberId: number;
  nickname: string;
  profileImgUrl: string | null;
  postId: number;
  deleteYn: string;
  reportReason: ReportReason;
};

export type ProfileReportItem = {
  type: "post" | "reply";
  id: number;
  postId: number;
  title: string;
  content: string;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  reportReasonLabel: string;
};

export type ProfileReply = Reply;
