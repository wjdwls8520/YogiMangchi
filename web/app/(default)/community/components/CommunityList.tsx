"use client";

import CommunityItem from "./CommunityItem";
import { getPosts } from "@/lib/api/post";
import { useEffect, useRef, useState } from "react";
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

    const hasMore = usePostStore((state) => state.hasMore);
    const setHasMore = usePostStore((state) => state.setHasMore);
    const cursorId = usePostStore((state) => state.cursorId);
    const setCursorId = usePostStore((state) => state.setCursorId);

    // 무한 스크롤, 이전 게시글 불러오기
    // page를 인자로 받아 클로저 문제 해결
    const fetchPosts = async () => {
        if (!hasMore || isLoading) return;

        try {
            setIsLoading(true);

            const result = await getPosts({ cursorId });

            appendPosts(result.content); // 이전 게시글 state에 저장
            setHasMore(result.hasNext);
            setCursorId(result.cursorId);

        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
            fetchPosts();
        }
        });

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore]);    

    return(
        <article className="contents">
            <ul className="flex flex-col gap-5">
                {posts?.map((post) => 
                        <li key={`${post.memberId}${post.id}`}>
                            <CommunityItem post={post} variant="list" />
                        </li>
                )}
                <div ref={observerRef} />
                {isLoading && <CommunityItemSkeleton />}
            </ul>
        </article>
    )
}