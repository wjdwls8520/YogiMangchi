"use client";


import { LuImagePlus } from "react-icons/lu";
import { IoCloseOutline } from "react-icons/io5";

import Modal from "@/components/Modal";
import UserAvatar from "@/components/user/UserAvatar";
import Select from "@/components/ui/Select";
import { useEffect, useState } from "react";
import Image from "next/image";


interface ModalProps {
    setIsOpen: (arg0: boolean) => void;
}

type UploadFile = {
  file: File;
  preview: string;
};


export default function WriteModal({setIsOpen}: ModalProps) {

    const modalProps = {
        title: "글쓰기",
        onClose: () => setIsOpen(false),
    }

    const selectArr = [{label: "자유게시판", value: "free"}, {label: "분석공유", value: "analyze"}];

    const [files, setFiles] = useState<UploadFile[]>([]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = e.target.files;
        if (!newFiles) return;

        const mapped = Array.from(newFiles).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setFiles((prev) => [...prev, ...mapped]);

        e.target.value = ""; // 같은 파일 다시 선택 가능
    };

    const handleDelete = (index: number) => {
        setFiles((prev) => {
            const newArr = [...prev];
            URL.revokeObjectURL(newArr[index].preview);
            newArr.splice(index, 1);
            return newArr;
        });
    };


    // 메모리 누수 방지
    useEffect(() => {
    return () => {
        files.forEach((file) => URL.revokeObjectURL(file.preview));
    };
    }, [files]);


    return (
        <Modal props={modalProps}>
            <header className="flex align-middle gap-3 pb-3">
                <UserAvatar classes="w-[34px] h-[34px]" />
                <div>
                    <div className="flex align-center w-full gap-2 font-bold whitespace-nowrap">익명의 투자자 <Select options={ selectArr } variant="noStyle" /></div>
                </div>
            </header>
            <div className="mt-2">
                <div className="font-bold text-gray-900 pb-2"><input type="text" name="title" placeholder="제목(선택)" className="w-full p-2" /></div>
                <textarea className="w-full resize-none p-2" rows={5} placeholder="새로운 소식이 있나요?" name="content"></textarea>
                <input type="file" id="file" className="hidden" multiple onChange={handleChange} />
                <label htmlFor="file" className="flex align-middle gap-1 text-gray-400 text-sm cursor-pointer"><LuImagePlus className="w-[25px] h-[25px]" /> 사진추가</label>
                {
                    files?.length > 0 &&
                    <ul className="flex gap-2 mt-3">
                        {files.map((file, index) => <li key={file.preview} className="relative w-[60px] h-[60px] border border-gray-300 rounded-lg overflow-hidden">
                                <Image src={file.preview} alt="첨부파일" fill className="object-cover object-center" />
                                <button type="button" onClick={() => handleDelete(index)} className="absolute right-0 top-0 p-1">
                                    <IoCloseOutline className="w-[19px] h-[19px]" />
                                </button>
                            </li>)}
                    </ul>
                }                
            </div>
        </Modal>

    )
}