// 게시글 관련 api

import type { Post } from "@/app/(default)/community/types/post";
import { fetchClient } from "./client";

interface CursorResponse<T> {
    content: T[];
    nextCursorId: number | null;
    hasNext: boolean;
}

interface CreateReplyBody {
    content: string;
    parentId: number | null;
    targetId: number | null;
}

export interface ReportResponse {
    targetId: number;
    reportCount: number;
    reportedByMe: boolean;
}

export const createPost = async (formData: FormData) => {
    const result = await fetchClient('community/posts', {
        method: "POST",
        body: formData,
    });

    return result;
}

/* 전체 게시글 보기 */
export const getPosts = async ({ cursorId, size }: { cursorId?: number; size?: number } = {}) => {
    const params = new URLSearchParams();
    
    if (cursorId !== undefined) params.append('cursorId', String(cursorId));
    if (size !== undefined) params.append('size', String(size));

    const query = params.toString();
    const result = await fetchClient(`community/posts${query ? `?${query}` : ''}`);

    return result as CursorResponse<Post>;
}

/* 게시글 상세 */
export const getPost = async(postId: number) => {
    const result = await fetchClient(`community/posts/${postId}`);

    return result;
}

/* 게시글 수정 */
export const putPost = async ({ postId, formData }: { postId: number | undefined; formData: FormData;}) => {
    const result = await fetchClient(`community/posts/${postId}`, {
        method: "PUT",
        body: formData,
    });

    return result;
}

/* 게시글 좋아요 */
export const putLike = async ( postId: number ) => {
    const result = await fetchClient(`community/posts/${postId}/likes`, {
        method: "PUT"
    });

    return result;
}
/* 게시글 좋아요 취소 */
export const deleteLike = async ( postId: number ) => {
    const result = await fetchClient(`community/posts/${postId}/likes`, {
        method: "DELETE"
    });

    return result;
}

/* 게시글 삭제 */
export const deletePost = async (postId: number) => {
    await fetchClient(`community/posts/${postId}`, {
        method: "DELETE"
    });
}

/* 게시글 신고 */
export const reportPost = async (postId: number, reasonType: string): Promise<ReportResponse> => {
    const params = new URLSearchParams();
    
    if (reasonType !== undefined) params.append('reasonType', String(reasonType));

    const query = params.toString();
    const result = await fetchClient(`community/posts/${postId}/reports${query ? `?${query}` : ''}`, {
        method: "PUT"
    });

    return result as ReportResponse;
}

/* 게시글 신고 취소 */
export const unreportPost = async (postId: number): Promise<ReportResponse> => {
    const result = await fetchClient(`community/posts/${postId}/reports`, {
        method: "DELETE"
    });

    return result as ReportResponse;
}

/* 게시글 댓글 불러오기 */
export const getReplys = async ({
  postId,
  cursorId,
  parentId,
}: {
  postId: number;
  cursorId?: number;
  parentId?: number;
}) => {

    const params = new URLSearchParams();
    
    if (cursorId !== undefined) params.append('cursorId', String(cursorId));
    if (parentId !== undefined) params.append('parentId', String(parentId));

    const query = params.toString();

    const result = await fetchClient(`community/posts/${postId}/replys${query ? `?${query}` : ''}`);
    return result;
}

/* 댓글 등록 */
export const createReply = async (postId: number, body: CreateReplyBody) => {
    const result = await fetchClient(`community/posts/${postId}/replys`, {
        method: "POST",
        body: body,        
    });
    return result;
}

/* 댓글 수정 */
export const putReply = async ({postId, replyId, content}: {postId: number; replyId: number; content: string}) => {

    const params = new URLSearchParams();
    
    if (replyId !== undefined) params.append('replyId', String(replyId));
    if (content !== undefined) params.append('content', String(content));

    const query = params.toString();

    const result = await fetchClient(`community/posts/${postId}/replys${query ? `?${query}` : ''}`, {
        method: "PUT"
    });
    return result.content;
}

/* 댓글 좋아요 */
export const putReplyLike = async (postId: number, replyId: number) => {
    const result = await fetchClient(`community/posts/${postId}/replys/${replyId}/likes`, {
        method: "PUT",    
    });
    return result.content;
}

/* 댓글 좋아요 취소 */
export const deleteReplyLike = async ( postId: number, replyId: number ) => {
    const result = await fetchClient(`community/posts/${postId}/replys/${replyId}/likes`, {
        method: "DELETE"
    });

    return result;
}


/* 댓글 삭제 */
export const deleteReply = async (postId: number, replyId: number) => {

    const params = new URLSearchParams();
    
    if (replyId !== undefined) params.append('replyId', String(replyId));

    const query = params.toString();

    await fetchClient(`community/posts/${postId}/replys${query ? `?${query}` : ''}`, {
        method: "DELETE"
    })
}

/* 댓글 신고 */
export const reportReply = async ({postId, replyId, reasonType}: {postId: number; replyId: number; reasonType: string;}): Promise<ReportResponse> => {

    const params = new URLSearchParams();
    
    if (reasonType !== undefined) params.append('reasonType', String(reasonType));

    const query = params.toString();

    const result = await fetchClient(`community/posts/${postId}/replys/${replyId}/reports${query ? `?${query}` : ''}`, {
        method: "PUT"
    });

    return result as ReportResponse;
}

/* 댓글 신고 취소 */
export const unreportReply = async ({postId, replyId}: {postId: number; replyId: number;}): Promise<ReportResponse> => {
    const result = await fetchClient(`community/posts/${postId}/replys/${replyId}/reports`, {
        method: "DELETE"
    });

    return result as ReportResponse;
}

/* 신고 enum 리스트 가져오기 */
export const getReportEnum = async () => {
    const result = await fetchClient(`report/type/community`);

    return result;
}
