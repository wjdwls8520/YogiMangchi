"use client";

import Link from "next/link";
import { Post } from "../types/post";
import CommunityItem from "./CommunityItem";
import { useParams } from "next/navigation";

interface Props {
  posts: Post[];
}

export default function CommunityList({ posts } :Props) {

    const params = useParams();
    const category = params.category;

    return(
        <article className="contents">
            <ul className="flex flex-col gap-5">
                {posts.map((post) => <Link href={`/community/${category}/${post.id}`} key={post.id}><li><CommunityItem post={post} variant="list" /></li></Link>)}
            </ul>
        </article>
    )
}