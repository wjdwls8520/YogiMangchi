"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlameIcon, WaveIcon, TurtleIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PolicyModal from "@/components/PolicyModal";

// 투자 성향 및 초기 투자금 옵션 데이터
const INVESTMENT_STYLES = [
  { id: "danta", icon: <FlameIcon className="w-10 h-10 text-red-500" />, title: "야수의 심장", desc: "단타 / 스캘핑" },
  { id: "swing", icon: <WaveIcon className="w-10 h-10 text-blue-500" />, title: "파도타기", desc: "스윙 트레이딩" },
  { id: "value", icon: <TurtleIcon className="w-10 h-10 text-green-500" />, title: "장기투자", desc: "가치 / 배당 투자" },
];


export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);
  const isFormValid = nickname.trim().length > 0 && selectedStyle && termsAgreed && privacyAgreed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // TODO: 백엔드 API로 온보딩 정보 전송 및 메인 페이지(/)로 이동
    console.log("온보딩 완료 데이터:", { nickname, selectedStyle });
    //alert(`${nickname}님, 환영합니다! 모의투자를 시작합니다.`);
    router.push("/onboarding/benefits");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">
        
        {/* 헤더 영역 */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            투자자 프로필 설정
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            요기망치에서 사용할 멋진 프로필을 완성해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. 닉네임 입력 */}
          <div>
            <label htmlFor="nickname" className="mb-2 block text-sm font-semibold text-gray-900">
              투자자 닉네임
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={10}
                placeholder="예: 워렌버핏, 단타왕 (최대 10자)"
              />
              <Button type="button" variant="gray">중복확인</Button>
            </div>
          </div>

          {/* 2. 투자 성향 선택 */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">
              나의 투자 성향은?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {INVESTMENT_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all focus:outline-none ${
                    selectedStyle === style.id
                      ? "border-[#0058FF] bg-blue-50 text-[#0058FF] ring-1 ring-[#0058FF]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-center shrink-0">
                    {style.icon}
                  </div>
                  <span className={`text-sm font-bold ${selectedStyle === style.id ? "text-[#0058FF]" : "text-gray-900"}`}>
                    {style.title}
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. 약관 동의 및 제출 버튼 영역 */}
          <div className="pt-4 border-t border-gray-100">
            <div className="mb-8 flex flex-col gap-3">
              
              {/* (1) 이용약관 동의 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-[#0058FF] focus:ring-[#0058FF] transition-all"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    [필수] 요기망치 서비스 이용약관 동의
                  </span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setActiveModal("terms")} // 이용약관 모달 열기
                  className="text-[13px] font-medium text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
                >
                  보기
                </button>
              </div>

              {/* (2) 개인정보 처리방침 동의 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-[#0058FF] focus:ring-[#0058FF] transition-all"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    [필수] 개인정보 수집 및 이용 동의
                  </span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setActiveModal("privacy")} // 개인정보 모달 열기
                  className="text-[13px] font-medium text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
                >
                  보기
                </button>
              </div>

            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex w-full justify-center rounded-xl px-5 py-4 text-base font-bold text-white transition-all ${
                isFormValid
                  ? "bg-[#0058FF] shadow-md hover:bg-blue-700 hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              모의투자 시작하기
            </button>
          </div>

        </form>
      </div>

      <PolicyModal 
        type={activeModal} 
        onClose={() => setActiveModal(null)} // 닫기 버튼 누르면 null로 바꿔서 모달을 끕니다.
      />

    </div>
  );
}