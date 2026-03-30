"use client";

import Link from "next/link";
import CommunityItem from "./CommunityItem";
import { useParams } from "next/navigation";
import { getPosts } from "@/lib/api/post";
import { useEffect, useRef, useState } from "react";
import CommunityItemSkeleton from "./CommunityItemSkeleton";
import { usePostStore } from "@/stores/usePostStore";

export default function CommunityList() {

    const { getPostsArray, appendPosts } = usePostStore();

    const params = useParams();
    const category = params.category;

    const [page, setPage] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<HTMLDivElement | null>(null); // 스크롤 위치 확인

    // 무한 스크롤, 이전 게시글 불러오기
    // page를 인자로 받아 클로저 문제 해결
    const fetchPosts = async (currentPage: number) => {
        if (!hasMore || isLoading) return;

        try {
            setIsLoading(true);

            const result = await getPosts({ page: currentPage });

            appendPosts(result.content); // 이전 게시글 state에 저장
            setHasMore(!result.last);

        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
            setPage(prev => prev + 1);
        }
        });

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore]);    

    useEffect(() => {
        if (page === 0) return;
        fetchPosts(page);
    }, [page])

    return(
        <article className="contents">
            <ul className="flex flex-col gap-5">
                {getPostsArray().map((post) => <Link href={`/community/${category}/${post.id}`} key={post.id}>
                        <li><CommunityItem post={post} variant="list" /></li>
                    </Link>
                )}
                <div ref={observerRef} />
                {isLoading && <CommunityItemSkeleton />}
            </ul>
        </article>
    )
}