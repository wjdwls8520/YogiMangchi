import { cn } from "@/lib/utils/cs";
import { Heart } from "lucide-react";

interface Props {
  liked: boolean;
  likeCount: number;
  onLike?: (e: React.MouseEvent) => void;
}


export default function LikeButton({liked, likeCount, onLike}: Props) {

    return (
        <button
            type="button"
            onClick={onLike}
            className="flex items-center gap-1"
        >
            <Heart 
                strokeWidth={2} 
                size={liked ? 19 : 18} 
                className={cn("", liked && "fill-red-500 stroke-none")} 
            />
            {likeCount}
        </button>

    )
}
