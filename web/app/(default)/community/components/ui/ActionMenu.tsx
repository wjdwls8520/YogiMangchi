import { FaRegTrashAlt } from "react-icons/fa";
import { FiFlag } from "react-icons/fi";
import { LuPenLine } from "react-icons/lu";

type Props = {
  isOwner: boolean;
  onEdit: (e: React.MouseEvent) => Promise<void>;
  onDelete: (e: React.MouseEvent) => void;
  onReport: (e: React.MouseEvent) => Promise<void>;
};

export default function ActionMenu({ isOwner, onEdit, onDelete, onReport }: Props) {


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
                    <LuPenLine className="w-[18px] h-[16px] text-gray-500" />
                    수정
                </button>
                <button 
                    type="button" 
                    onClick={onDelete} 
                    className="flex items-center gap-1 text-left py-1 w-full"
                >
                    <FaRegTrashAlt className="w-[18px] h-[14px] text-gray-500" />
                    삭제
                </button>
                </>
            }
                <button 
                    type="button" 
                    onClick={onReport} 
                    className="flex items-center gap-1 text-left py-1 w-full"
                >
                    <FiFlag className="w-[18px] h-[15px] text-gray-500" />
                    신고
                </button>
            </div>        
    )
}