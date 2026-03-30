"use client";


import { BsThreeDots } from "react-icons/bs";
import { VscHeart } from "react-icons/vsc";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { GoShareAndroid } from "react-icons/go";
import { FaRegTrashAlt } from "react-icons/fa";
import { FiFlag } from "react-icons/fi";
import { LuPenLine } from "react-icons/lu";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cs";
import { Post } from "../types/post";
import UserAvatar from "@/components/user/UserAvatar";
import Slider from "@/components/Slider/Slider";
import Button from "@/components/ui/Button";
import { formatTime } from "@/lib/utils/date";
import CommentItem from "./CommentItem";
import Image from "next/image";
import { deletePost } from "@/lib/api/post";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostStore } from "@/stores/usePostStore";
import { useModalStore } from "@/stores/useModalStore";



interface Props {
  post :Post;
  variant: "list" | "detail";
}

const comments = [
  {
    id: 1,
    profileImg: "",
    heart: 2,
    nickname: "주식왕",
    createAt: "방금전",
    content: "잘 보고 가요",
    replies: [
      {
        id: 2,
        profileImg: "",
        heart: 1,
        nickname: "익명",
        createAt: "2026.03.24",
        content: "익명의 대댓글입니다!",
        replies: [
            {
                id: 33,
                target: '익명',
                profileImg: "",
                heart: 1,
                nickname: "익명",
                createAt: "2026.03.24",
                content: "익명의 대댓글입니다!",
            },
        ],
      },
    ],
  },
  {
    id: 3,
    profileImg: "",
    heart: 4,
    nickname: "코딩러",
    createAt: "1분 전",
    content: "유익한 글 감사합니다 👍",
  },
  {
    id: 4,
    profileImg: "",
    heart: 1,
    nickname: "프론트왕",
    createAt: "5분 전",
    content: "이거 진짜 도움 됐어요!",
  },
  {
    id: 5,
    profileImg: "",
    nickname: "익명",
    heart: 0,
    createAt: "10분 전",
    content: "좋은 정보 공유 감사합니다 🙌",
  },
];

