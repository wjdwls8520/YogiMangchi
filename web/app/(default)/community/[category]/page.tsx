import { notFound } from "next/navigation";
import CommunityContainer from "../components/CommunityContainer";
import CommunityTabs from "../components/CommunityTabs";
import { COMMUNITY_LIST_CATEGORIES } from "../constants";
import { getPostsServer } from "@/lib/api/post.server";

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const { category } = await params;

  if (!COMMUNITY_LIST_CATEGORIES.has(category)) {
    notFound();
  }

  const posts = await getPostsServer();

  return (
    <>
      <CommunityTabs activeTab={category} />
      <CommunityContainer
        initialPosts={posts.content}
        cursorId={posts.nextCursorId}
        hasNext={posts.hasNext}
      />
    </>
  );
}
