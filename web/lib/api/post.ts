// 게시글 관련 api

import { fetchClient } from "./client";


export const createPost = async (formData: FormData) => {
    await fetchClient('community/posts', {
        method: "POST",
        body: formData,
    });

}

/* 전체 게시글 보기 */
export const getPosts = async ({ page, size }: { page?: number; size?: number } = {}) => {
    const params = new URLSearchParams();
    
    if (page !== undefined) params.append('page', String(page));
    if (size !== undefined) params.append('size', String(size));

    const query = params.toString();
    const result = await fetchClient(`community/posts${query ? `?${query}` : ''}`);

    return result;
}

/* 게시글 상세 */
export const getPost = async(postId: number) => {
    const result = await fetchClient(`community/posts/${postId}`);

    console.log("결과 : " + result)
    return result;
}

/* 게시글 수정 */
export const updatePost = async ({ postId, formData }: { postId: number | undefined; formData: FormData;}) => {
    await fetchClient(`community/posts/${postId}`, {
        method: "PUT",
        body: formData,
    });
}


export const deletePost = async (postId: number) => {
    await fetchClient(`community/posts/${postId}`, {
        method: "DELETE"
    });
}
