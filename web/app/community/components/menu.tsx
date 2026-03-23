"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FaRegStar } from "react-icons/fa";
import { MdChatBubbleOutline } from "react-icons/md";
import { GrLineChart } from "react-icons/gr";
import { LuNewspaper } from "react-icons/lu";
import { cn } from "@/utils/cs";

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
    

    return <nav className="pt-6 mt-[-10px] sticky top-0 col-span-3 self-start">
        <ul className="flex flex-col gap-8">
            {menuList.map((menu) => <li key={menu.id}>
                    <Link 
                        href={`/community/${menu.id}`} 
                        className={cn("flex items-center gap-3 font-medium", activeId === menu.id && 'text-blue-700')}>
                        {menu.icon}
                        {menu.name}
                    </Link>
                </li>
            )}
            
        </ul>
    </nav>
}
