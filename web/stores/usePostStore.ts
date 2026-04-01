import { create } from "zustand";
import { Post } from "@/app/(default)/community/types/post";

interface PostsState {
  postsMap: Map<number, Post>;

  posts: Post[];

  // 첫 화면에서 보여줄 배열
  setPosts: (newPosts: Post[]) => void;

  // 게시글 하나 가져오기
  getPost: (arg0: number) => void;

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

    posts: [],

    setPosts: (posts: Post[]) => set({
        postsMap: new Map(posts.map((p) => [p.id, p])),
        posts
    }),

    getPost: (postId: number) => get().postsMap.get(postId),

    getPostsArray: () => Array.from(get().postsMap.values()),


    // 글 생성 시 state 업데이트
    addPost: (post: Post) =>
        set((state) => {
        const newMap = new Map([[post.id, post], ...state.postsMap.entries()]);
        return {
                postsMap: newMap,
                posts: [post, ...state.posts],
            };
    }),

    // 무한 스크롤 시 현재 state 배열에 추가
    appendPosts: (newPosts: Post[]) =>
        set((state) => {
            const newMap = new Map(state.postsMap);
            newPosts.forEach((post) => newMap.set(post.id, post)); // 뒤에 추가
            return {
                postsMap: newMap,
                posts: [...state.posts, ...newPosts],
            };
    }),

  removePost: (postId: number) =>
    set((state) => {
        const newMap = new Map(state.postsMap);
        newMap.delete(postId);
        return {
            postsMap: newMap,
            posts: state.posts.filter((p) => p.id !== postId),
        };
    }),

    // 업데이트
  replacePost: (replacePost: Post) =>
    set((state) => {
      const newMap = new Map(state.postsMap);
      newMap.set(replacePost.id, replacePost);

      return {
        postsMap: newMap,
        posts: state.posts.map((p) =>
          p.id === replacePost.id ? replacePost : p
        ),
      };
    }),
}));

