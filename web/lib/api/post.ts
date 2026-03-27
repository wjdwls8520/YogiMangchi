// 게시글 관련 api

import { fetchClient } from "./client";


export const createPost = async (formData: FormData) => {
    await fetchClient('community/posts', {
        method: "POST",
        body: formData,
    });

}

export const getPosts = async ({ page, size }: { page?: number; size?: number } = {}) => {
    const params = new URLSearchParams();
    
    if (page !== undefined) params.append('page', String(page));
    if (size !== undefined) params.append('size', String(size));

    const query = params.toString();
    const result = await fetchClient(`community/posts${query ? `?${query}` : ''}`);

    return result;
}

export const deletePost = async (postId: number) => {
    await fetchClient(`community/posts/${postId}`, {
        method: "DELETE"
    });
}