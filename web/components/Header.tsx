"use client";
import { FiSearch } from "react-icons/fi";
import { AiOutlineMoon } from "react-icons/ai";
import { IoPersonOutline } from "react-icons/io5";
import { FiSun } from "react-icons/fi";

import Link from "next/link";

import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/utils/cs";

import { usePathname } from "next/navigation";

type menuType = {
    href: string;
    name: string;
    id: string;
}

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
        href: '#',
        name: '커뮤니티',
        id: 'community'
    },     
    {
        href: '/rank',
        name: '차티스트',
        id: 'rank'
    }  
]

export default function Header() {

    const { isLogin, login, logout } = useAuthStore();
    const { isMenuOpen, toggleMenu, isDarkMode, toggleDarkMode, currentMenu, setCurrentMenu } = useUIStore();

    const pathname = usePathname(); // 현재 우리가 접속한 URL 주소를 알려주는 훅

    // 현재주소가 signup login...일때 헤더없음
    if (pathname === "/signup" || pathname === "/login" || pathname === "/verify" || pathname === "/signup/benefits") {
        return null; 
    }

    return <header className="w-full">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <Link className="text-2xl font-bold" href="/">여기망치</Link>
            <nav className="flex gap-6">
                {
                    menuList.map((menu) => 
                        <Link 
                            key={menu.id} 
                            href={menu.href} 
                            onClick={() => setCurrentMenu(menu.id)}
                            className={cn("py-1.5 px-3 rounded-md", currentMenu === menu.id && "bg-gray-100")}
                        >
                            {menu.name}
                        </Link>)
                }
            </nav>
            <div className="flex gap-6">
                <button>
                    <FiSearch className="w-5 h-5" />
                </button>
                <button onClick={toggleDarkMode}>
                    {
                        isDarkMode ? 
                        <FiSun className="w-5 h-5" /> :
                        <AiOutlineMoon className="w-5 h-5" />
                    }
                    
                </button>
                <Link href="/login">
                    {
                        isLogin ?
                        <IoPersonOutline className="w-5 h-5" /> :
                        'Login'
                    }
                </Link>
            </div>
        </div>

    </header>
}