"use client";

import Modal from "@/components/Modal";
import { getReportEnum, reportPost, reportReply } from "@/lib/api/post";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useModalStore } from "@/stores/useModalStore";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cs";
import { useCommentStore } from "@/stores/useCommentStore";
import { usePostStore } from "@/stores/usePostStore";


interface ReportEnum {
    code: string;
    label: string;
}

export default function ReportModal() {
    
    const { reportModal, closeReport } = useModalStore();
    const { toast } = useFeedback();
    const replacePost = usePostStore((state) => state.replacePost);
    const post = usePostStore((state) => state.postsMap.get(reportModal.targetId));
    const comments = useCommentStore((state) => state.commentsMap.get(reportModal.targetId));
    const replaceComment = useCommentStore((state) => state.replaceComment);

    const modalProps = {
        title: "신고하기",
        onClose: () => closeReport(),
        isSubmit: true,
    }

    const [reportEnum, setReportEnum] = useState<ReportEnum[]>([]);
    const [reasonType, setReasonType] = useState("ETC");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let result;

        if(reportModal.replyId) { // 댓글 신고일 때
            result = await reportReply({postId: reportModal.targetId, replyId: reportModal.replyId, reasonType});
        } else { // 글 신고일 때
            result = await reportPost(reportModal.targetId, reasonType);
        }

        if (reportModal.replyId) {
            const targetReply =
                comments?.find((comment) => comment.id === reportModal.replyId) ?? null;

            if (targetReply) {
                replaceComment(reportModal.targetId, {
                    ...targetReply,
                    reportCount: result.reportCount,
                    reportedByMe: result.reportedByMe,
                });
            }
        } else if (post) {
            replacePost({
                ...post,
                reportCount: result.reportCount,
                reportedByMe: result.reportedByMe,
            });
        }

        toast({
            title: "신고가 접수되었습니다.",
            tone: "success",
        });
        closeReport();

    }
    
    useEffect(() => {
        if (!reportModal.isOpen || reportEnum.length > 0) {
            return;
        }

        (async () => {
            try {
                const result = await getReportEnum();
                setReportEnum(result);
            } catch {
                closeReport();
            }
        })();
    }, [closeReport, reportEnum.length, reportModal.isOpen]);

    if (!reportModal.isOpen) return null;

    return <form onSubmit={handleSubmit}>
    
        <Modal props={modalProps}>
            <div className="px-1 py-2">
                {/* 헤더 섹션 */}
                <div className="mb-6">
                <div className="flex items-center gap-2 text-rose-500 mb-2">
                    <AlertCircle size={20} />
                    <h3 className="text-xl font-bold text-gray-900">신고 사유 선택</h3>
                </div>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                    신고하신 내용은 <span className="font-semibold text-gray-700">요기망치</span>팀에서 꼼꼼하게 검토 후 <br />
                    운영 정책에 따라 신속하게 조치하겠습니다.
                </p>
                </div>

                {/* 신고 리스트 섹션 */}
                <ul className="flex flex-col gap-2">
                {reportEnum?.map((el) => {
                    const isSelected = reasonType === el.code;
                    
                    return (
                    <li key={el.code}>
                        <label
                        htmlFor={el.code}
                        className={cn(
                            "flex items-center justify-between rounded-xl border px-4 py-4 transition-all duration-200",
                            isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-100 bg-gray-50/50 text-gray-600 hover:bg-gray-100 hover:border-gray-200"
                        )}
                        >
                        <span className={cn(
                            "text-[15px] font-medium transition-colors",
                            isSelected ? "text-blue-700" : "text-gray-700"
                        )}>
                            {el.label}
                        </span>

                        <input
                        type="radio"
                        name="report"
                        id={el.code}
                        value={el.code}
                        checked={isSelected}
                        onChange={(e) => setReasonType(e.currentTarget.value)}
                        />
                        </label>
                    </li>
                    );
                })}
                </ul>
                
                {/* 안내문구 */}
                <p className="mt-4 text-[12px] text-gray-400 text-center">
                허위 신고일 경우 서비스 이용에 제한을 받을 수 있습니다.
                </p>
            </div>
        </Modal>
    </form>

}
