import React from "react";
import Header from "@/components/Header";

export default function TradeFullLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F5F7]">
      <Header />
      <main className="min-h-0 flex-1 w-full">{children}</main>
    </div>
  );
}
