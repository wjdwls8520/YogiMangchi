"use client";

import Modal from "@/components/Modal";
import UserAvatar from "@/components/user/UserAvatar";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createPost, getPosts, putPost } from "@/lib/api/post";

import { File as ServerFile, Post } from "../types/post";
import { useAuthStore } from "@/stores/useAuthStore";
import { useModalStore } from "@/stores/useModalStore";
import { usePostStore } from "@/stores/usePostStore";
import { ImagePlus, X } from "lucide-react";


type UploadFile = {
  file: File;
  preview: string;
};


export default function WriteModal() {


    const userInfo = useAuthStore((state) => state.user);   
    const isOpen = useModalStore((state) => state.writeModal.isOpen);
    const mode = useModalStore((state) => state.writeModal.mode);
    const selectedPost = useModalStore((state) => state.writeModal.selectedPost);
    const close = useModalStore((state) => state.closeWrite);

    const { addPost, setPosts, replacePost } = usePostStore();

    const modalProps = {
        title: mode === "edit" ? "글 수정" : "글쓰기",
        onClose: () => close(),
        isSubmit: true,
    }

    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]); // 업로드 할 파일
    const [serverFiles, setServerFiles] = useState<ServerFile[]>(selectedPost?.files ?? []); // 서버에서 가져온 파일
    const [deleteFileIds, setDeleteFileIds] = useState<number[]>([]); // 서버에서 삭제할 파일

    const [form, setForm] = useState({
        title: mode === "edit" ? (selectedPost?.title ?? "") : "",
        content: mode === "edit" ? (selectedPost?.content ?? "") : "",
    });

    const handleCreate = async (tempPost: Post, formData: FormData) => {
        addPost(tempPost);
        // 모달 내용 초기화
        setForm({
            title: "",
            content: "",
        });
        setUploadFiles([]);

        await createPost(formData);
        
        const fresh = await getPosts();
        setPosts(fresh.content);        
    }

    const handleEdit = async (tempPost: Post, formData: FormData) => {
        deleteFileIds.forEach(id => {
            formData.append('deleteFileIds', id.toString());
        });

        replacePost(tempPost); // 수정 게시글 임시로 보여줌
        const post = await putPost({postId : selectedPost?.id, formData});
        // 임시 게시글 -> 서버 게시글로 업데이트 시 이미지 깜빡이는 현상 해결을 위해
        const mergedPost: Post = {
            ...post,
            files: post.files.map((serverFile: ServerFile) => {
                // 기존 tempPost의 파일과 매칭해서 previewUrl 재사용
                const matched = tempPost.files.find(
                    f => f.path === serverFile.path || f.originalname === serverFile.originalname
                );
                return {
                    ...serverFile,
                    previewUrl: matched?.previewUrl ?? serverFile.path,
                };
            }),
        };            
        replacePost(mergedPost);
    }

    const handleSubmit = async (e :React.SubmitEvent) => {

        e.preventDefault(); // 폼 보내고 새로고침 방지

        close(); // 모달 먼저 닫기
        
        // 임시 글 먼저 추가
        const tempPost: Post = {
            id: selectedPost?.id ?? Date.now(),
            title: form.title,
            content: form.content,
            memberId: userInfo?.memberId ?? 0,
            likeCount: 0,
            likedByMe: false,
            replyCount: 0,
            reportCount: 0,
            reportedByMe: false,
            nickname: userInfo?.nickname ?? "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            profileImg: '',
            files: [
                // 기존 서버 파일 (삭제되지 않은 것만)
                ...serverFiles.map(file => ({
                    ...file,
                    previewUrl: file.path,
                })),
                // 새로 첨부한 파일
                ...uploadFiles.map((file, index) => ({
                    id: Date.now() + index,
                    originalname: file.file.name,
                    size: file.file.size,
                    path: '',
                    contentType: file.file.type,
                    createdAt: '',
                    postId: selectedPost?.id ?? 0,
                    previewUrl: URL.createObjectURL(file.file),
                }))
            ]
        };


        const formData = new FormData();
        
        formData.append('title', form.title);
        formData.append('content', form.content);
        uploadFiles.forEach((file) => {
            formData.append("files", file.file);
        });

        if (mode === "edit") {
            handleEdit(tempPost, formData);
        } else {
            handleCreate(tempPost, formData);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = e.target.files;
        if (!newFiles) return;

        const mapped = Array.from(newFiles).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setUploadFiles((prev) => [...prev, ...mapped]);
        e.target.value = ""; // 같은 파일 다시 선택 가능
    };

    // 임시 이미지 삭제
    const handleDelete = (index: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    // 서버 이미지 삭제
    const handleUploadDelete = (id: number) => {
        setServerFiles(prev => prev.filter((file) => file.id !== id));
        setDeleteFileIds(prev => [...prev, id]);
    }

    // 메모리 누수 방지
    useEffect(() => {
        return () => {
            uploadFiles.forEach((file) => URL.revokeObjectURL(file.preview));
        };
    }, [uploadFiles]);
    
    

    if (!isOpen) return null;
    
    return (
        <form name="" className="mt-2" onSubmit={handleSubmit}>
            <Modal props={modalProps}>
                <header className="flex align-middle gap-3 pb-3">
                    <UserAvatar classes="w-[34px] h-[34px]" profileImg={userInfo?.profileImgUrl} />
                    <div>
                        <div className="flex align-center w-full gap-2 font-bold whitespace-nowrap">{userInfo?.nickname}</div>
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
                    <label htmlFor="file" className="flex align-middle gap-1 text-gray-400 text-sm cursor-pointer"><ImagePlus strokeWidth={1.5} size={25} /> 사진추가</label>
                    {
                        (mode === "edit" && serverFiles?.length > 0) ? 
                        <ul className="flex gap-2 mt-3">
                            {serverFiles.map((file) =>  <li key={file.id} className="relative w-[60px] h-[60px] border border-gray-300 rounded-lg overflow-hidden">
                                    <Image loading="eager" src={file.path} alt="첨부파일" fill className="object-cover object-center" />
                                    <button type="button" onClick={() => handleUploadDelete(file.id)} className="absolute right-0 top-0 p-1 w-full">
                                        <X strokeWidth={1.5} size={19} className=" text-gray-400" />
                                    </button>
                                </li>)}
                            {uploadFiles?.map((file, index) => <li key={file.preview} className="relative w-[60px] h-[60px] border border-gray-300 rounded-lg overflow-hidden">
                                    <Image loading="eager" src={file.preview} alt="첨부파일" fill className="object-cover object-center" />
                                    <button type="button" onClick={() => handleDelete(index)} className="absolute right-0 top-0 p-1 w-full">
                                        <X strokeWidth={1.5} size={19} className=" text-gray-400" />
                                    </button>
                                </li>)}                                
                        </ul>
                        :
                        uploadFiles?.length > 0 &&
                        <ul className="flex gap-2 mt-3">
                            {uploadFiles.map((file, index) => <li key={file.preview} className="relative w-[60px] h-[60px] border border-gray-300 rounded-lg overflow-hidden">
                                    <Image loading="eager" src={file.preview} alt="첨부파일" fill className="object-cover object-center" />
                                    <button type="button" onClick={() => handleDelete(index)} className="absolute right-0 top-0 p-1 w-full">
                                        <X strokeWidth={1.5} size={19} className=" text-gray-400" />
                                    </button>
                                </li>)}
                        </ul>
                    }                
                </div>
            </Modal>
        </form>
    )
}