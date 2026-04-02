// 게시글 관련 api

import { fetchClient } from "./client";


interface CreateReplyBody {
    content: string;
    parentId: number | null;
    targetId: number | null;
}

export const createPost = async (formData: FormData) => {
    await fetchClient('community/posts', {
        method: "POST",
        body: formData,
    });

}

/* 전체 게시글 보기 */
export const getPosts = async ({ cursorId, size }: { cursorId?: number; size?: number } = {}) => {
    const params = new URLSearchParams();
    
    if (cursorId !== undefined) params.append('cursorId', String(cursorId));
    if (size !== undefined) params.append('size', String(size));

    const query = params.toString();
    const result = await fetchClient(`community/posts${query ? `?${query}` : ''}`);
    console.log(result);
    return result;
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
export const reportPost = async (postId: number, reasonType: string) => {
    const params = new URLSearchParams();
    
    if (reasonType !== undefined) params.append('reasonType', String(reasonType));

    const query = params.toString();
    const result = await fetchClient(`community/posts/${postId}/reports${query ? `?${query}` : ''}`, {
        method: "PUT"
    });

    return result;
}

/* 게시글 신고 취소 */
export const unreportPost = async (postId: number, reasonType: string) => {
    const params = new URLSearchParams();
    
    if (reasonType !== undefined) params.append('reasonType', String(reasonType));

    const query = params.toString();
    const result = await fetchClient(`community/posts/${postId}/reports${query ? `?${query}` : ''}`, {
        method: "DELETE"
    });

    return result;
}

/* 게시글 댓글 불러오기 */
export const getReplys = async (postId: number) => {
    const result = await fetchClient(`community/posts/${postId}/replys`);

    return result.content;
}

/* 댓글 등록 */
export const createReply = async (postId: number, body: CreateReplyBody) => {
    const result = await fetchClient(`community/posts/${postId}/replys`, {
        method: "POST",
        body: body,        
    });
    return result.content;
}

/* 댓글 수정 */
export const putReply = async (postId: number, body: CreateReplyBody) => {
    const result = await fetchClient(`community/posts/${postId}/replys`, {
        method: "PUT",
        body: body,        
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

/* 댓글 삭제 */
export const deleteReply = async (postId: number, replyId: number) => {

    const params = new URLSearchParams();
    
    if (replyId !== undefined) params.append('replyId', String(replyId));

    const query = params.toString();

    await fetchClient(`community/posts/${postId}/replys${query ? `?${query}` : ''}`, {
        method: "DELETE"
    })
}
