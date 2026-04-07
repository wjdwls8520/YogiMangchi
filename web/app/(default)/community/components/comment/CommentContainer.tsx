"use client";

import CommentItem from "./CommentItem";
import { Post, Reply } from "../../types/post";
import { useCommentStore } from "@/stores/useCommentStore";
import { useEffect, useState } from "react";
import CommentForm from "./CommentForm";
import { usePostStore } from "@/stores/usePostStore";
import { getReplys } from "@/lib/api/post";

interface Props {
    post: Post;
    comments: Reply[];
    nextCursorId?: number;
}

export default function CommentContainer ({ post, comments, nextCursorId }: Props) {

    const setComments = useCommentStore((state) => state.setComments); // comments 전역 state에 저장
    const addComments = useCommentStore((state) => state.addComments); // 댓글 더보기 시 state에 추가

    // 최신 comments, 댓글, 대댓글, 대대댓글
    const commentMap = useCommentStore(state => state.commentsMap);
    const currentComments = commentMap.get(post.id) || [];


    // 최신 댓글만
    const rootComments = currentComments.filter(
        (comment) => comment.parentReplyId === null
    );

    const { addPost, postsMap } = usePostStore();
    const currentPost = postsMap.get(post.id) || post;

    const [openCommentId, setOpenCommentId] = useState<number | null>(null);
    const [currentCursorId, setCurrentCursorId] = useState(nextCursorId);

    const moreReply = async() => {
        console.log(currentCursorId)
        const result = await getReplys({postId: post.id, cursorId: currentCursorId});
        setCurrentCursorId(result.nextCursorId);
        console.log(result.content)
        addComments(post.id, result.content);

    }

    useEffect(() => {
        addPost(post);
        setComments(post.id, comments);
    }, [])

    useEffect(() => {
        console.log(currentComments)
    }, [currentComments])

    return (
        <>
            <h3 className="mt-8 font-semibold text-lg">답글 {currentPost.replyCount}개</h3>
            <ul className=" border-b border-gray-200 pb-3">
                {rootComments.map((comment) => <CommentItem 
                                                            key={`${comment.postId}${comment.id}`}
                                                            post={currentPost}
                                                            rootComment={comment}
                                                            openCommentId={openCommentId}
                                                            setOpenCommentId={setOpenCommentId}
                                                            />
                )}
            </ul>
            {
                currentCursorId && 
                <button type="button" className="text-center p-3 w-full text-sm text-gray-400" onClick={moreReply}>답글 더보기 +</button>
            }
            <div className="relative mt-8">
                <CommentForm post={currentPost} />
            </div>
        </>
    )
}