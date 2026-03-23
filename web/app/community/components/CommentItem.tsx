import UserAvatar from "@/components/user/UserAvatar";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { VscHeart } from "react-icons/vsc";

interface Props {
    profileImg ?:string;
    nickname :string;
    createAt :string;
    content :string;
    heart ?:number;
    comment ?:number;
};

export default function CommentItem({profileImg, nickname, createAt, content, heart = 0, comment = 0 }: Props) {

    return(
        <li className="flex gap-3">
            <UserAvatar profileImg={profileImg} />
            <div>
                <div className="flex gap-2 items-center">
                    <p className="font-bold">{nickname}</p>
                    <p className="text-gray-400 text-sm">{createAt}</p>
                </div>                
                <p className="pt-1">{content}</p>
                <ul className="flex gap-4 mt-4 text-gray-400 text-sm">
                    <li className="flex items-center gap-1"><VscHeart className="text-xl" strokeWidth={0.3} /> {heart}</li>                
                    <li className="flex items-center gap-1"><HiOutlineChatBubbleOvalLeft className="text-xl" strokeWidth={2} /> {comment}</li>             
                </ul>  
            </div>
        </li>
    )
}