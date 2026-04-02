import CommentContainer from "../../components/comment/CommentContainer";
import CommunityItem from "../../components/CommunityItem";
import { getPostServer, getReplysServer } from "@/lib/api/post.server";

interface PageProps {
  params: {
    category: string;
    id: string;
  };
}


export default async function CategoryDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const postId = Number(resolvedParams.id);
    const post = await getPostServer(postId);
    const comments = await getReplysServer(postId);

    console.log(comments)

    return <>
      <CommunityItem post={post} variant="detail" />
      <h3 className="mt-8 font-semibold text-lg">답글 {post.replyCount}개</h3>
      <CommentContainer postId={postId} comments={comments} />
    </>;
}