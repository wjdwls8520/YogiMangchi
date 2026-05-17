"use client";

import { KakaoIcon, GoogleIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function LoginPage() {
  const markAuthSyncNeeded = () => {
    window.sessionStorage.setItem("needs-auth-sync", "1");
  };
  
  const handleKakaoLogin = () => {
    markAuthSyncNeeded();
    window.location.href = `/oauth2/authorization/kakao`;
  };

  const handleGoogleLogin = () => {
    markAuthSyncNeeded();
    window.location.href = `/oauth2/authorization/google`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12 bg-gray-50 dark:bg-gray-900">
      
      <div className="w-full max-w-[420px] rounded-[24px] bg-white dark:bg-gray-800 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] sm:p-12">

        <div className="flex justify-center mb-10">
          <Link href="/" aria-label="메인 페이지로 이동">
            <Logo className="h-10"/>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-[26px] font-black leading-[1.3] text-gray-900 dark:text-white tracking-tight">
            요기서 닦은 실력,<br />
            <span className="text-[#0058ff]">실전</span>에서 터진다!
          </h1>
          <p className="mt-4 text-[15px] font-medium text-gray-400 dark:text-gray-400 leading-relaxed">
            단 3초 만에 가입하고 서비스를 이용해 보세요.
          </p>
        </div>

        <div className="space-y-3.5">
          <Button variant="yellow" size="lg" fullWidth onClick={handleKakaoLogin} className="rounded-xl font-bold">
            <KakaoIcon className="h-5 w-5 mr-2" />
            카카오로 계속하기
          </Button>

          <Button variant="white" size="lg" fullWidth onClick={handleGoogleLogin} className="rounded-xl font-bold border-gray-100">
            <GoogleIcon className="h-5 w-5 mr-2" />
            구글로 계속하기
          </Button>
        </div>

      </div>
    </div>
  );
}
