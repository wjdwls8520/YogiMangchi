"use client";

import Modal from "@/components/Modal";
import { getReportEnum, reportPost, reportReply } from "@/lib/api/post";
import { useModalStore } from "@/stores/useModalStore";
import { useEffect, useState } from "react";


interface ReportEnum {
    code: string;
    label: string;
}

export default function ReportModal() {
    
    const { reportModal, closeReport } = useModalStore();

    const modalProps = {
        title: "신고하기",
        onClose: () => closeReport(),
        isSubmit: true,
    }

    const [reportEnum, setReportEnum] = useState<ReportEnum[]>([]);
    const [reasonType, setReasonType] = useState("ETC");

    const handleSubmit = async () => {

        if(reportModal.replyId) { // 댓글 신고일 때
            await reportReply({postId: reportModal.targetId, replyId: reportModal.replyId, reasonType});
        } else { // 글 신고일 때
            await reportPost(reportModal.targetId, reasonType);
        }

    }
    
    const fetchReportEnum = async () => {
        const result = await getReportEnum();
        setReportEnum(result);
    }

    useEffect(() => {
        (async () => {
            const result = await getReportEnum();
            setReportEnum(result);
        })();
    }, []);

    if (!reportModal.isOpen) return null;

    return <form action="" onSubmit={handleSubmit}>
    
        <Modal props={modalProps}>
        
        <h3 className="font-semibold">신고 사유를 선택해주세요</h3>
        <p className="pt-1">신고 내용은 요기망치에서 검토 후 조치됩니다.</p>
            <ul className=" pt-4">
                {reportEnum?.map((el) => {
                return <li key={el.code} className="p-1">
                        <input
                            type="radio"
                            name="report"
                            id={el.code}
                            value={el.code}
                            checked={reasonType === el.code}
                            onChange={(e) => setReasonType(e.currentTarget.value)}
                        />
                        <label className="ml-1" htmlFor={el.code}>{el.label}</label>
                    </li>
                })}
            </ul>
        </Modal>
    </form>

}