import SubMenu from "@/components/SubMenu";
import NewsList from "./components/NewsList";
import CommunityContainer from "../components/CommunityContainer";
import { getPostsServer } from "@/lib/api/post.server";

const menus  = [
    { id: "best", label: "주간 인기글" },
    { id: "latest", label: "최신글" },
];

export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {

    const { category } = await params;
    const isNews = category === "news";

    const posts = await getPostsServer();

    return (
        <>
            {!isNews && <SubMenu menus={menus} />}
            {!isNews ? <CommunityContainer initialPosts={posts} /> : <NewsList />}
        </>
    )
}