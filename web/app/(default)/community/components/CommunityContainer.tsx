"use client";

import CommunityNewPostsBanner from "./CommunityNewPostsBanner";
import CommunityList from "./CommunityList";
import { Post } from "../types/post";
import {
  COMMUNITY_UX_POST_CREATED_EVENT,
  isPostCreatedUxEvent,
  subscribeCommunityFeed,
} from "@/lib/api/community-ux";
import { getPosts } from "@/lib/api/post";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostStore } from "@/stores/usePostStore";
import { useToast } from "@/components/ui/FeedbackProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

interface Props {
  initialPosts: Post[];
  cursorId: number | null;
  hasNext: boolean;
}

const COMMUNITY_REFRESH_PAGE_SIZE = 10;

export default function CommunityContainer({ initialPosts, cursorId, hasNext }: Props) {
  // postsMap의 entries를 shallow 비교로 구독
  const postsMap = usePostStore(useShallow((state) => state.postsMap));
  const posts = useMemo(() => Array.from(postsMap.values()), [postsMap]);
  const setPosts = usePostStore((state) => state.setPosts);
  const replacePosts = usePostStore((state) => state.replacePosts);
  const setCursorId = usePostStore((state) => state.setCursorId);
  const setHasMore = usePostStore((state) => state.setHasMore);
  const currentUserId = useAuthStore((state) => state.user?.memberId ?? null);
  const toast = useToast();
  const currentUserIdRef = useRef<number | null>(currentUserId);
  const isCheckingLatestPostsRef = useRef(false);
  const pendingPostIdsRef = useRef<Set<number>>(new Set());
  const hasUnknownNewPostsRef = useRef(false);
  const [pendingPostIds, setPendingPostIds] = useState<Set<number>>(new Set());
  const [hasUnknownNewPosts, setHasUnknownNewPosts] = useState(false);
  const [isRefreshingNewPosts, setIsRefreshingNewPosts] = useState(false);
  const pendingNewPostCount = pendingPostIds.size;
  const showNewPostsBanner = hasUnknownNewPosts || pendingNewPostCount > 0;
  const visibleNewPostCount = hasUnknownNewPosts ? undefined : pendingNewPostCount;

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    pendingPostIdsRef.current = pendingPostIds;
  }, [pendingPostIds]);

  useEffect(() => {
    hasUnknownNewPostsRef.current = hasUnknownNewPosts;
  }, [hasUnknownNewPosts]);

  useEffect(() => {
    setPosts(initialPosts);
    setCursorId(cursorId);
    setHasMore(hasNext);
  }, [cursorId, hasNext, initialPosts, setCursorId, setHasMore, setPosts]);

  const checkLatestPosts = useCallback(async () => {
    if (
      isCheckingLatestPostsRef.current ||
      pendingPostIdsRef.current.size > 0 ||
      hasUnknownNewPostsRef.current
    ) {
      return;
    }

    const currentFirstPostId =
      Array.from(usePostStore.getState().postsMap.keys())[0] ?? null;

    try {
      isCheckingLatestPostsRef.current = true;

      const result = await getPosts({ size: COMMUNITY_REFRESH_PAGE_SIZE });
      const hasNewerPost =
        currentFirstPostId === null
          ? result.content.length > 0
          : result.content.some((post) => post.id > currentFirstPostId);

      if (hasNewerPost) {
        setHasUnknownNewPosts(true);
      }
    } catch (error) {
      console.error("최신 커뮤니티 게시글 확인에 실패했습니다.", error);
    } finally {
      isCheckingLatestPostsRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkLatestPosts();
  }, [checkLatestPosts]);

  useEffect(() => {
    const handlePageShow = () => {
      checkLatestPosts();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkLatestPosts();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkLatestPosts]);

  useEffect(() => {
    const eventSource = subscribeCommunityFeed();

    const handlePostCreated = (event: Event) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        return;
      }

      try {
        const payload = JSON.parse(event.data) as unknown;

        if (!isPostCreatedUxEvent(payload)) {
          return;
        }

        if (
          currentUserIdRef.current !== null &&
          payload.authorMemberId === currentUserIdRef.current
        ) {
          return;
        }

        if (usePostStore.getState().postsMap.has(payload.postId)) {
          return;
        }

        setPendingPostIds((prev) => {
          if (prev.has(payload.postId)) {
            return prev;
          }

          const next = new Set(prev);
          next.add(payload.postId);
          return next;
        });
      } catch (error) {
        console.error("커뮤니티 새 게시글 SSE 데이터 파싱 실패", error);
      }
    };

    eventSource.addEventListener(
      COMMUNITY_UX_POST_CREATED_EVENT,
      handlePostCreated
    );

    eventSource.onerror = (error) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error("커뮤니티 UX SSE 연결이 종료되었습니다.", error);
      }
    };

    return () => {
      eventSource.removeEventListener(
        COMMUNITY_UX_POST_CREATED_EVENT,
        handlePostCreated
      );
      eventSource.close();
    };
  }, []);

  const handleRefreshNewPosts = useCallback(async () => {
    if (isRefreshingNewPosts) {
      return;
    }

    try {
      setIsRefreshingNewPosts(true);
      const pendingPostIdsBeforeRefresh = new Set(pendingPostIds);

      const result = await getPosts({ size: COMMUNITY_REFRESH_PAGE_SIZE });
      const fetchedPostIds = new Set(result.content.map((post) => post.id));

      replacePosts(result.content);
      setCursorId(result.nextCursorId ?? null);
      setHasMore(result.hasNext);
      setHasUnknownNewPosts(false);
      setPendingPostIds((prev) => {
        const next = new Set(prev);

        pendingPostIdsBeforeRefresh.forEach((postId) => next.delete(postId));
        fetchedPostIds.forEach((postId) => next.delete(postId));

        return next;
      });

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (error) {
      console.error("새 커뮤니티 게시글 목록을 불러오지 못했습니다.", error);
      toast({
        title: "새 게시글을 불러오지 못했습니다.",
        description: "잠시 후 다시 시도해 주세요.",
        tone: "error",
      });
    } finally {
      setIsRefreshingNewPosts(false);
    }
  }, [
    isRefreshingNewPosts,
    pendingPostIds,
    replacePosts,
    setCursorId,
    setHasMore,
    toast,
  ]);

  // fallback
  const displayPosts = posts.length ? posts : initialPosts;

  return (
    <>
      <CommunityNewPostsBanner
        count={visibleNewPostCount}
        open={showNewPostsBanner}
        isRefreshing={isRefreshingNewPosts}
        onClick={handleRefreshNewPosts}
      />
      <CommunityList posts={displayPosts} />
    </>
  );
}
