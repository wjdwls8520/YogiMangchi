import { fetchClient } from "./client";

export type AdminPost = {
  postId: number;
  title: string;
  content: string;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  deleteYn: "Y" | "N";
  createdAt: string;
  updatedAt: string;
  authorId: number;
  authorNickname: string;
};

export type AdminReply = {
  replyId: number;
  content: string;
  likeCount: number;
  reportCount: number;
  deleteYn: "Y" | "N";
  createdAt: string;
  updatedAt: string;
  postId: number;
  authorId: number;
  authorNickname: string;
  postTitle: string;
};

export type AdminPostCursorResponse = {
  content?: AdminPost[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

export type AdminReplyCursorResponse = {
  content?: AdminReply[];
  nextCursorId?: number | null;
  hasNext?: boolean;
};

export type AdminPostSearchParams = {
  title?: string;
  content?: string;
  authorNickname?: string;
  cursorId?: number;
  size?: number;
};

export type AdminReplySearchParams = {
  postTitle?: string;
  postContent?: string;
  replyContent?: string;
  authorNickname?: string;
  cursorId?: number;
  size?: number;
};

// 어드민 게시글 목록 조회
export const getAdminPosts = async (
  searchParams: AdminPostSearchParams = {},
  authorStatus: "ALL" | "WITHDRAWN" | "ACTIVE" = "ALL"
) => {
  const params = new URLSearchParams();

  if (searchParams.title) {
    params.set("title", searchParams.title);
  }
  if (searchParams.content) {
    params.set("content", searchParams.content);
  }
  if (searchParams.authorNickname) {
    params.set("authorNickname", searchParams.authorNickname);
  }
  if (searchParams.cursorId !== undefined) {
    params.set("cursorId", String(searchParams.cursorId));
  }
  if (searchParams.size !== undefined) {
    params.set("size", String(searchParams.size));
  }

  const query = params.toString();
  let subPath = "posts";
  if (authorStatus === "WITHDRAWN") {
    subPath = "posts/withdrawn-author";
  } else if (authorStatus === "ACTIVE") {
    subPath = "posts/active-author";
  }

  return fetchClient(`admin/community/${subPath}${query ? `?${query}` : ""}`, {
    method: "GET",
  }) as Promise<AdminPostCursorResponse>;
};

// 어드민 게시글 강제 삭제
export const deletePostByAdmin = async (postId: number) => {
  return fetchClient(`admin/community/posts/${postId}`, {
    method: "DELETE",
  });
};

// 어드민 댓글 목록 조회
export const getAdminReplies = async (
  searchParams: AdminReplySearchParams = {},
  authorStatus: "ALL" | "WITHDRAWN" | "ACTIVE" = "ALL"
) => {
  const params = new URLSearchParams();

  if (searchParams.postTitle) {
    params.set("postTitle", searchParams.postTitle);
  }
  if (searchParams.postContent) {
    params.set("postContent", searchParams.postContent);
  }
  if (searchParams.replyContent) {
    params.set("replyContent", searchParams.replyContent);
  }
  if (searchParams.authorNickname) {
    params.set("authorNickname", searchParams.authorNickname);
  }
  if (searchParams.cursorId !== undefined) {
    params.set("cursorId", String(searchParams.cursorId));
  }
  if (searchParams.size !== undefined) {
    params.set("size", String(searchParams.size));
  }

  const query = params.toString();
  let subPath = "replies";
  if (authorStatus === "WITHDRAWN") {
    subPath = "replies/withdrawn-author";
  } else if (authorStatus === "ACTIVE") {
    subPath = "replies/active-author";
  }

  return fetchClient(`admin/community/${subPath}${query ? `?${query}` : ""}`, {
    method: "GET",
  }) as Promise<AdminReplyCursorResponse>;
};

// 어드민 댓글 강제 삭제
export const deleteReplyByAdmin = async (replyId: number) => {
  return fetchClient(`admin/community/replies/${replyId}`, {
    method: "DELETE",
  });
};
