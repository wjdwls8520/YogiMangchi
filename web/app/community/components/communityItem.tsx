"use client";

import { UserIcon } from "@/components/icons";
import { Post } from "../types/post";
import Image from "next/image";
import testImg from "./test.png";
import { BsThreeDots } from "react-icons/bs";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Props {
  post: Post;
}

export default function CommunityItem({ post }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {

        if (e.deltaY === 0) return;

        e.preventDefault(); // 기본 스크롤 막기
        e.stopPropagation(); // 부모로 이벤트 전파 막기

        // Firefox는 deltaMode === 1 (라인 단위)이라 픽셀로 환산
        const delta = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY * 1

        // scroll : 절대 위치에서 이동, scrollBy : 상대 위치에서 이동
        el.scrollBy({
            left: delta,
            behavior: "smooth"
        });
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
        el.removeEventListener("wheel", onWheel);
    };
    }, []);

    return(
        <li className="border border-gray-200 rounded-2xl p-5">
            <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <div className="profile">
                    {
                        post.profileImg ? 
                        <Image src={post.profileImg} alt="프로필 이미지" /> : 
                        <UserIcon className="w-[45px] h-[45px]" />
                    }
                </div>
                <div className="">
                    <p className="font-semibold">{post.nickname}</p>
                    <small className="text-gray-500">{post.createAt}</small>
                </div>
                <div className="relative">
                    <button type="button">
                        <BsThreeDots className="justify-self-end-safe text-gray-500" />
                    </button>
                    <div className="absolute right-0 w-28 border border-gray-300 rounded-xl p-3">
                        <Link href="#">신고하기</Link>
                    </div>
                </div>
            </header>
            <div className="pt-3">
                    <p className="text-lg font-semibold">{post.title}</p>
                    <div>{post.content}</div>
            </div>
            <div 
                className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-custom scroll-touch touch-pan-y w-full pt-10 pb-2" 
                ref={containerRef} 
            >
                <Image width={250} height={250} src={testImg} alt="첨부 이미지" className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl" />
                <Image width={250} height={250} src={testImg} alt="첨부 이미지" className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl" />
                <Image width={250} height={250} src={testImg} alt="첨부 이미지" className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl" />
                <Image width={250} height={250} src={testImg} alt="첨부 이미지" className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl" />
            </div>
            {
                post.images.length > 0 && 
                <div className="flex gap-2.5">
                    {post.images.map((image) => <Image key={image} src={image} alt="첨부 이미지" />)}
                </div>
            }
        </li>
    )
}