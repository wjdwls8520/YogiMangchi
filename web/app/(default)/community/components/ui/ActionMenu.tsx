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
    <div className="absolute right-0 top-full z-50 mt-2 w-32 origin-top-right overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-0.5">
        {isOwner && (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <PencilLine size={16} className="text-gray-400 group-hover:text-gray-600" />
              수정
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <Trash2 size={16} className="text-rose-400" />
              삭제
            </button>
          </>
        )}

        {!isOwner && (
          <button
            type="button"
            onClick={onReport}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800",
              reportedByMe 
                ? "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400" 
                : "text-gray-700 dark:text-zinc-300"
            )}
          >
            <Flag 
              size={16} 
              className={cn(reportedByMe ? "text-red-500" : "text-gray-400")} 
              fill={reportedByMe ? "currentColor" : "none"}
            />
            {reportedByMe ? "신고 취소" : "신고"}
          </button>
        )}
      </div>
    </div>
  );
}
