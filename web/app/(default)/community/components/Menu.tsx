"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FaRegStar } from "react-icons/fa";
import { MdChatBubbleOutline } from "react-icons/md";
import { GrLineChart } from "react-icons/gr";
import { LuNewspaper } from "react-icons/lu";
import { cn } from "@/utils/cs";
import Slider from "@/components/Slider/Slider";
import { useEffect, useState } from "react";

const menuList = [
    {
        name: '전체글',
        id: 'all',
        icon: <FaRegStar />,
    },
    {
        name: '자유게시판',
        id: 'free',
        icon: <MdChatBubbleOutline />,
    },
    {
        name: '분석공유',
        id: 'analyze',
        icon: <GrLineChart />,
    },   
    {
        name: '뉴스',
        id: 'news',
        icon: <LuNewspaper />,
    },           
]


export default function Menu() {
    
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        const el = document.getElementById('header');
        if (!el) return;

        // ResizeObserver : 특정 요소의 크기 변화를 감시하는 브라우저 내장 api
        // window.resize : window 전체 크기 변화만 감지
        const observer = new ResizeObserver((entries) => { // 크기가 변할 때 마다 실행
            // 콜백 안에서 setState → 외부 구독 패턴으로 인식
            setHeaderHeight(entries[0].contentRect.height);
        });

        observer.observe(el); //감시 시작
        return () => observer.disconnect(); // 감시 중단
    }, []);
    
    const pathname = usePathname();
    const pathArr = pathname.split('/');
    const activeId = pathArr[pathArr.length - 1];
    

    return <nav className={`sticky z-10 col-span-3 self-start bg-white dark:bg-zinc-900 md:pt-6 py-3 md:mt-[-10px]`} style={{ top: headerHeight }}>
        <Slider useWheel={false} className="pb-2">
            <ul className="flex md:flex-col flex-row gap-8 flex-nowrap">
                {menuList.map((menu) => <li key={menu.id} className="whitespace-nowrap">
                        <Link 
                            href={`/community/${menu.id}`} 
                            className={cn("flex items-center gap-3 font-medium", activeId === menu.id && 'text-blue-700')}>
                            {menu.icon}
                            {menu.name}
                        </Link>
                    </li>
                )}
            </ul>
        </Slider>
    </nav>
}
