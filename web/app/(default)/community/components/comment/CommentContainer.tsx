"use client";

import CommentItem from "./CommentItem";
import CommunityComment from "./CommentForm";
import { Reply } from "../../types/post";
import { useCommentStore } from "@/stores/useCommentStore";
import { useEffect, useState } from "react";

interface Props {
    postId: number;
    comments: Reply[];
}

export default function CommentContainer ({ postId, comments }: Props) {

    const setComments = useCommentStore((state) => state.setComments);
    const currentComments = useCommentStore((state) => state.commentsMap.get(postId)) || [];

    const [openCommentId, setOpenCommentId] = useState<number | null>(null);


    useEffect(() => {
        setComments(postId,comments);
    }, [])
    return (
        <>
            <ul className=" border-b border-gray-200 pb-3">
                {currentComments.map((comment, index) => <CommentItem 
                                                            key={index} 
                                                            comment={comment}
                                                            openCommentId={openCommentId}
                                                            setOpenCommentId={setOpenCommentId}
                                                            />
                )}
            </ul>
            <div className="relative mt-8">
                <CommunityComment postId={postId} />
            </div>
        </>
    )
}