"use client";

import testImg from "./test.png";
import { BsThreeDots } from "react-icons/bs";
import { VscHeart } from "react-icons/vsc";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { GoShareAndroid } from "react-icons/go";

import { Post } from "../types/post";

import Slider from "@/components/Slider/Slider";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cs";
import UserAvatar from "@/components/user/UserAvatar";
import Image from "next/image";
import CommentItem from "./CommentItem";
import Button from "@/components/ui/Button";

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

    const [isOpen, setIsOpen] = useState(false);

    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflow, setIsOverflow] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

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
                        <small className="text-gray-500">{post.createAt}</small>
                    </div>
                    <div className="relative">
                        <button type="button" onClick={(e) => {
                            e.preventDefault();
                            setIsOpen((prev) => !prev);
                        }}>
                            <BsThreeDots className="justify-self-end-safe text-gray-500" />
                        </button>
                        {
                            isOpen && 
                            <div className="absolute right-0 w-28 border border-gray-300 rounded-xl p-3">
                                <button type="button" onClick={(e) => e.preventDefault()}>신고하기</button>
                            </div>
                        }
                    </div>
                </header>
                <div className="pt-3">
                    <p className="text-xl font-semibold">{post.title}</p>
                    <div className={cn("pt-1", (!isExpanded && variant !== 'detail') &&"line-clamp-4")} ref={textRef}>
                        {post.content}{post.content}{post.content}{post.content}
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

                {/* slide 테스트 코드 */}
                <Slider className="pt-6 pb-3">
                    <ul className="flex gap-2 w-full">
                        {[0,0,0,0,0].map((el, index) => 
                            <li key={index} className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl overflow-hidden">
                                <Image 
                                    width={250} height={250} 
                                    src={testImg} alt="첨부 이미지" 
                                />
                            </li>        
                        )}
                                                                                
                    </ul>
                </Slider>

                {/* 실제 slide 코드 */}
                {
                    post.images.length > 0 && 
                    <Slider className="pt-6 pb-3">
                        <ul className="flex gap-2 w-full">
                            {
                                post.images.map((image) => <li key={image}
                                                                className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl overflow-hidden"
                                                            >
                                                                <Image src={image} alt="첨부 이미지" width={250} height={250} draggable={false} />
                                                            </li>)
                            }
                        </ul>
                    </Slider>
                }

                <ul className="flex gap-4 mt-4 text-gray-400 text-sm">
                    <li>
                        <button type="button" className="flex items-center gap-1"><VscHeart className="text-xl" strokeWidth={0.3} /> 343</button>
                    </li>                
                    <li>
                        <button type="button" className="flex items-center gap-1"><HiOutlineChatBubbleOvalLeft className="text-xl" strokeWidth={2} /> 460</button>
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