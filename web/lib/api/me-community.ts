import { fetchClient } from "./client";

// 커서 기반 내 활동 목록 조회에 공통으로 쓰는 파라미터
export type CursorParams = {
  cursorId?: number;
  size?: number;
};

// 게시글 목록은 검색어를 같이 받을 수 있다
export type PostSearchParams = CursorParams & {
  keyword?: string;
};

// 좋아요한 댓글 조회는 parentId로 댓글/대댓글을 나눠 볼 수 있다
export type LikedReplyParams = CursorParams & {
  parentId?: number;
};

export type ReportedPostParams = PostSearchParams;
export type ReportedReplyParams = LikedReplyParams;

const buildQueryString = (paramsObject: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();

  Object.entries(paramsObject).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    params.append(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

// 특정 회원이 작성한 게시글 목록 조회
export const getMemberPosts = async (
  memberId: number,
  { cursorId, keyword, size }: PostSearchParams = {}
) => {
  const query = buildQueryString({ cursorId, keyword, size });

  return fetchClient(`community/member/${memberId}/posts${query}`);
};

// 특정 회원이 작성한 댓글/대댓글 목록 조회
export const getMemberReplies = async (
  memberId: number,
  { cursorId, size }: CursorParams = {}
) => {
  const query = buildQueryString({ cursorId, size });

  return fetchClient(`community/member/${memberId}/replys${query}`);
};

// 내가 좋아요한 게시글 목록 조회
export const getLikedPosts = async ({
  cursorId,
  keyword,
  size,
}: PostSearchParams = {}) => {
  const query = buildQueryString({ cursorId, keyword, size });

  return fetchClient(`me/community/liked-posts${query}`);
};

// 내가 좋아요한 댓글/대댓글 목록 조회
export const getLikedReplies = async ({
  cursorId,
  parentId,
  size,
}: LikedReplyParams = {}) => {
  const query = buildQueryString({ cursorId, parentId, size });

  return fetchClient(`me/community/liked-replys${query}`);
};

// 내가 신고한 게시글 목록 조회
export const getReportedPosts = async ({
  cursorId,
  keyword,
  size,
}: ReportedPostParams = {}) => {
  const query = buildQueryString({ cursorId, keyword, size });

  return fetchClient(`me/reports/posts${query}`);
};

// 내가 신고한 댓글/대댓글 목록 조회
export const getReportedReplies = async ({
  cursorId,
  parentId,
  size,
}: ReportedReplyParams = {}) => {
  const query = buildQueryString({ cursorId, parentId, size });

  return fetchClient(`me/reports/replys${query}`);
};

// 내가 신고한 게시글 신고 취소
export const cancelReportedPost = async (postId: number) => {
  return fetchClient(`community/posts/${postId}/reports`, {
    method: "DELETE",
  });
};

// 내가 신고한 댓글/대댓글 신고 취소
export const cancelReportedReply = async (postId: number, replyId: number) => {
  return fetchClient(`community/posts/${postId}/replys/${replyId}/reports`, {
    method: "DELETE",
  });
};

