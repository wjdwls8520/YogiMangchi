"use client";
import { FiSearch } from "react-icons/fi";
import { AiOutlineMoon } from "react-icons/ai";
import { IoPersonOutline } from "react-icons/io5";
import { FiSun } from "react-icons/fi";
import { IoIosMenu } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";

import Link from "next/link";

import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/utils/cs";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NavMenu from "./NavMenu";
import Dim from "./Dim";


export default function Header() {

    const { isLogin, login, logout } = useAuthStore();
    const { isDarkMode, toggleDarkMode } = useUIStore();

    const [isOpen, setIsOpen] = useState(false);

    const pathname = usePathname(); // 현재 우리가 접속한 URL 주소를 알려주는 훅

    useEffect(() => {
        if (isDarkMode) {
        document.documentElement.classList.add("dark");
        } else {
        document.documentElement.classList.remove("dark");
        }        
    }, [isDarkMode])

    // 현재주소가 signup login...일때 헤더없음
    if (pathname === "/signup" || pathname === "/login" || pathname === "/verify" || pathname === "/signup/benefits") {
        return null; 
    }

    
    return <header id="header" className="sticky top-0 left-0 z-50 w-full bg-white dark:bg-zinc-900">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <Link className="text-2xl font-bold" href="/">여기망치</Link>
            <NavMenu classes={'md:block hidden'} />
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
                <button type="button" className="block md:hidden" onClick={() => setIsOpen(true)}>
                    <IoIosMenu className="w-[25px] h-[25px]" />
                </button>
                <div
                className={cn(
                    "fixed right-0 top-0 z-50 w-2/3 min-w-2xs h-full md:hidden bg-white dark:bg-zinc-900 transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
                >
                    <button type="button" className="block ml-auto p-[1.5px] mr-[20px] mt-5" onClick={() => setIsOpen(false)}>
                        <IoCloseOutline className="w-[25px] h-[25px]" />
                    </button>
                    <NavMenu onClickItem={() => setIsOpen(false)} />
                </div>
                {
                    isOpen && 
                    <Dim onClickDim={() => setIsOpen(false)} />
                }
            </div>
        </div>

    </header>
}