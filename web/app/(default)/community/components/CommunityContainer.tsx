"use client";

import CommunityList from "./CommunityList";
import { Post } from "../types/post";
import { usePostStore } from "@/stores/usePostStore";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";

interface Props {
  initialPosts: Post[];
  cursorId: number | null;
  hasNext: boolean;
}

export default function CommunityContainer({ initialPosts, cursorId, hasNext }: Props) {
  // postsMap의 entries를 shallow 비교로 구독
  const postsMap = usePostStore(useShallow((state) => state.postsMap));
  const posts = useMemo(() => Array.from(postsMap.values()), [postsMap]);
  const setPosts = usePostStore((state) => state.setPosts);
  const setCursorId = usePostStore((state) => state.setCursorId);
  const setHasMore = usePostStore((state) => state.setHasMore);

  useEffect(() => {
    setPosts(initialPosts);
    setCursorId(cursorId);
    setHasMore(hasNext);
  }, [cursorId, hasNext, initialPosts, setCursorId, setHasMore, setPosts]);

  // fallback
  const displayPosts = posts.length ? posts : initialPosts;

  return (
    <>
      <CommunityList posts={displayPosts} />
    </>
  );
}
