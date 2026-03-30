import { create } from "zustand";
import { Post } from "@/app/(default)/community/types/post";

interface PostsState {
  postsMap: Map<number, Post>;

  // 첫 화면에서 보여줄 배열
  setPosts: (newPosts: Post[]) => void;

  // 전체 배열로 변환해서 화면에 뿌리기
  getPostsArray: () => Post[];

  // 게시글 작성 (맨 앞에 추가)
  addPost: (post: Post) => void;

  // 무한 스크롤, 리스트 뒤에 추가
  appendPosts: (newPosts: Post[]) => void;

  // 게시글 삭제
  removePost: (postId: number) => void;

  // 게시글 업데이트
  replacePost: (replacePost: Post) => void;
}

export const usePostStore = create<PostsState>((set, get) => ({
    postsMap: new Map(),

    getPostsArray: () => Array.from(get().postsMap.values()),

    setPosts: (posts: Post[]) => set({
        postsMap: new Map(posts.map((p) => [p.id, p])),
    }),

    addPost: (post: Post) =>
        set((state) => {
        const newMap = new Map([[post.id, post], ...state.postsMap.entries()]);
        return { postsMap: newMap };
    }),

  appendPosts: (newPosts: Post[]) =>
        set((state) => {
            const newMap = new Map(state.postsMap);
            newPosts.forEach((post) => newMap.set(post.id, post)); // 뒤에 추가
            return { postsMap: newMap };
    }),

  removePost: (postId: number) =>
        set((state) => {
            const newMap = new Map(state.postsMap);
            newMap.delete(postId);
            return { postsMap: newMap };
    }),

  replacePost: (replacePost: Post) =>
        set((state) => {
            const newMap = new Map(state.postsMap);
            console.log(replacePost.id)
            newMap.set(replacePost.id, replacePost);
            return { postsMap: newMap };
    }),
}));