"use client";


import { LuImagePlus } from "react-icons/lu";
import { IoCloseOutline } from "react-icons/io5";

import Modal from "@/components/Modal";
import UserAvatar from "@/components/user/UserAvatar";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createPost, getPosts } from "@/lib/api/post";
import { MemberInfo } from "@/types/member";
import { Post } from "../types/post";

interface ModalProps {
    setIsOpen: (arg0: boolean) => void;
    myInfo: MemberInfo | null;
    setAllPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

type UploadFile = {
  file: File;
  preview: string;
};


export default function WriteModal({setIsOpen, myInfo, setAllPosts}: ModalProps) {

    const modalProps = {
        title: "글쓰기",
        onClose: () => setIsOpen(false),
        isSubmit: true,
    }

    const [files, setFiles] = useState<UploadFile[]>([]);
    const [form, setForm] = useState({
        title: "",
        content: "",
    });


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


    const handleSubmit = async (e :React.SubmitEvent) => {

        e.preventDefault(); // 폼 보내고 새로고침 방지

        // 1. 임시 글 먼저 추가
        const tempPost: Post = {
            id: Date.now(),
            title: form.title,
            content: form.content,
            memberId: myInfo?.memberId ?? 0,
            likeCount: 0,
            replyCount: 0,
            reportCount: 0,
            nickname: myInfo?.nickname ?? "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            profileImg: '',
            files: files.map((file, index) => ({
                id: Date.now() + index,
                originalname: file.file.name,
                size: file.file.size,
                path: '',
                contentType: file.file.type,
                createdAt: '',
                postId: 0,
                previewUrl: URL.createObjectURL(file.file),
            }))
        };

        setAllPosts((prev) => [tempPost, ...prev]);
        setIsOpen(false); // 모달 먼저 닫기

        const formData = new FormData();

        formData.append('title', form.title);
        formData.append('content', form.content);
          files.forEach((file) => {
            formData.append("files", file.file);
        });

        await createPost(formData);
        const fresh = await getPosts({ page: 0 });
        setAllPosts(fresh.content);

    }


    return (
        <form name="" className="mt-2" onSubmit={handleSubmit}>
            <Modal props={modalProps}>
                <header className="flex align-middle gap-3 pb-3">
                    <UserAvatar classes="w-[34px] h-[34px]" profileImg={myInfo?.profileImgUrl} />
                    <div>
                        <div className="flex align-center w-full gap-2 font-bold whitespace-nowrap">{myInfo?.nickname}</div>
                    </div>
                </header>
                <div className="mt-2">
                    <div className="font-bold text-gray-900 pb-2">
                        <input 
                            type="text" 
                            name="title" 
                            placeholder="제목(선택)" 
                            className="w-full p-2" 
                            value={form?.title ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            } 
                        />
                    </div>
                    <textarea 
                        className="w-full resize-none p-2" 
                        rows={5} 
                        placeholder="새로운 소식이 있나요?" 
                        name="content"
                        value={form?.content ?? ""}
                        onChange={(e) =>
                            setForm({ ...form, content: e.target.value })
                        }
                    >
                    </textarea>
                    <input type="file" id="file" className="hidden" multiple onChange={handleChange} />
                    <label htmlFor="file" className="flex align-middle gap-1 text-gray-400 text-sm cursor-pointer"><LuImagePlus className="w-[25px] h-[25px]" /> 사진추가</label>
                    {
                        files?.length > 0 &&
                        <ul className="flex gap-2 mt-3">
                            {files.map((file, index) => <li key={file.preview} className="relative w-[60px] h-[60px] border border-gray-300 rounded-lg overflow-hidden">
                                    <Image src={file.preview} alt="첨부파일" fill className="object-cover object-center" />
                                    <button type="button" onClick={() => handleDelete(index)} className="absolute right-0 top-0 p-1">
                                        <IoCloseOutline className="w-[19px] h-[19px] text-gray-400" />
                                    </button>
                                </li>)}
                        </ul>
                    }                
                </div>
            </Modal>
        </form>
    )
}