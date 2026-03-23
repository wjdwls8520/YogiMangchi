import { Post } from "../types/post";
import CommunityItem from "./communityItem";

interface Props {
  posts: Post[];
}

export default function CommunityList({ posts } :Props) {

    return(
        <article className="contents">
            <ul className="flex flex-col gap-5">
                {posts.map((post) => <CommunityItem key={post.id} post={post} />)}
            </ul>
        </article>
    )
}