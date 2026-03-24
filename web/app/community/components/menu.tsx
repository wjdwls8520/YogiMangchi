"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FaRegStar } from "react-icons/fa";
import { MdChatBubbleOutline } from "react-icons/md";
import { GrLineChart } from "react-icons/gr";
import { LuNewspaper } from "react-icons/lu";
import { cn } from "@/utils/cs";
import Slider from "@/components/Slider/Slider";

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

    const pathname = usePathname();
    const pathArr = pathname.split('/');
    const activeId = pathArr[pathArr.length - 1];
    

    return <nav className="sticky top-0 col-span-3 self-start bg-white dark:bg-black md:pt-6 py-3 md:mt-[-10px]">
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
