import { create } from "zustand";
import { Reply } from "@/app/(default)/community/types/post";

interface CommentState {
  commentsMap: Map<number, Reply[]>; // postId 기준

  setComments: (postId: number, comments: Reply[]) => void;

  addComment: (postId: number, comment: Reply) => void;

  updateComment: (postId: number, comment: Reply) => void;

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

  addComment: (postId, comment) =>
    set((state) => {
      const prev = state.commentsMap.get(postId) || [];
      const newMap = new Map(state.commentsMap);
      newMap.set(postId, [comment, ...prev]);
      return { commentsMap: newMap };
    }),

  updateComment: (postId, updated) =>
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