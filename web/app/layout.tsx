import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "요기망치",
  description: "나의 욕망을 실현할 곳",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased dark:bg-indigo-950 dark:text-white">
        <Header />
        <main className="pt-16 pb-40 max-w-7xl m-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
