"use client";

import Modal from "@/components/Modal";
import UserAvatar from "@/components/user/UserAvatar";
import { useEffect, useState } from "react";
import Image from "next/image";
import { createPost, putPost } from "@/lib/api/post";
import { FetchClientError } from "@/lib/api/client";

import { File as ServerFile, Post } from "../types/post";
import { useAuthStore } from "@/stores/useAuthStore";
import { useModalStore } from "@/stores/useModalStore";
import { usePostStore } from "@/stores/usePostStore";
import { ImagePlus, X } from "lucide-react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useParams, usePathname, useRouter } from "next/navigation";


type UploadFile = {
  file: File;
  preview: string;
};

type PreviewFileItem = {
  key: string;
  src: string;
  onDelete: () => void;
};

const TITLE_MAX_LENGTH = 50;
const CONTENT_MAX_LENGTH = 1000;
const FILE_MAX_COUNT = 10;


export default function WriteModal() {


    const userInfo = useAuthStore((state) => state.user);  
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const isOpen = useModalStore((state) => state.writeModal.isOpen);
    const mode = useModalStore((state) => state.writeModal.mode);
    const selectedPost = useModalStore((state) => state.writeModal.selectedPost);
    const close = useModalStore((state) => state.closeWrite);
    const { alert, toast } = useFeedback();

    const { addPost, removePost, replacePost, reconcilePost } = usePostStore();

    const modalProps = {
        title: mode === "edit" ? "글 수정" : "글쓰기",
        onClose: () => close(),
        isSubmit: true,
        closeOnDimClick: false,
    }

    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]); // 업로드 할 파일
    const [serverFiles, setServerFiles] = useState<ServerFile[]>(selectedPost?.files ?? []); // 서버에서 가져온 파일
    const [deleteFileIds, setDeleteFileIds] = useState<number[]>([]); // 서버에서 삭제할 파일
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: mode === "edit" ? (selectedPost?.title ?? "") : "",
        content: mode === "edit" ? (selectedPost?.content ?? "") : "",
    });

    const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === "object" && value !== null;

    const extractPostPayload = (payload: unknown): Post | null => {
        if (isRecord(payload) && typeof payload.id === "number") {
            return payload as unknown as Post;
        }

        const data = isRecord(payload) && isRecord(payload.data) ? payload.data : null;

        if (data && typeof data.id === "number") {
            return data as unknown as Post;
        }

        return null;
    };

    const mergeServerFilesWithPreview = (post: Post, fallbackFiles: Post["files"]) => {
        const matchedFallbackIds = new Set<number>();

        const mergedServerFiles = post.files.map((serverFile: ServerFile) => {
            const matchedIndex = fallbackFiles.findIndex(
                (file) =>
                    file.path === serverFile.path ||
                    (file.originalname === serverFile.originalname && file.size === serverFile.size)
            );

            if (matchedIndex >= 0) {
                matchedFallbackIds.add(fallbackFiles[matchedIndex].id);
            }

            const matched = matchedIndex >= 0 ? fallbackFiles[matchedIndex] : null;

            return {
                ...serverFile,
                previewUrl: matched?.previewUrl ?? serverFile.path,
            };
        });

        const unmatchedFallbackFiles = fallbackFiles.filter(
            (file) => !matchedFallbackIds.has(file.id)
        );

        return {
            ...post,
            files: [...mergedServerFiles, ...unmatchedFallbackFiles],
        };
    };

    const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
        if (error instanceof FetchClientError) {
            return error.userMessage || fallbackMessage;
        }

        if (error instanceof Error && error.message) {
            return error.message;
        }

        return fallbackMessage;
    };

    const categoryParam = params.category;
    const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
    const isDetailPage = Boolean(category && /^\/community\/[^/]+\/[^/]+$/.test(pathname));

    const previewFiles: PreviewFileItem[] = [
        ...serverFiles.map((file) => ({
            key: `server-${file.id}`,
            src: file.path,
            onDelete: () => handleUploadDelete(file.id),
        })),
        ...uploadFiles.map((file, index) => ({
            key: `upload-${file.preview}`,
            src: file.preview,
            onDelete: () => handleDelete(index),
        })),
    ];

    const renderPreviewList = (files: PreviewFileItem[]) => {
        if (files.length === 0) {
            return null;
        }

        return (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {files.map((file) => (
                    <li
                        key={file.key}
                        className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-lg border border-gray-300"
                    >
                        <Image loading="eager" src={file.src} alt="첨부파일" fill className="object-cover object-center" />
                        <button
                            type="button"
                            onClick={file.onDelete}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/85"
                            aria-label="첨부 이미지 삭제"
                        >
                            <X strokeWidth={2.5} size={16} />
                        </button>
                    </li>
                ))}
            </ul>
        );
    };

    const handleCreate = async (tempPost: Post, formData: FormData) => {
        addPost(tempPost);

        try {
            const createdPostPayload = await createPost(formData);
            const createdPost = extractPostPayload(createdPostPayload);

            if (createdPost) {
                reconcilePost(
                    tempPost.id,
                    mergeServerFilesWithPreview(createdPost, tempPost.files)
                );
            }

            return true;
        } catch (error) {
            removePost(tempPost.id);
            await alert(
                getApiErrorMessage(error, "게시글 작성에 실패했습니다. 잠시 후 다시 시도해 주세요.")
            );
            return false;
        }
    };

    const handleEdit = async (tempPost: Post, formData: FormData) => {
        deleteFileIds.forEach(id => {
            formData.append('deleteFileIds', id.toString());
        });
        replacePost(tempPost); // 수정 게시글 임시로 보여줌

        try {
            const post = await putPost({postId : selectedPost?.id, formData});
            replacePost(mergeServerFilesWithPreview(post, tempPost.files));

            return true;
        } catch (error) {
            if (selectedPost) {
                replacePost(selectedPost);
            }
            await alert(
                getApiErrorMessage(error, "게시글 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.")
            );
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault(); // 폼 보내고 새로고침 방지
        
        if (isSubmitting) {
            return;
        }

        if (!form.title.trim()) {
            await alert("제목을 입력해 주세요.");
            return;
        }

        if (!form.content.trim()) {
            await alert("내용을 입력해 주세요.");
            return;
        }
        
        // 임시 글 먼저 추가
        const tempPost: Post = {
            id: selectedPost?.id ?? Date.now(),
            title: form.title.trim(),
            content: form.content.trim(),
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
        
        formData.append('title', form.title.trim());
        formData.append('content', form.content.trim());
        uploadFiles.forEach((file) => {
            formData.append("files", file.file);
        });

        setIsSubmitting(true);

        try {
            const isSuccess =
                mode === "edit"
                    ? await handleEdit(tempPost, formData)
                    : await handleCreate(tempPost, formData);

            if (!isSuccess) {
                return;
            }

            if (mode === "edit") {
                toast({
                    title: "게시글이 수정되었습니다.",
                    tone: "success",
                });
            }

            setForm({
                title: "",
                content: "",
            });
            setUploadFiles([]);
            setDeleteFileIds([]);
            close();

            if (mode === "create" && isDetailPage && category) {
                router.push(`/community/${category}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = e.target.files;
        if (!newFiles) return;

        const currentFileCount = serverFiles.length + uploadFiles.length;
        const remainingFileCount = FILE_MAX_COUNT - currentFileCount;

        if (remainingFileCount <= 0) {
            toast("사진은 최대 10개까지 첨부할 수 있습니다.");
            e.target.value = "";
            return;
        }

        const selectedFiles = Array.from(newFiles);
        const acceptedFiles = selectedFiles.slice(0, remainingFileCount);

        if (acceptedFiles.length < selectedFiles.length) {
            toast("사진은 최대 10개까지 첨부할 수 있습니다.");
        }

        const mapped = acceptedFiles.map((file) => ({
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

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setForm({
            title: mode === "edit" ? (selectedPost?.title ?? "") : "",
            content: mode === "edit" ? (selectedPost?.content ?? "") : "",
        });
        setUploadFiles([]);
        setServerFiles(selectedPost?.files ?? []);
        setDeleteFileIds([]);
    }, [isOpen, mode, selectedPost]);
    
    

    if (!isOpen) return null;
    
    return (
        <form className="mt-2" onSubmit={handleSubmit}>
            <Modal props={modalProps}>
                <header className="flex align-middle gap-3 pb-3">
                    <UserAvatar classes="h-9 w-9" profileImg={userInfo?.profileImgUrl} />
                    <div>
                        <div className="flex align-center w-full gap-2 font-bold whitespace-nowrap">{userInfo?.nickname}</div>
                    </div>
                </header>
                <div className="mt-2">
                    <div className="font-bold text-gray-900 pb-2">
                        <input 
                            type="text" 
                            name="title" 
                            placeholder="제목" 
                            className="w-full p-2" 
                            maxLength={TITLE_MAX_LENGTH}
                            value={form?.title ?? ""}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value.slice(0, TITLE_MAX_LENGTH) })
                            } 
                        />
                    </div>
                    <textarea 
                        className="w-full resize-none p-2 mb-2" 
                        rows={5} 
                        placeholder="새로운 소식이 있나요?" 
                        name="content"
                        maxLength={CONTENT_MAX_LENGTH}
                        value={form?.content ?? ""}
                        onChange={(e) =>
                            setForm({ ...form, content: e.target.value.slice(0, CONTENT_MAX_LENGTH) })
                        }
                    >
                    </textarea>
                    <div
                        className={`px-2 pb-2 text-right text-xxs font-medium ${
                            form.content.length >= CONTENT_MAX_LENGTH ? "text-red-500" : "text-gray-400"
                        }`}
                    >
                        {form.content.length} / {CONTENT_MAX_LENGTH}
                    </div>
                    <input type="file" id="file" className="hidden" multiple onChange={handleChange} />
                    <label
                        htmlFor="file"
                        className="inline-flex w-fit items-center gap-1 text-sm text-gray-400 cursor-pointer"
                    >
                        <ImagePlus strokeWidth={1.5} size={25} />
                        <span>사진추가(최대 {FILE_MAX_COUNT}개)</span>
                    </label>
                    {renderPreviewList(previewFiles)}
                </div>
            </Modal>
        </form>
    )
}
