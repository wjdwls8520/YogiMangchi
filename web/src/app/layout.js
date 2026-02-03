import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

// Configure Noto Sans KR (Includes Latin/English support automatically)
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"], // Preload latin subset
  weight: ["100", "300", "400", "500", "700", "900"], // Load all weights
  variable: "--font-noto-sans-kr", // Define CSS variable
  display: 'swap',
});

export const metadata = {
  title: "여기망치",
  description: "모의투자 그리고 커뮤니티",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${notoSansKr.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
