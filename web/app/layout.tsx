// 전체페이지 레이아웃
import type { Metadata } from "next";
import "./globals.css";
import SSEProvider from "./SSEProvider";
import AuthBootstrap from "./AuthBootstrap";
import FeedbackProvider from "@/components/ui/FeedbackProvider";
import ThemeInitializer from "@/components/ThemeInitializer";
import type { Viewport } from "next";


export const metadata: Metadata = {
  title: "요기망치",
  description: "나의 욕망을 실현할 곳",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="ko">
      <body className="antialiased bg-white text-black dark:bg-zinc-900 dark:text-white">
          <ThemeInitializer />
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
