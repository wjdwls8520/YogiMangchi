"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NavMenu from "./NavMenu";
import Dim from "./Dim";
import Logo from "./ui/Logo";
import {
  Bell,
  Moon,
  Settings,
  Sun,
  Menu,
  UserRound,
  Wallet,
} from "lucide-react";
import MenuLayer from "./ui/MenuLayer";

export default function Header() {
  const { isLogin, user } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);

  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [isAlarmMounted, setIsAlarmMounted] = useState(false);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isMenuMounted || isAlarmMounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuMounted, isAlarmMounted]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1100) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isOpen || !isMenuMounted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsMenuMounted(false);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isMenuMounted, isOpen]);

  useEffect(() => {
    if (isAlarmOpen || !isAlarmMounted) return;

    const timeout = setTimeout(() => {
      setIsAlarmMounted(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [isAlarmOpen, isAlarmMounted]); 

  const openMobileMenu = () => {
    setIsMenuMounted(true);
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  const openAlarm = () => {
    setIsAlarmMounted(true);
    requestAnimationFrame(() => {
      setIsAlarmOpen(true);
    });
  };

  const closeAlarm = () => {
    setIsAlarmOpen(false);
  };  

  const mobileMenuLayer =
    isMenuMounted && typeof document !== "undefined"
      ? createPortal(
          <>
            <Dim onClickDim={closeMobileMenu} isVisible={isOpen} />
            <MenuLayer isOpen={isOpen} close={() => setIsOpen(false)}>
                <NavMenu
                  onClickItem={closeMobileMenu}
                  classes="flex-col gap-2"
                  variant="drawer"
                />

                <div className="mt-6 border-t border-gray-100 pt-5 dark:border-zinc-800">
                  <div className="flex flex-col gap-2">
                    {user?.role === "ADMIN" ? (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
                      >
                        <Settings strokeWidth={2} size={16} />
                        <span>Admin</span>
                      </Link>
                    ) : null}

                    {isLogin ? (
                      <Link
                        href="/assets"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
                      >
                        <Wallet strokeWidth={2} size={16} />
                        <span>자산</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
            </MenuLayer>
          </>,
          document.body
        )
      : null;

const alarmLayer =
  isAlarmMounted && typeof document !== "undefined"
    ? createPortal(
        <>
          <Dim onClickDim={closeAlarm} isVisible={isAlarmOpen} /> 
          <MenuLayer isOpen={isAlarmOpen} close={() => setIsAlarmOpen(false)}>
            <div className="rounded-xl border border-1 p-3">

            </div>
          </MenuLayer>
        </>,
        document.body
      )
    : null;      

  return (
    <header
      id="header"
      className="sticky top-0 left-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-zinc-900/80 dark:border-zinc-800 transition-colors"
    >
      <div className="relative max-w-[1280px] m-auto px-6 py-3 flex items-center justify-between">
        
        <Link href="/" aria-label="메인 페이지로 이동" className="flex items-center scale-[0.85] origin-left flex-shrink-0">
          <Logo />
        </Link>

        <div className="hidden min-[1101px]:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <NavMenu classes={"flex"} variant="desktop" />
        </div>

        {/* 우측 유틸리티 */}
        <div className="flex gap-2.5 items-center">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDarkMode ? <Sun strokeWidth={2} size={20} /> : <Moon strokeWidth={2} size={20} />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={openAlarm}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              <Bell size={20} strokeWidth={2} />
              <span className="absolute top-0 right-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500  text-[9px] font-bold text-white">
                10
              </span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-700 mx-1 hidden sm:block" />

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-gray-50 text-gray-700 font-semibold text-sm border border-gray-200 hover:bg-gray-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700 transition-colors"
            >
              <Settings strokeWidth={2} size={15} />
              <span>Admin</span>
            </Link>
          )}

          {isLogin && (
            <Link
              href="/assets"
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
            >
              <Wallet strokeWidth={2} size={15} />
              <span>자산</span>
            </Link>
          )}

          <Link href={isLogin ? "/me" : "/login"} className="ml-1">
            {isLogin ? (
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-zinc-700 bg-gray-50 dark:bg-zinc-800 flex items-center justify-center transition-transform hover:scale-105">
                {user?.profileImgUrl ? (
                  <img src={user.profileImgUrl} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <UserRound strokeWidth={2} size={18} className="text-gray-400" />
                )}
              </div>
            ) : (
              <span className="text-sm font-bold text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors px-2">
                로그인
              </span>
            )}
          </Link>

          <button
            type="button"
            className="block min-[1101px]:hidden p-2 text-gray-600 dark:text-gray-300 ml-1"
            onClick={openMobileMenu}
          >
            <Menu strokeWidth={2} size={22} />
          </button>
        </div>
      </div>
      {mobileMenuLayer}
      {alarmLayer}
    </header>
  );
}
