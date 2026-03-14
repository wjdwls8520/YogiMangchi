"use client";

import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();

  const handleVerify = () => {
    // TODO: 휴대폰 본인인증 로직 (또는 인증 정보 입력 폼)으로 이동
    console.log("휴대폰 본인인증 시작");
    router.push("/verify");
  };

  const handleSkip = () => {
    // TODO: 일반 회원 상태로 온보딩 완료 처리 후 메인 페이지로 이동
    console.log("다음에 하기: 일반 회원으로 시작");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12">
        
        {/* 상단 아이콘 및 타이틀 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <span className="text-3xl">🎁</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            잠깐! <span className="text-[#0058FF]">인증 회원</span>이 되고<br />
            실제 혜택을 누려보세요
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            안전한 이벤트 참여와 경품 지급을 위해<br />
            딱 한 번, 본인 확인이 필요합니다.
          </p>
        </div>

        {/* 혜택 안내 리스트 */}
        <div className="mb-10 rounded-xl bg-gray-50 p-6">
          <h3 className="mb-4 text-sm font-bold text-gray-900">✨ 인증 회원 전용 특별 혜택</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#0058FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>주간 수익률 랭킹전 공식 참가 자격 부여</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#0058FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>랭킹 보상 (치킨, 커피 기프티콘 등) 수령 가능</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-700">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#0058FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>여기망치 프리미엄 차티스트 배지 획득 기회</span>
            </li>
          </ul>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex flex-col gap-3">
          {/* Primary Button: 눈에 가장 띄는 인증 버튼 */}
          <button
            onClick={handleVerify}
            className="flex w-full justify-center rounded-xl bg-[#0058FF] px-5 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0058FF] focus:ring-offset-2"
          >
            지금 30초 만에 인증하기
          </button>
          
          {/* Secondary Button: 건너뛰기 버튼 (시각적으로 덜 띄게) */}
          <button
            onClick={handleSkip}
            className="flex w-full justify-center rounded-xl px-5 py-4 text-sm font-medium text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 focus:outline-none"
          >
            다음에 하기 (일반 회원으로 시작)
          </button>
        </div>

      </div>
    </div>
  );
}