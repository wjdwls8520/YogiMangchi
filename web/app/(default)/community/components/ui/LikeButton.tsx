import { Heart } from "lucide-react";

interface Props {
  liked: boolean;
  likeCount: number;
  onLike?: (e: React.MouseEvent) => void;
}


export default function LikeButton({liked, likeCount, onLike}: Props) {

    return (
        <button type="button" className="flex items-center gap-1">
            {
                liked ? 
                <Heart className="fill-red-500 stroke-none" />
                : 
                <Heart strokeWidth={2} size={18} onClick={onLike} />
            }
            {likeCount}
        </button>

    )
}