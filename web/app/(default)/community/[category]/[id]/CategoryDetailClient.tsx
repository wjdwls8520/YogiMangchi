"use client";

import CommentContainer from "../../components/comment/CommentContainer";
import CommunityItem from "../../components/CommunityItem";
import { Post, Reply } from "../../types/post";


interface Props {
  post: Post;
  initialComments: Reply[];
  nextCursorId: number;

}

export default function CategoryDetailClient({
  post,
  initialComments,
  nextCursorId,
}: Props) {


  return (
    <>
      <CommunityItem post={post} isDetail />
      <CommentContainer
        post={post}
        comments={initialComments}
        nextCursorId={nextCursorId}
      />
    </>
  );
}
