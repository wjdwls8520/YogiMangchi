
import React from "react";
import Link from "next/link";
import AdminGuard from "./AdminGuard";

export const metadata = {
  title: "요기망치 어드민",
  description: "요기망치 어드민 페이지입니다.",
};

export default function StandardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminGuard>

      <header className="flex justify-between items-center mx-auto sticky top-0 left-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-zinc-900 py-5 px-8">
          <Link href="/admin" aria-label="어드민 메인 페이지로 이동"><h1 className="text-xl font-bold">요기망치 어드민</h1></Link>
          <nav>
            <ul className="flex gap-8">
              <li><Link href="/admin/contest">대회 관리</Link></li>
              <li><Link href="/admin/community">커뮤니티 관리</Link></li>
              <li><Link href="/admin/users">회원 관리</Link></li>
            </ul>
          </nav>
          <ul>
            <li><Link href="/">서비스로 가기</Link></li>
          </ul>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
      </main>

      </AdminGuard>
    </div>
  );
}