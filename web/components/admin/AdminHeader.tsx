"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { cn } from "@/lib/utils/cs";
import {
  Bell,
  LogOut,
  Moon,
  Search,
  ShieldCheck,
  SquareArrowOutUpRight,
  Sun,
} from "lucide-react";

export default function AdminHeader() {
  const router = useRouter();
  const { toast } = useFeedback();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navLinks = [
    { href: "/admin/contest", label: "대회 관리" },
    { href: "/admin/community", label: "커뮤니티 관리" },
    { href: "/admin/users", label: "회원 관리" },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}`}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("failed to logout from admin header:", error);
    } finally {
      logout();
      toast({
        title: "로그아웃되었습니다.",
        tone: "success",
      });
      router.replace("/");
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 left-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-6 px-6 py-3">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2" aria-label="어드민 메인">
            <h1 className="text-xl font-bold dark:text-white">요기망치</h1>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white dark:bg-white dark:text-zinc-900">
              ADMIN
            </span>
          </Link>

          <nav className="hidden md:block">
            <ul className="flex gap-6">
              {navLinks.map((link) => {
                const isActive = pathname?.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "relative py-1 text-[14px] font-semibold transition-colors",
                        isActive
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      )}
                    >
                      {link.label}
                      {isActive ? (
                        <span className="absolute left-0 -bottom-[17px] h-[2px] w-full rounded-t-full bg-gray-900 dark:bg-white" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="relative hidden w-full max-w-md flex-1 group lg:flex">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300"
              size={16}
            />
            <input
              type="text"
              placeholder="회원명, 게시글 검색..."
              className="w-full rounded-lg border-transparent bg-gray-100 py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-400 dark:bg-zinc-800 dark:text-white dark:focus:bg-zinc-900"
            />
          </div>

          {/* 다크모드 */}
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* 알림 */}
          <button className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-900" />
          </button>

          {/* 서비스 이동 버튼 */}
          <Link
            href="/"
            target="_blank"
            className="ml-1 hidden items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 sm:flex"
          >
            <SquareArrowOutUpRight size={14} />
            <span>서비스 홈</span>
          </Link>

          <div className="mx-2 h-5 w-[1px] bg-gray-200 dark:bg-zinc-700" />

          {/* 관리자 프로필 배지 */}
          <div className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <ShieldCheck size={14} />
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {user?.nickname || "관리자"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800"
          >
            <LogOut size={14} />
            <span>{isLoggingOut ? "로그아웃 중..." : "로그아웃"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
