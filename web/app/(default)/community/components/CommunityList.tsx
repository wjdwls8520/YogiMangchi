"use client";

import CommunityItem from "./CommunityItem";
import { getPosts } from "@/lib/api/post";
import { useCallback, useEffect, useRef, useState } from "react";
import CommunityItemSkeleton from "./CommunityItemSkeleton";
import { usePostStore } from "@/stores/usePostStore";
import { Post } from "../types/post";


interface Props {
  posts: Post[];
}

export default function CommunityList({ posts }: Props) {

    const { appendPosts } = usePostStore();

    const [isLoading, setIsLoading] = useState(false);
    const observerRef = useRef<HTMLDivElement | null>(null); // 스크롤 위치 확인

    const [openActionMenu, setActionMenu] = useState<number | null>(null); // 액션 메뉴 열려있는지 확인

    const hasMore = usePostStore((state) => state.hasMore);
    const setHasMore = usePostStore((state) => state.setHasMore);
    const cursorId = usePostStore((state) => state.cursorId);
    const setCursorId = usePostStore((state) => state.setCursorId);

    // 무한 스크롤, 이전 게시글 불러오기
    const fetchPosts = useCallback(async () => {
        if (!hasMore || isLoading || !cursorId) return;

        try {
            setIsLoading(true);

            const result = await getPosts({ cursorId });

            appendPosts(result.content);
            setHasMore(result.hasNext);
            setCursorId(result.cursorId);

        } finally {
            setIsLoading(false);
        }
    }, [hasMore, isLoading, cursorId]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                fetchPosts();
            }
        });

        const current = observerRef.current;
        if (current) observer.observe(current);

        return () => {
            if (current) observer.unobserve(current);
        };
    }, [fetchPosts]);

    return(
        <article className="contents">
            <ul className="flex flex-col gap-5">
                {posts?.map((post) => 
                        <li key={`${post.memberId}${post.id}`}>
                            <CommunityItem 
                                post={post} 
                                variant="list" 
                                openActionMenu={openActionMenu} 
                                setActionMenu={setActionMenu} />
                        </li>
                )}
                <div ref={observerRef} />
                {isLoading && <CommunityItemSkeleton />}
            </ul>
        </article>
    )
}