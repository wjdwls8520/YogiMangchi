import { create } from "zustand";
import { Reply } from "@/app/(default)/community/types/post";

interface CommentState {
  commentsMap: Map<number, Reply[]>; // postId 기준

  // 초기 댓글 state에 저장
  setComments: (postId: number, comments: Reply[]) => void;
  // 댓글 등록 시 state에 저장
  addComment: (postId: number, comment: Reply) => void;
  // 댓글 더보기 시 state에 저장
  moreComments: (postId: number, comment: Reply[]) => void;
  // 댓글 수정 시 state에 저장
  replaceComment: (postId: number, comment: Reply) => void;
  // 댓글 삭제 시 state에 저장
  removeComment: (postId: number, commentId: number) => void;
}

export const useCommentStore = create<CommentState>((set) => ({
  commentsMap: new Map(),

  setComments: (postId, comments) =>
    set((state) => {
      const newMap = new Map(state.commentsMap);
      newMap.set(postId, comments);
      return { commentsMap: newMap };
    }),

  addComment: (postId, newComment) =>
    set((state) => {
      const prev = state.commentsMap.get(postId) || [];
      const mergedMap = new Map(
        [newComment, ...prev].map((c) => [c.id, c])
      );

      return {
        commentsMap: new Map(state.commentsMap).set(
          postId,
          Array.from(mergedMap.values())
        ),
      };
    }),

  moreComments: (postId, newComments) =>
    set((state) => {
      const prev = state.commentsMap.get(postId) || [];
      const mergedMap = new Map(
        [...prev, ...newComments].map((c) => [c.id, c])
      );

      return {
        commentsMap: new Map(state.commentsMap).set(
          postId,
          Array.from(mergedMap.values())
        ),
      };
    }),

  replaceComment: (postId, updated) =>
    set((state) => {
      const prev = state.commentsMap.get(postId) || [];
      const newMap = new Map(state.commentsMap);

      newMap.set(
        postId,
        prev.map((c) => (c.id === updated.id ? updated : c))
      );

      return { commentsMap: newMap };
    }),

  removeComment: (postId, commentId) =>
    set((state) => {
      const prev = state.commentsMap.get(postId) || [];
      const newMap = new Map(state.commentsMap);

      newMap.set(
        postId,
        prev.filter((c) => c.id !== commentId)
      );

      return { commentsMap: newMap };
    }),
}));