"use server";

import { serverFetchClient } from "./server";

/* 서버에서 전체 게시글 가져오기 */
export const getPostsServer = async () => {
    const result = await serverFetchClient("community/posts");

    return result;
};

/* 서버에서 게시글 하나 가져오기 */
export const getPostServer = async (postId: number) => {
    const result = await serverFetchClient(`community/posts/${postId}`);

    return result;
};

/* 게시글 댓글 불러오기 */
export const getReplysServer = async (postId: number) => {
    const result = await serverFetchClient(`community/posts/${postId}/replys`);
    
    return result;
}