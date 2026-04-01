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
    const replys = await getReplysServer(postId);

    return <CommunityItem post={post} replys={replys} variant="detail" />;
}