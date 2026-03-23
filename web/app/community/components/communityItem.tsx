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

interface Props {
  post: Post;
}

export default function CommunityItem({ post }: Props) {

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
        <li className="border border-gray-200 rounded-2xl p-8">
            <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <UserAvatar profileImg={post.profileImg} />
                <div className="">
                    <p className="font-semibold">{post.nickname}</p>
                    <small className="text-gray-500">{post.createAt}</small>
                </div>
                <div className="relative">
                    <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
                        <BsThreeDots className="justify-self-end-safe text-gray-500" />
                    </button>
                    {
                        isOpen && 
                        <div className="absolute right-0 w-28 border border-gray-300 rounded-xl p-3">
                            <Link href="#">신고하기</Link>
                        </div>
                    }
                </div>
            </header>
            <div className="pt-3">
                <p className="text-xl font-semibold">{post.title}</p>
                <div className={cn("pt-1", !isExpanded &&"line-clamp-4")} ref={textRef}>
                    {post.content}{post.content}{post.content}{post.content}
                </div>
                {
                    isOverflow &&
                    <button type="button" className="mt-7 text-gray-400" onClick={() => setIsExpanded(prev => !prev)}>
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
                                draggable={false}
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
                <li className="flex items-center gap-1"><VscHeart className="text-xl" strokeWidth={0.3} /> 343</li>                
                <li className="flex items-center gap-1"><HiOutlineChatBubbleOvalLeft className="text-xl" strokeWidth={2} /> 460</li>                
                <li className="flex items-center gap-1"><GoShareAndroid className="text-xl" strokeWidth={0.3} /> 공유</li>                
            </ul>

            <ul className="mt-8">
                <CommentItem profileImg="" content="잘 보고 가요" createAt="방금전" nickname="주식왕"  />
            </ul>
        </li>
    )
}