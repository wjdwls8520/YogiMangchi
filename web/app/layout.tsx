import type { Metadata } from "next";
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
