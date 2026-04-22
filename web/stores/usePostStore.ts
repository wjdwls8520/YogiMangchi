import { create } from "zustand";
import { Post } from "@/app/(default)/community/types/post";

interface PostsState {
  postsMap: Map<number, Post>;

  hasMore: boolean; // 무한스크롤할 게시물이 있는지

  cursorId: number | null; // 무한스크롤 시 다음 커서

  setHasMore: (arg0: boolean) => void;

  setCursorId: (arg0: number | null) => void;

  // 첫 화면에서 보여줄 배열
  setPosts: (newPosts: Post[]) => void;

  // 게시글 작성 (맨 앞에 추가)
  addPost: (post: Post) => void;

  // 무한 스크롤, 리스트 뒤에 추가
  appendPosts: (newPosts: Post[]) => void;

  // 게시글 삭제
  removePost: (postId: number) => void;

  // 게시글 업데이트
  replacePost: (replacePost: Post) => void;

  // optimistic 임시 글을 서버 응답 글로 치환
  reconcilePost: (tempPostId: number, nextPost: Post) => void;
}

export const usePostStore = create<PostsState>((set) => ({
    postsMap: new Map(),

    hasMore: false,

    cursorId: null,

    setPosts: (posts: Post[]) =>
      set((state) => {
        const incomingIds = new Set(posts.map((post) => post.id));
        const localOnlyPosts = Array.from(state.postsMap.values()).filter(
          (post) => !incomingIds.has(post.id)
        );

        return {
          postsMap: new Map(
            [...posts, ...localOnlyPosts].map((post) => [post.id, post])
          )
        };
      }),

    // 무한스크롤 시 스크롤 여부 업데이트
    setHasMore: (more) => set({
      hasMore: more
    }),

    setCursorId: (id) => set({
      cursorId: id
    }),

    // 글 생성 시 state 업데이트
    addPost: (post: Post) =>
        set((state) => {
        const newMap = new Map([[post.id, post], ...state.postsMap.entries()]);
        return {
                postsMap: newMap
            };
    }),

    // 무한 스크롤 시 현재 state 배열에 추가
    appendPosts: (newPosts: Post[]) =>
        set((state) => {
            const newMap = new Map(state.postsMap);
            newPosts.forEach((post) => {
              newMap.set(post.id, post); // 중복 자동 제거
            });
            return {
                postsMap: newMap
            };
    }),

  removePost: (postId: number) =>
    set((state) => {
        const newMap = new Map(state.postsMap);
        newMap.delete(postId);
        return {
            postsMap: newMap
        };
    }),

    // 업데이트
  replacePost: (replacePost: Post) =>
    set((state) => {
      const newMap = new Map(state.postsMap);
      newMap.set(replacePost.id, replacePost);

      return {
        postsMap: newMap
      };
    }),

  reconcilePost: (tempPostId: number, nextPost: Post) =>
    set((state) => {
      const nextEntries: [number, Post][] = [];
      let hasReconciled = false;

      state.postsMap.forEach((post, postId) => {
        if (postId === tempPostId) {
          nextEntries.push([nextPost.id, nextPost]);
          hasReconciled = true;
          return;
        }

        if (postId === nextPost.id) {
          return;
        }

        nextEntries.push([postId, post]);
      });

      if (!hasReconciled) {
        nextEntries.unshift([nextPost.id, nextPost]);
      }

      return {
        postsMap: new Map(nextEntries)
      };
    }),
}));

