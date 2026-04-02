
import UserAvatar from "@/components/user/UserAvatar";
import { cn } from "@/lib/utils/cs";
import { formatTime } from "@/lib/utils/date";
import { Reply } from "../../types/post";
import { deleteReply, getReplys, putReplyLike } from "@/lib/api/post";
import LikeButton from "../ui/LikeButton";
import { useState } from "react";
import CommentForm from "./CommentForm";
import { usePostStore } from "@/stores/usePostStore";
import { useCommentStore } from "@/stores/useCommentStore";
import BubbleButton from "../ui/BubbleButton";
import { X } from "lucide-react";


interface Props {
  comment: Reply;
  openCommentId: number | null;
  setOpenCommentId: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function CommentItem({ comment, openCommentId, setOpenCommentId }: Props) {

    const commentUpdate = useCommentStore((state) => state.updateComment);

    const [cursorId, setCursorid] = useState(undefined);

    const [recomments, setRecomments] = useState<Reply[]>([]);

    const handleLike = async () => {
        await putReplyLike(comment.postId, comment.id);
    }
    
    const handleDelete = async () => {
        const updated = {
            ...comment,
            deleteYn: "Y",
            nickname: "알 수 없음",
            content: "삭제된 댓글입니다.",
            updatedAt: new Date().toISOString(),
        };

        commentUpdate(comment.postId, updated);
        try {
            await deleteReply(comment.postId, comment.id);
        } catch(e) {
            console.log(e)
             commentUpdate(comment.postId, comment);
        }
    }

    const openComments = async () => {
        console.log(comment)
        if(comment.replyCount === 0) return;

        const result = await getReplys({postId: comment.postId, parentId: comment.id, cursorId});
        setRecomments(result.content);
    }

    const handleForm = (commentId: number) => {
        setOpenCommentId(prev => prev === commentId ? null : commentId);
    }

    const handleScroll = (commentId: string) => {
        console.log('scroll')
        document.getElementById(commentId)?.scrollIntoView({
            behavior: "smooth",
        });
    };


    return(
        <>
            <li 
            id={`${comment.parentReplyId || comment.id}-${comment.id || comment.memberId}`}
            className={
                    cn(`flex gap-2 mt-3 pb-2 border-t border-gray-200 pt-5`, 
                        comment.parentReplyId && 'border-t-0 border-l-3 pt-3 pl-6 ml-5 mb-6 border-gray-200')
            }>
                <UserAvatar 
                    profileImg={comment.profileImgUrl} 
                    classes={`${ comment.targetMemberId ? 'w-[36px] h-[36px]' : 'w-[30px] h-[30px]' }`} 
                />

                <div className="flex-1">
                    <div className="flex gap-2 items-center">
                        <p className="font-bold">{comment.nickname}</p>
                        <p className="text-gray-400 text-sm">
                        {
                            comment.createdAt !== comment.updatedAt ? (
                                <>
                                {formatTime(comment.updatedAt)} <span> | 수정됨</span>
                                </>
                            ) : (
                                formatTime(comment.createdAt)
                            )
                        }
                        </p>
                        {
                            comment.deleteYn !== 'Y' &&
                            <button type="button" className=" ml-auto" onClick={handleDelete}>
                                <X strokeWidth={1.5} size={19} className="text-gray-400" />
                            </button>   
                        }
                    
                    </div>                
                    <pre className="pt-1">
                        {
                            comment.targetNickname && 
                            (<button type="button" className="text-blue-500 font-bold"
                                onClick={() =>
                                    handleScroll(
                                        `${comment.parentReplyId || comment.id}-${comment.id || comment.memberId}`
                                    )
                                }
                            >
                            {comment.targetNickname}
                            </button>)
                        }
                        {comment.content}
                    </pre>
                    <ul className="flex gap-4 mt-3 text-gray-400 text-sm">
                        <li>
                            <LikeButton 
                                likeCount={comment.likeCount} 
                                liked={comment.likedByMe} 
                                onLike={comment.deleteYn === 'N' ? handleLike : undefined} 
                            />
                        </li>  
                        <li>
                            <BubbleButton openComments={openComments}>
                                {comment.replyCount}
                            </BubbleButton>                            
                        </li>                               
                        {comment.deleteYn !== 'Y' &&
                        <li>
                            <button type="button" className="font-semibold" onClick={() => handleForm(comment.id)}>답글 달기</button>
                        </li>
                        }       
                    </ul>  
                </div>

            </li>     

            { recomments.map((comment) => 
                <CommentItem key={comment.id} 
                comment={comment} 
                openCommentId={openCommentId} 
                setOpenCommentId={setOpenCommentId} 
                />) 
            }    

            {
                (openCommentId === comment.id) &&
                <div className="relative mt-3">
                    <CommentForm 
                        postId={comment.postId} 
                        parentId={comment.parentReplyId || comment.id} 
                        targetId={comment.id || comment.memberId}
                            />
                </div>
            }   
            
        </>
    )
}