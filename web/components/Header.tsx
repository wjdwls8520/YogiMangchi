"use client";
import { FiSearch } from "react-icons/fi";
import { AiOutlineMoon } from "react-icons/ai";
import { IoPersonOutline, IoWalletOutline } from "react-icons/io5";
import { FiSun } from "react-icons/fi";
import { IoIosMenu } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";

import Link from "next/link";

import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils/cs";
import { useEffect, useState } from "react";
import NavMenu from "./NavMenu";
import Dim from "./Dim";

import Logo from "./ui/Logo";


export default function Header() {

    const { isLogin, login, logout, user } = useAuthStore();
    const { isDarkMode, toggleDarkMode } = useUIStore();

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/member/me/info', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    login(data); // 성공하면 스토어에 유저 데이터 저장
                } else {
                    logout(); // 실패하면 로그아웃 상태로 초기화
                }
            } catch (error) {
                logout();
            }
        };
        checkAuth();
    }, [login, logout]);

    useEffect(() => {
        if (isDarkMode) {
        document.documentElement.classList.add("dark");
        } else {
        document.documentElement.classList.remove("dark");
        }        
    }, [isDarkMode])
    
    return <header id="header" className="sticky top-0 left-0 z-50 w-full bg-white dark:bg-zinc-900">
        
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <Link href="/" aria-label="메인 페이지로 이동"><Logo /></Link>
            <NavMenu classes={'md:block hidden'} />
            <div className="flex gap-2 items-center">
                <button onClick={toggleDarkMode}>
                    {
                        isDarkMode ? 
                        <FiSun className="w-5 h-5" /> :
                        <AiOutlineMoon className="w-5 h-5" />
                    }
                </button>

                <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-700 mx-2" />

                {isLogin && (
                    <Link 
                        href="/assets" 
                        className="hidden sm:flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white-50 dark:bg-blue-900/20 text-gray-600 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all font-bold text-sm border border-gray-300 dark:border-blue-800/50 hover:border-gray-500"
                    >
                        <IoWalletOutline className="w-4 h-4" />
                        <span>자산</span>
                    </Link>
                )}

                <Link href={isLogin ? "/me" : "/login"}>
                    {
                        isLogin ? (
                            // 로그인 정보가 있을 때: 프로필 사진 표시
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 flex items-center justify-center">
                                {user?.profileImgUrl ? (
                                    <img 
                                        src={user.profileImgUrl} 
                                        alt="프로필" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    // 사진이 없는 경우 기본 아이콘
                                    <IoPersonOutline className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        ) : (
                            // 로그인 정보가 없을 때: 기존 'Login' 텍스트
                            <span className="text-sm font-bold dark:text-gray-300">Login</span>
                        )
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