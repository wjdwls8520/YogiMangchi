"use client";

import Button from "@/components/ui/Button";
import { createReply } from "@/lib/api/post";
import { useState } from "react";

interface Props {
  postId: number;
  parentId?: number | null;
  targetId?: number | null;
}


export default function CommentForm({ postId, parentId, targetId }: Props) {

    const [text, setText] = useState("");
    
    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        console.log(postId, parentId, targetId)
        const body = {
            content: text,
            parentId: parentId ?? null,
            targetId: targetId ?? null,
        };
        const result = await createReply(postId, body);
        const replys = result.content;
        console.log(replys);

    };

    return <form name="" onSubmit={handleSubmit}>
        <textarea 
            name="" id="" 
            placeholder="댓글을 남겨보세요" 
            className="w-full resize-none border rounded-xl border-gray-200 p-4"
            rows={4}
            onChange={(e) => setText(e.target.value)}
        >
        </textarea>
        <Button type="submit" className="absolute right-5 bottom-5" variant="sky" size="sm">등록</Button>    
    </form>
}