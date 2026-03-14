"use client";

import { useRouter } from "next/navigation";

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
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 sm:px-6 lg:px-8">
      {/* 로그인 카드 컨테이너 */}
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12">
        
        {/* 타이틀 영역 */}
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            나의 욕망을 실현할 곳,<br />
            <span className="mt-2 block text-[#0058FF]">여기망치</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-gray-500">
            단 3초만에 가입하고 모든 서비스를 이용해보세요.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="space-y-4">
          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleKakaoLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-5 py-4 text-base font-semibold text-[#000000] transition-all hover:bg-[#E6CF00] focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3C6.477 3 2 6.53 2 10.885c0 2.768 1.761 5.19 4.417 6.551-.237.818-.857 2.973-.883 3.084-.035.156.052.222.164.148.087-.058 3.518-2.383 4.887-3.321.46.068.932.104 1.415.104 5.523 0 10-3.53 10-7.885C22 6.53 17.523 3 12 3z" />
            </svg>
            카카오로 계속하기
          </button>

          {/* 구글 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
          >
            <svg 
              className="h-5 w-5 transition-transform group-hover:scale-110" 
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            구글로 계속하기
          </button>
        </div>

        {/* 하단 안내 문구 */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>
            로그인 시 <a href="#" className="underline hover:text-gray-600">이용약관</a> 및 <a href="#" className="underline hover:text-gray-600">개인정보 처리방침</a>에 동의하게 됩니다.
          </p>
        </div>

      </div>
    </div>
  );
}