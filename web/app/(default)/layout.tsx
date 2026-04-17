//풀페이지 레이아웃
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function StandardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-22">
        {children}
      </main>
      <Footer />
    </div>
  );
}