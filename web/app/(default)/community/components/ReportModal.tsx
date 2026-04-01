"use client";

import Modal from "@/components/Modal";
import { reportPost } from "@/lib/api/post";
import { useModalStore } from "@/stores/useModalStore";
import { useState } from "react";


export default function ReportModal() {

    const reportArr = [
        {value: "SPAM", label: "광고/스팸"}, 
        {value: "ABUSE", label: "욕설 또는 비방"}, 
        {value: "SEXUAL", label: "음란성 콘텐츠"}, 
        {value: "FRAUD", label: "사기 의심"},
        {value: "ETC", label: "기타 사유"}    
    ];
    
    const { reportModal, closeReport } = useModalStore();

    const modalProps = {
        title: "신고하기",
        onClose: () => closeReport(),
        isSubmit: true,
    }

    const [reasonType, setReasonType] = useState("ETC");

    const handleSubmit = async () => {
        console.log('report');
        await reportPost(reportModal.targetId, reasonType);
    }


    if (!reportModal.isOpen) return null;

    return <form action="" onSubmit={handleSubmit}>
    
        <Modal props={modalProps}>
        
        <h3 className="font-semibold">신고 사유를 선택해주세요</h3>
        <p className="pt-1">신고 내용은 요기망치에서 검토 후 조치됩니다.</p>
            <ul className=" pt-4">
                {reportArr.map((el) => {
                return <li key={el.value} className="p-1">
                        <input
                            type="radio"
                            name="report"
                            id={el.value}
                            value={el.value}
                            checked={reasonType === el.value}
                            onChange={(e) => setReasonType(e.currentTarget.value)}
                        />
                        <label className="ml-1" htmlFor={el.value}>{el.label}</label>
                    </li>
                })}
            </ul>
        </Modal>
    </form>

}