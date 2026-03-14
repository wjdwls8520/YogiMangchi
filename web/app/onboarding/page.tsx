"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 투자 성향 및 초기 투자금 옵션 데이터
const INVESTMENT_STYLES = [
  { id: "danta", icon: "🔥", title: "야수의 심장", desc: "단타 / 스캘핑" },
  { id: "swing", icon: "🌊", title: "파도타기", desc: "스윙 트레이딩" },
  { id: "value", icon: "🐢", title: "장기투자", desc: "가치 / 배당 투자" },
];

const SEED_MONEY_OPTIONS = [
  { id: "10m", amount: "1,000만 원", desc: "소소한 시작" },
  { id: "100m", amount: "1억 원", desc: "든든한 시드" },
  { id: "1b", amount: "10억 원", desc: "슈퍼개미" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const isFormValid = nickname.trim().length > 0 && selectedStyle && selectedSeed && agreed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // TODO: 백엔드 API로 온보딩 정보 전송 및 메인 페이지(/)로 이동
    console.log("온보딩 완료 데이터:", { nickname, selectedStyle, selectedSeed });
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
            여기망치에서 사용할 멋진 프로필을 완성해 주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. 닉네임 입력 */}
          <div>
            <label htmlFor="nickname" className="mb-2 block text-sm font-semibold text-gray-900">
              투자자 닉네임
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={10}
                className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0058FF] focus:outline-none focus:ring-1 focus:ring-[#0058FF] sm:text-sm"
                placeholder="예: 워렌버핏, 단타왕 (최대 10자)"
              />
              <button
                type="button"
                className="shrink-0 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none"
              >
                중복확인
              </button>
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
                  <span className="mb-2 text-2xl">{style.icon}</span>
                  <span className={`text-sm font-bold ${selectedStyle === style.id ? "text-[#0058FF]" : "text-gray-900"}`}>
                    {style.title}
                  </span>
                  <span className="mt-1 text-[11px] text-gray-500">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>


          {/* 3. 초기 시드머니 선택 */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-gray-900">
              초기 모의 투자금 선택
            </label>
            <div className="space-y-2">
              {SEED_MONEY_OPTIONS.map((seed) => (
                <button
                  key={seed.id}
                  type="button"
                  onClick={() => setSelectedSeed(seed.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 transition-all focus:outline-none ${
                    selectedSeed === seed.id
                      ? "border-[#0058FF] bg-blue-50 ring-1 ring-[#0058FF]"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className={`font-bold ${selectedSeed === seed.id ? "text-[#0058FF]" : "text-gray-900"}`}>
                    {seed.amount}
                  </span>
                  <span className={`text-sm ${selectedSeed === seed.id ? "text-blue-600" : "text-gray-500"}`}>
                    {seed.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. 약관 동의 및 제출 버튼 영역 */}
          <div className="pt-4">
            <label className="mb-6 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-[#0058FF] focus:ring-[#0058FF]"
              />
              <span className="text-sm text-gray-600">
                [필수] 여기망치 서비스 이용약관 및 개인정보 처리방침에 동의합니다.
              </span>
            </label>

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
    </div>
  );
}