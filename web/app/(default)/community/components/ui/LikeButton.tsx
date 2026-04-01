import { VscHeart, VscHeartFilled } from "react-icons/vsc";

interface Props {
  liked: boolean;
  likeCount: number;
  onLike: (e: React.MouseEvent) => void;
}


export default function LikeButton({liked, likeCount, onLike}: Props) {

    return (
        <button type="button" className="flex items-center gap-1">
            {
                liked ? 
                <VscHeartFilled className="text-xl text-red-600" onClick={onLike} />
                : 
                <VscHeart className="text-xl" strokeWidth={0.3} onClick={onLike} />
            }
            {likeCount}
        </button>

    )
}