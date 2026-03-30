import { getPost } from "@/lib/api/post";
import CommunityItem from "../../components/CommunityItem";

interface PageProps {
  params: {
    category: string;
    id: string;
  };
}


export default async function CategoryDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const postId = Number(resolvedParams.id);
    const post = await getPost(postId);

    return <CommunityItem post={post} variant="detail" />;
}