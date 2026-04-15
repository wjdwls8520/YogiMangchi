
import React from "react";
import Link from "next/link";
import AdminGuard from "./AdminGuard";
import packageInfo from "@/package.json";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata = {
  title: "요기망치 어드민",
  description: "요기망치 어드민 페이지입니다.",
};

const buildDate = process.env.BUILD_DATE;
const formattedDate = buildDate ? buildDate.split('T')[0] : 'Unknown';

export default function StandardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminGuard>

          <AdminHeader />
          
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
              {children}
          </main>

          <footer className="mt-12 py-6 border-t border-gray-200 text-center">
            <div className="flex flex-col items-center gap-1 text-xs text-gray-400">
              <p>© 2026 YogiMangchi Admin.</p>
              <div className="flex items-center gap-3">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">v{packageInfo.version} / Build: {formattedDate}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <button className="hover:text-gray-600 transition-colors underline-offset-2 underline">개발팀 문의</button>
              </div>
            </div>
          </footer>

      </AdminGuard>
    </div>
  );
}