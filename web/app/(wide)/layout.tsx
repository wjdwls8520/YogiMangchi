//와이드페이지 (1480px) 레이아웃
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function WideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F4F5F7]"> 
      <Header />
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}