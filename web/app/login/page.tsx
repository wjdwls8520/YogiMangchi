"use client";

import { useRouter } from "next/navigation";
import { KakaoIcon, GoogleIcon } from "@/components/icons";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const handleKakaoLogin = () => {
    // TODO: NextAuth 카카오 로그인 연동 로직
    console.log("카카오 로그인 클릭");
    router.push("/onboarding");
  };

  const handleGoogleLogin = () => {
    // TODO: NextAuth 구글 로그인 연동 로직
    console.log("구글 로그인 클릭");
    router.push("/onboarding");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] dark:bg-gray-900 x-4 sm:px-6 lg:px-8 ">
      <div className="w-full max-w-[420px] rounded-2xl bg-white dark:bg-gray-800 p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12">
        
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-300 sm:text-3xl">
            나의 욕망을 실현할 곳,<br />
            <span className="mt-2 block text-[#0058FF]">요기망치</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
            단 3초만에 가입하고 모든 서비스를 이용해보세요.
          </p>
        </div>


        <div className="space-y-4">
          <Button variant="yellow" size="lg" fullWidth onClick={handleKakaoLogin}>
            <KakaoIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            카카오로 계속하기
        </Button>

          <Button variant="white" size="lg" fullWidth onClick={handleGoogleLogin}>
            <GoogleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            구글로 계속하기
          </Button>
        </div>

      </div>
    </div>
  );
}