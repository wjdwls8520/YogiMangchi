"use client";

import Button from "@/components/ui/Button";
import { useWithAuth } from "@/hooks/useWithAuth";
import { createReply, putReply } from "@/lib/api/post";
import { useCommentStore } from "@/stores/useCommentStore";
import { usePostStore } from "@/stores/usePostStore";
import { useEffect, useState } from "react";
import { Post, Reply } from "../../types/post";

interface Props {
  post: Post;
  currentComment?: Reply;
  isEdit?: boolean;
  setIsEdit?: (arg: boolean) => void;
}


export default function CommentForm({ post, currentComment, isEdit, setIsEdit }: Props) {

    
    const [text, setText] = useState(() => {
        if (isEdit && currentComment?.content) {
            return currentComment.content;
        }
        return "";
    });
    const withAuth = useWithAuth();
    
    const { replaceComment, addComments } = useCommentStore();
    const { replacePost } = usePostStore();

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();

        withAuth(async () => {
            try {
                if(isEdit && currentComment) {
                    updateComment(currentComment);
                } else {
                    addComment();
                }
            } catch(e) {
                console.log(e)
            }
        })()
    };

    const updateComment = async (comment: Reply) => {
        const result = await putReply({
            postId: post.id,
            replyId: comment.id,
            content: text,
        });
        replaceComment(post.id, {
            ...comment,
            content: result,
            updatedAt: new Date().toISOString(),
        });
        setIsEdit?.(false);
    };

    const addComment = async () => {
        const body = {
            content: text,
            parentId: currentComment ? (currentComment.parentReplyId ?? currentComment.id) : null,
            targetId: currentComment ? currentComment.parentReplyId : null,
        };                    
        const result = await createReply(post.id, body);
        addComments(post.id, [result]);
        replacePost({
            ...post,
            replyCount: post.replyCount + 1,
        });
        setText("")
    }

    const handleEditCancel = () => {
        setIsEdit?.(false);
    }

    return <form name="" onSubmit={handleSubmit}>
        <textarea 
            name="" id="" 
            placeholder="댓글을 남겨보세요" 
            className="w-full resize-none border rounded-xl border-gray-200 p-4"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
        >
        </textarea>
        <div className="absolute right-5 bottom-5 flex gap-2">
        {isEdit && (
            <Button type="button" variant="gray" size="sm" onClick={handleEditCancel}>
            취소
            </Button>
        )}
        <Button type="submit" variant="sky" size="sm">
            등록
        </Button>
        </div>   
    </form>
}