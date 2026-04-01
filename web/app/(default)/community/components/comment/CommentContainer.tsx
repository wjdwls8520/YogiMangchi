import { useCommentStore } from "@/stores/useCommentStore"
import CommentItem from "./CommentItem";
import CommunityComment from "./CommentForm";

interface Props {
    postId: number;
}

export default function CommentContainer ({postId}: Props) {
    // const comments = useCommentStore(
    //     (state) => state.commentsMap.get(postId) || []
    // );
    // console.log(comments)

    return (
        <>
            <ul className=" border-b border-gray-200 pb-3">
                {/* {replys.map((reply, index) => <CommentItem key={index} comment={reply} />)} */}
            </ul>
            <div className="relative mt-8">
                <CommunityComment postId={postId} />
            </div>
        </>
    )
}