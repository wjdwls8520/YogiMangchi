"use client";

import Link from "next/link";
import { Post } from "../types/post";
import CommunityItem from "./CommunityItem";
import { useParams } from "next/navigation";
import { getPosts } from "@/lib/api/post";
import { useEffect, useRef, useState } from "react";
import CommunityItemSkeleton from "./CommunityItemSkeleton";

type Props = {
  allPosts: Post[];
  setAllPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

export default function CommunityList({ allPosts, setAllPosts } :Props) {

    const params = useParams();
    const category = params.category;

    const [page, setPage] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<HTMLDivElement | null>(null); // 스크롤 위치 확인

    // page를 인자로 받아 클로저 문제 해결
    const fetchPosts = async (currentPage: number) => {
        if (!hasMore || isLoading) return;

        try {
            setIsLoading(true);

            const result = await getPosts({ page: currentPage });

            setAllPosts(prev => [...prev, ...result.content]);
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
                {allPosts.map((post) => <Link href={`/community/${category}/${post.id}`} key={post.id}>
                        <li><CommunityItem post={post} setAllPosts={setAllPosts} variant="list" /></li>
                    </Link>
                )}
                <div ref={observerRef} />
                {isLoading && <CommunityItemSkeleton />}
            </ul>
        </article>
    )
}