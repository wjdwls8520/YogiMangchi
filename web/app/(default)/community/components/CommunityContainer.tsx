"use client";

import CommunityList from "./CommunityList";
import { Post } from "../types/post";
import { usePostStore } from "@/stores/usePostStore";
import { useEffect, useRef } from "react";

interface Props {
  initialPosts: Post[];
}

export default function CommunityContainer({ initialPosts }: Props) {
  const posts = usePostStore((state) => state.posts);
  const setPosts = usePostStore((state) => state.setPosts);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      setPosts(initialPosts);
      isInitialized.current = true;
    }
  }, []);

  // fallback
  const displayPosts = posts.length ? posts : initialPosts;

  return (
    <>
      <CommunityList posts={displayPosts} />
    </>
  );
}