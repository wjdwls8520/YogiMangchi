"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PolicyModal from "@/components/PolicyModal";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? ""; // 백엔드에서 넘겨주는 소셜로그인 토큰

  const [nickname, setNickname] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);
  
  // 필수 항목 3가지가 모두 채워져야 버튼 활성화
  const isFormValid = nickname.trim().length > 0 && termsAgreed && privacyAgreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      // 변경된 기획에 맞춘 간결한 데이터 전송
      const response = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          signup_token: token,
          nickname: nickname,
          term_agree: termsAgreed,
          private_agree: privacyAgreed,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        alert(errorBody?.message ?? "회원가입 실패");
        return;
      }

      console.log("온보딩 완료 데이터 전송 성공!");
      router.push("/"); // 가입 완료 후 메인 페이지로 이동
    } catch (error) {
      console.error("API 전송 에러:", error);
      alert("서버와 통신하는 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10">

        {/* 헤더 영역 */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            환영합니다!
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            요기망치에서 사용할 닉네임을 설정해 주세요.
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
                placeholder="예: 워렌버핏 (최대 10자)"
              />
              <Button type="button" variant="gray">중복확인</Button>
            </div>
          </div>

          {/* 2. 약관 동의 및 제출 버튼 영역 */}
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
                  onClick={() => setActiveModal("terms")}
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
                  onClick={() => setActiveModal("privacy")}
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
              회원가입 완료하기
            </button>
          </div>

        </form>
      </div>

      <PolicyModal
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />

    </div>
  );
}