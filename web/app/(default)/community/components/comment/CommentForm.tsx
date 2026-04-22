"use client";

import Button from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useWithAuth } from "@/hooks/useWithAuth";
import { FetchClientError } from "@/lib/api/client";
import { createReply, putReply } from "@/lib/api/post";
import { useCommentStore } from "@/stores/useCommentStore";
import { usePostStore } from "@/stores/usePostStore";
import { useEffect, useRef, useState } from "react";
import { Post, Reply } from "../../types/post";

interface Props {
  post: Post;
  currentComment?: Reply;
  isEdit?: boolean;
  setIsEdit?: (arg: boolean) => void;
  onSuccess?: () => void;
  autoFocus?: boolean;
}


export default function CommentForm({ post, currentComment, isEdit, setIsEdit, onSuccess, autoFocus = false }: Props) {
    const [text, setText] = useState(() => (isEdit ? (currentComment?.content ?? "") : ""));
    const withAuth = useWithAuth();
    const { alert } = useFeedback();
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    
    const { replaceComment, addComment, commentsMap } = useCommentStore();
    const { replacePost } = usePostStore();
    const currentPost = usePostStore((state) => state.postsMap.get(post.id) ?? post);
    const currentComments = commentsMap.get(post.id) ?? [];

    const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
        if (error instanceof FetchClientError) {
            return error.userMessage || fallbackMessage;
        }

        if (error instanceof Error && error.message) {
            return error.message;
        }

        return fallbackMessage;
    };

    useEffect(() => {
        if (!autoFocus) {
            return;
        }

        textareaRef.current?.focus();
    }, [autoFocus]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const content = text.trim();
        if (!content) {
            await alert("댓글 내용을 입력해 주세요.");
            return;
        }

        await withAuth(async () => {
            try {
                if(isEdit && currentComment) {
                    await updateComment(currentComment, content);
                } else {
                    await submitComment(content);
                }
            } catch (error) {
                await alert(
                    getApiErrorMessage(
                        error,
                        isEdit ? "댓글 수정에 실패했습니다." : "댓글 등록에 실패했습니다."
                    )
                );
            }
        })();
    };

    const updateComment = async (comment: Reply, content: string) => {
        const result = await putReply({
            postId: post.id,
            replyId: comment.id,
            content,
        });
        replaceComment(post.id, {
            ...comment,
            content: result,
            updatedAt: new Date().toISOString(),
        });
        setIsEdit?.(false);
        onSuccess?.();
    };

    const submitComment = async (content: string) => {
        let body;   
        let parentCommentId: number | null = null;

        if(currentComment?.parentReplyId) { // 대대댓글일 때
            body = {
                content,
                parentId: currentComment.parentReplyId,
                targetId: currentComment.id,
            };  
            parentCommentId = currentComment.parentReplyId;
        } else if(currentComment) { // 대댓글일 때
            body = {
                content,
                parentId: currentComment.id,
                targetId: null,
            };  
            parentCommentId = currentComment.id;
        } else { // 일반 댓글일 때
                body = {
                content,
                parentId: null,
                targetId: null,
            };          
        }
           
        const result = await createReply(post.id, body);
        addComment(post.id, result);

        if (parentCommentId != null) {
            const parentComment = currentComments.find((comment) => comment.id === parentCommentId);

            if (parentComment) {
                replaceComment(post.id, {
                    ...parentComment,
                    replyCount: parentComment.replyCount + 1,
                });
            }
        }

        replacePost({
            ...currentPost,
            replyCount: currentPost.replyCount + 1,
        });
        setText("");
        onSuccess?.();
    }

    const handleEditCancel = () => {
        setText(currentComment?.content ?? "");
        setIsEdit?.(false);
    }

    return <form onSubmit={handleSubmit} className="group">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 focus-within:border-brand-primary/40 focus-within:ring-1 focus-within:ring-brand-primary/40 dark:border-gray-700 dark:bg-gray-900">
            <textarea 
                ref={textareaRef}
                placeholder="댓글을 남겨보세요" 
                className="w-full resize-none border-none bg-transparent p-5 text-sm leading-relaxed placeholder:text-gray-400 focus:outline-none"
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
            >
            </textarea>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                {isEdit && (
                    <Button type="button" variant="gray" size="xs" onClick={handleEditCancel}>
                    취소
                    </Button>
                )}
                <Button type="submit" variant="sky" size="xs">
                    {isEdit ? "수정" : "등록"}
                </Button>
            </div>
        </div>  
    </form>
}
