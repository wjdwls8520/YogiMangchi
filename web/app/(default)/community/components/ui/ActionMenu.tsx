import { cn } from "@/lib/utils/cs";
import { Flag, PencilLine, Trash2 } from "lucide-react";


type Props = {
  isOwner: boolean;
  reportedByMe: boolean;
  onEdit: (e: React.MouseEvent) => Promise<void>;
  onDelete: (e: React.MouseEvent) => void;
  onReport: (e: React.MouseEvent) => Promise<void>;
};

export default function ActionMenu({ isOwner, reportedByMe, onEdit, onDelete, onReport }: Props) {


    return (
            <div className="absolute right-0 z-10 w-24 bg-white dark:bg-zinc-900 border border-gray-300 rounded-xl p-3 text-sm">
                
            { 
                isOwner && 
                <>
                <button 
                    type="button" 
                    onClick={onEdit} 
                    className="flex items-center gap-1 text-left py-1 w-full"
                >
                    <PencilLine strokeWidth={2} size={16} className="text-gray-500" />
                    수정
                </button>
                <button 
                    type="button" 
                    onClick={onDelete} 
                    className="flex items-center gap-1 text-left py-1 w-full"
                >
                    <Trash2 strokeWidth={2} size={16} className="text-gray-500" />
                    삭제
                </button>
                </>
            }
                <button 
                    type="button" 
                    onClick={onReport} 
                    className={cn("flex items-center gap-1 text-left py-1 w-full", reportedByMe && "text-red-700")}
                >
                    <Flag strokeWidth={2} size={16} className="text-gray-500" />
                    신고
                </button>
            </div>        
    )
}