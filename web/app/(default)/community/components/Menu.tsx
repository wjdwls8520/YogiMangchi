"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cs";
import Slider from "@/components/Slider/Slider";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { Newspaper, Star } from "lucide-react";

const menuList = [
    {
        name: '전체글',
        id: 'all',
        icon: <Star strokeWidth={1.7} size={17} />,
    },
    {
        name: '뉴스',
        id: 'news',
        icon: <Newspaper strokeWidth={1.7} size={17} />,
    },           
]


export default function Menu() {
    
    const headerHeight = useHeaderHeight();
    
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
