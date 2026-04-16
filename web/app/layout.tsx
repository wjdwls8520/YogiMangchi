// 전체페이지 레이아웃
import type { Metadata } from "next";
import "./globals.css";
import SSEProvider from "./SSEProvider";
import AuthBootstrap from "./AuthBootstrap";
import FeedbackProvider from "@/components/ui/FeedbackProvider";

export const metadata: Metadata = {
  title: "요기망치",
  description: "나의 욕망을 실현할 곳",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="ko">
      <body className="antialiased bg-white text-black dark:bg-zinc-900 dark:text-white">
          <FeedbackProvider>
              <AuthBootstrap />
              <SSEProvider>
                  {children}
              </SSEProvider>
          </FeedbackProvider>
      </body>
    </html>
  );
}
