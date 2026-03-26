"use client";

import { cn } from "@/lib/utils/cs";
import Link from "next/link";
import { usePathname } from "next/navigation";


type menuType = {
    href: string;
    name: string;
    id: string;
}

type NavMenuProps = {
  classes?: string;
  onClickItem?: () => void;
};

const menuList: menuType[] = [
    {
        href: '/',
        name: 'Home',
        id: 'Home'
    },
    {
        href: '#',
        name: '트레이딩',
        id: 'trading'
    },    
    {
        href: '/community/all',
        name: '커뮤니티',
        id: 'community'
    },     
    {
        href: '/rank',
        name: '차티스트',
        id: 'rank'
    }  
]

export default function NavMenu({ classes, onClickItem }: NavMenuProps) {
    const pathArr = usePathname().split('/');
    const activeId = pathArr[1] || 'Home';
    return (
            <nav className={`flex md:flex-row flex-col md:gap-6 gap-2 ${classes}`}>
            {
                menuList.map((menu) => 
                    <Link 
                        key={menu.id} 
                        href={menu.href} 
                        className={cn("py-1.5 px-3 rounded-md", activeId === menu.id && "bg-gray-100 dark:bg-zinc-600")}
                        onClick={onClickItem}
                    >
                        {menu.name}
                    </Link>)
            }
        </nav>
    )
}