export default function CommunityItem({ post, variant }: Props) {

    const { removePost } = usePostStore();
    const { open: ModalOpen } = useModalStore();

    const [isOpen, setIsOpen] = useState(false);

    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflow, setIsOverflow] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const { user } = useAuthStore();

    const isSlide = (post?.files?.length ?? 0) > 2;

    const handleDelete = async (e: React.MouseEvent, postId: number) => {
        e.preventDefault();
        
        await deletePost(postId);
        removePost(postId); // post[] 상태 삭제
        
    }

    const openEditModal = async (e: React.MouseEvent) => {
        e.preventDefault();

        ModalOpen({mode: "edit", post: post});
    }

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        setIsOverflow(el.scrollHeight > el.clientHeight);
    }, []);

    return(
        <>
            <div className="border border-gray-200 rounded-2xl p-8">
                <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <UserAvatar profileImg={post.profileImg} />
                    <div className="">
                        <p className="font-semibold">{post.nickname}</p>
                        <small className="text-gray-500">{formatTime(post.createdAt)}</small>
                    </div>
                    <div className="relative">
                        <button type="button" className="p-1.5" onClick={(e) => {
                            e.preventDefault();
                            setIsOpen((prev) => !prev);
                        }}>
                            <BsThreeDots className="justify-self-end-safe text-gray-500" />
                        </button>
                        {
                            isOpen && 
                            <div className="absolute right-0 z-10 w-24 bg-white dark:bg-zinc-900 border border-gray-300 rounded-xl p-3 text-sm">
                                
                            { 
                                (user?.memberId === post.memberId) && 
                                <>
                                <button 
                                    type="button" 
                                    onClick={(e) => openEditModal(e)} 
                                    className="flex items-center gap-1 text-left py-1"
                                >
                                    <LuPenLine className="w-[18px] h-[16px] text-gray-500" />
                                    수정
                                </button>
                                <button 
                                    type="button" 
                                    onClick={(e) => handleDelete(e, post.id)} 
                                    className="flex items-center gap-1 text-left py-1"
                                >
                                    <FaRegTrashAlt className="w-[18px] h-[14px] text-gray-500" />
                                    삭제
                                </button>
                                </>
                            }
                                <button 
                                    type="button" 
                                    onClick={(e) => e.preventDefault()} 
                                    className="flex items-center gap-1 text-left py-1"
                                >
                                    <FiFlag className="w-[18px] h-[15px] text-gray-500" />
                                    신고
                                </button>

                            </div>
                        }
                    </div>
                </header>
                <div className="pt-3">
                    <p className="text-xl font-semibold">{post.title}</p>
                    <div className={cn("pt-1", (!isExpanded && variant !== 'detail') &&"line-clamp-4")} ref={textRef}>
                        {post.content}
                    </div>
                    {
                        (isOverflow && variant !== 'detail')&&
                        <button type="button" className="mt-7 text-gray-400"  
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsExpanded(prev => !prev);
                        }}>
                            {isExpanded ? "접기" : "더보기"}
                        </button>
                    }
                </div>

                {
                    post?.files?.length > 0 && (
                        isSlide ? (
                            <Slider>
                                <ul className="flex gap-2 w-full pt-6 pb-3">
                                    {
                                        post?.files.map((file) => <li key={file.id}
                                                                        className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl overflow-hidden"
                                                                    >
                                                                        {
                                                                            file.previewUrl ? 
                                                                            <Image src={file.previewUrl} alt={"미리보기 이미지"} width={500} height={500} draggable={false} /> :
                                                                            <Image src={file.path} alt={file.originalname} width={500} height={500} draggable={false} />
                                                                        }
                                                                    </li>)
                                    }
                                </ul>
                            </Slider>
                        ) : (
                            <ul className="flex gap-2 w-full pt-6 pb-3">
                                {
                                    post?.files.map((file) => <li key={file.id}
                                                                    className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl overflow-hidden"
                                                                >
                                                                    {
                                                                        file.previewUrl ? 
                                                                        <Image src={file.previewUrl} alt={"미리보기 이미지"} width={500} height={500} draggable={false} /> :
                                                                        <Image src={file.path} alt={file.originalname} width={500} height={500} draggable={false} />
                                                                    }
                                                                </li>)
                                }
                            </ul>
                        )
                    )
                }

                <ul className="flex gap-4 mt-4 text-gray-400 text-sm">
                    <li>
                        <button type="button" className="flex items-center gap-1"><VscHeart className="text-xl" strokeWidth={0.3} /> {post.likeCount}</button>
                    </li>                
                    <li>
                        <button type="button" className="flex items-center gap-1"><HiOutlineChatBubbleOvalLeft className="text-xl" strokeWidth={2} /> {post.replyCount}</button>
                    </li>                
                    <li>
                        <button type="button" className="flex items-center gap-1"><GoShareAndroid className="text-xl" strokeWidth={0.3} /> 공유</button>
                    </li>                
                </ul>
            </div>

            {/* 댓글 */}
            { variant === 'detail' &&
                <>
                    <h3 className="mt-8 font-semibold text-lg">답글 {post.replyCount}개</h3>
                    <ul className=" border-b border-gray-200 pb-3">
                        {comments.map((data) => <CommentItem key={data.id} comment={data} />)}
                    </ul>
                    <div className="relative mt-8">
                        <textarea 
                            name="" id="" 
                            placeholder="댓글을 남겨보세요" 
                            className="w-full resize-none border rounded-xl border-gray-200 p-4"
                            rows={4}
                        >
                        </textarea>
                        <Button type="button" className="absolute right-5 bottom-5" variant="sky" size="sm" disabled>등록</Button>
                    </div>
                </>
            }
        
        </>
    )
}