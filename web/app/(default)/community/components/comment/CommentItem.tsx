import UserAvatar from "@/components/user/UserAvatar";
import { cn } from "@/lib/utils/cs";
import { formatTime } from "@/lib/utils/date";
import { Reply } from "../../types/post";
import { IoCloseOutline } from "react-icons/io5";
import { deleteReply, putReplyLike } from "@/lib/api/post";
import LikeButton from "../ui/LikeButton";
import { useState } from "react";

interface Props {
    comment: Reply;
    classes?: string;
    depth?: number;
}

export default function CommentItem({ comment, classes, depth = 0 }: Props) {

    const handleLike = async () => {
        await putReplyLike(comment.postId, comment.id);
    }
    
    const handleDelete = async () => {
        await deleteReply(comment.postId, comment.id);
    }

    return(
        <>
            <li className={cn(`flex gap-2 mt-3 pb-2 ${classes}`, (depth === 0 ) && 'gap-3 border-t border-gray-200 pt-5')}>
                <UserAvatar 
                    profileImg={comment.profileImgUrl} 
                    classes={`${ depth === 0 ? 'w-[36px] h-[36px]' : 'w-[30px] h-[30px]' }`} 
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
                                <IoCloseOutline className="w-[19px] h-[19px] text-gray-400" />
                            </button>   
                        }
                       
                    </div>                
                    <p className="pt-1"><button type="button" className="text-blue-500 font-bold">{comment?.target}</button> {comment.content}</p>
                    <ul className="flex gap-4 mt-3 text-gray-400 text-sm">
                        <li>
                            <LikeButton 
                                likeCount={comment.likeCount} 
                                liked={comment.likedByMe} 
                                onLike={comment.deleteYn === 'N' ? handleLike : undefined} 
                            />
                        </li>                
                        <button type="button" className="font-semibold">답글 달기</button>
                    </ul>  
                </div>
 
            </li>
            {/* {
            comment.targetMemberId &&
                replys.map((data) => <CommentItem 
                            key={data.id} 
                            comment={data} 
                            classes={'pl-3 ml-7'} 
                            depth={depth + 1} 
                        />)
            } */}
        </>
    )
}