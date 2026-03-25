//풀페이지 레이아웃
import React from "react";

export default function FullLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex flex-col w-full min-h-screen bg-gray-50">
      
      {children}
      
    </main>
  );
}