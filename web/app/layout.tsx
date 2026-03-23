import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";
import Footer from "@/components/Footer";

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
      <body className="antialiased bg-white text-black dark:bg-zinc-900 dark:text-white">
        <Header />
        <main className="pt-8 pb-40 max-w-7xl m-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
