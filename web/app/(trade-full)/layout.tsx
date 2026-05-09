import React from "react";
import Header from "@/components/Header";
import QuestInitializer from "@/components/quest/QuestInitializer";

export default function TradeFullLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col bg-[#F4F5F7] dark:bg-zinc-900 overflow-hidden transition-colors duration-300">
      <Header />
      <main className="min-h-0 flex-1 w-full overflow-y-auto custom-scrollbar">{children}</main>
      <QuestInitializer />
    </div>
  );
}
