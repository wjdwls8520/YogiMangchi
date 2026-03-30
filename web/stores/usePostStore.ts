import { Post } from "@/app/(default)/community/types/post";
import { create } from "zustand";

interface PostState {
  posts: Post[];

  setPosts: (posts: Post[]) => void;

  addPost: (post: Post) => void;

  appendPosts: (post: Post[]) => void;

  removePost: (postId: number) => void;

  updatePost: (updatedPost: Post) => void;
}

export const usePostStore = create<PostState>((set) => ({
    posts: [],

    // 초기 세팅
    setPosts: (posts) => set({ posts }),

    // 게시글 작성
    addPost: (post) =>
    set((state) => ({
        posts: [post, ...state.posts],
    })),

    // 무한 스크롤, 현재 리스트에서 다음 게시글 리스트 불러오기
    appendPosts: (newPosts) =>
        set((state) => ({
        posts: [...state.posts, ...newPosts],
    })),

    // 게시글 삭제
    removePost: (postId) =>
    set((state) => ({
        posts: state.posts.filter((post) => post.id !== postId),
    })),

    // 게시글 업데이트
    updatePost: (updatedPost) =>
    set((state) => ({
        posts: state.posts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
        ),
    })),
}));