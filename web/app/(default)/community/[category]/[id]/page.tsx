import { getPostServer, getReplysServer } from "@/lib/api/post.server";
import CategoryDetailClient from "./CategoryDetailClient";

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

    return <>
      <CategoryDetailClient post={post} initialComments={comments.content} nextCursorId={comments.nextCursorId} />
    </>;
}