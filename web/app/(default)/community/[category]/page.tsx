import SubMenu from "@/components/SubMenu";
import CommunityList from "../components/CommunityList";
import NewsList from "./components/NewsList";
import { getPosts } from "@/lib/api/post";

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

    const posts = await getPosts();

    return (
        <>
            {!isNews && <SubMenu menus={menus} />}
            {!isNews ? <CommunityList posts={posts} /> : <NewsList />}
        </>
    )
}