import { create } from "zustand";
import { Reply } from "@/app/(default)/community/types/post";

interface CommentState {
  commentsMap: Map<number, Reply[]>; // postId 기준

  setComments: (postId: number, comments: Reply[]) => void;

  addComments: (postId: number, comment: Reply[]) => void;

  replaceComment: (postId: number, comment: Reply) => void;

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

  addComments: (postId, newComments) =>
    set((state) => {
      const prev = state.commentsMap.get(postId) || [];
      console.log(prev)
      const mergedMap = new Map(
        [...prev, ...newComments].map((c) => [c.id, c])
      );
      console.log(newComments)
      
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