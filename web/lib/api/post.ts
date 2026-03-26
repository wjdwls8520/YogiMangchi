// 게시글 관련 api

import { fetchClient } from "./client";


export const createPost = (formData: FormData) => {
    fetchClient('community/posts', {
        method: "POST",
        body: formData,
    });

}

export const getPosts = async () => {
    const result = await fetchClient('community/posts');

    console.log(result.content)

    return result.content;
}