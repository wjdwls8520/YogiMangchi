"use client";

import CommentItem from "./CommentItem";
import CommunityComment from "./CommentForm";
import { Reply } from "../../types/post";
import { useCommentStore } from "@/stores/useCommentStore";
import { useEffect } from "react";

interface Props {
    postId: number;
    comments: Reply[];
}

export default function CommentContainer ({ postId, comments }: Props) {

    const setComments = useCommentStore((state) => state.setComments);
    const currentComments = useCommentStore((state) => state.commentsMap.get(postId)) || [];

    useEffect(() => {
        setComments(postId,comments);
    }, [])
    return (
        <>
            <ul className=" border-b border-gray-200 pb-3">
                {currentComments.map((comment, index) => <CommentItem key={index} comment={comment} />)}
            </ul>
            <div className="relative mt-8">
                <CommunityComment postId={postId} />
            </div>
        </>
    )
}