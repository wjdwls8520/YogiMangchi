import UserAvatar from "@/components/user/UserAvatar";
import { cn } from "@/utils/cs";
import { VscHeart } from "react-icons/vsc";

interface Comment {
    id :number;
    profileImg?: string;
    nickname: string;
    createAt: string;
    content: string;
    heart?: number;
    comment?: number;
    target?: string;
    replies?: Comment[];
};

interface Props {
    comment: Comment;
    classes?: string;
    depth?: number;
}

export default function CommentItem({ comment, classes, depth = 0 }: Props) {

    return(
        <>
            <li className={cn(`flex gap-2 mt-3 pb-2 ${classes}`, (depth === 0 ) && 'gap-3 border-t border-gray-200 pt-5')}>
                <div className=""></div>
                <UserAvatar 
                    profileImg={comment.profileImg} 
                    classes={`${ depth === 0 ? 'w-[36px] h-[36px]' : 'w-[30px] h-[30px]' }`} 
                />
                <div>
                    <div className="flex gap-2 items-center">
                        <p className="font-bold">{comment.nickname}</p>
                        <p className="text-gray-400 text-sm">{comment.createAt}</p>
                    </div>                
                    <p className="pt-1"><button type="button" className="text-blue-500 font-bold">{comment?.target}</button> {comment.content}</p>
                    <ul className="flex gap-4 mt-3 text-gray-400 text-sm">
                        <li><button type="button" className="flex items-center gap-1"><VscHeart className="text-xl" strokeWidth={0.3} /> {comment.heart}</button></li>                
                        <button type="button" className="font-semibold">답글 달기</button>
                    </ul>  
                </div>
            </li>
            {comment.replies?.map((data) => <CommentItem 
                                                key={data.id} 
                                                comment={data} 
                                                classes={'pl-3 ml-7'} 
                                                depth={depth + 1} 
                                            />)}
        </>
    )
}