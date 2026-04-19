"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import PolicyModal from "@/components/PolicyModal";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

type InlineFeedbackProps = {
  tone?: "success" | "error";
  message?: string;
  reserveTopMargin?: boolean;
};

function InlineFeedback({
  tone = "error",
  message,
  reserveTopMargin = false,
}: InlineFeedbackProps) {
  const Icon = tone === "success" ? CheckCircle2 : CircleAlert;

  return (
    <div className={`${reserveTopMargin ? "mt-2" : ""} min-h-5`}>
      {message ? (
        <p
          className={`flex items-center gap-1.5 text-xs font-bold ${
            tone === "success" ? "text-blue-600" : "text-red-500"
          }`}
        >
          <Icon size={14} strokeWidth={2.4} />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? ""; // 백엔드에서 넘겨주는 소셜로그인 토큰
  const { alert, toast } = useFeedback();

  const [nickname, setNickname] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [nicknameFeedback, setNicknameFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [termsFeedback, setTermsFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //닉네임 중복체크(false 가입 불가)
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | null>(null);

  // 닉네임 입력값이 변하면 다시 중복체크 하도록
  useEffect(() => {
    setIsNicknameChecked(false);
    setNicknameFeedback(null);
  }, [nickname]);

  useEffect(() => {
    if (termsAgreed && privacyAgreed) {
      setTermsFeedback("");
    }
  }, [privacyAgreed, termsAgreed]);

  // 닉네임 유효성 검사 (백엔드 정규식과 동일)
  const validateNickname = (name: string) => {
    const regex = /^[가-힣a-zA-Z0-9]{2,12}$/;
    return regex.test(name);
  };

  // 닉네임 중복 확인 함수
  const handleCheckDuplication = async () => {
    if (!validateNickname(nickname)) {
      setIsNicknameChecked(false);
      setNicknameFeedback({
        tone: "error",
        message: "닉네임은 공백 없는 한글, 영문, 숫자만 사용 가능하며 2~12자여야 합니다.",
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/v1/member/nickname/duplication?nickname=${encodeURIComponent(nickname)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("서버 통신 오류");

      const data = await response.json();
      
      if (data.available === true || data === true) { 
        setIsNicknameChecked(true);
        setNicknameFeedback({
          tone: "success",
          message: "사용 가능한 닉네임입니다.",
        });
      } else {
        setIsNicknameChecked(false);
        setNicknameFeedback({
          tone: "error",
          message: "이미 사용 중인 닉네임입니다.",
        });
      }
    } catch (error) {
      console.error("중복체크 에러:", error);
      setNicknameFeedback(null);
      await alert("중복 확인 중 오류가 발생했습니다.");
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      setIsNicknameChecked(false);
      setNicknameFeedback({
        tone: "error",
        message: "닉네임을 입력해 주세요.",
      });
      return;
    }

    if (!validateNickname(nickname)) {
      setIsNicknameChecked(false);
      setNicknameFeedback({
        tone: "error",
        message: "닉네임은 공백 없는 한글, 영문, 숫자만 사용 가능하며 2~12자여야 합니다.",
      });
      return;
    }

    if (!isNicknameChecked) {
      setNicknameFeedback({
        tone: "error",
        message: "닉네임 중복확인이 필요합니다.",
      });
      return;
    }

    if (!termsAgreed || !privacyAgreed) {
      setTermsFeedback("필수 약관에 동의해 주세요.");
      toast({
        title: "필수 약관에 동의해 주세요.",
        tone: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("http://localhost:8080/api/v1/auth/signup", {
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
        await alert(errorBody?.message ?? "회원가입 실패");
        return;
      }

      console.log("온보딩 완료 데이터 전송 성공!");
      toast({ title: "회원가입이 완료되었습니다.", tone: "success" });
      router.push("/signup/benefits"); // 가입 완료 후 메인 페이지로 이동
    } catch (error) {
      console.error("API 전송 에러:", error);
      await alert("서버와 통신하는 중 문제가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <div className="flex justify-center mb-2">
          <Link href="/" aria-label="메인 페이지로 이동">
            <Logo className="h-10"/>
          </Link>
        </div>
        {/* 헤더 영역 */}
        <div className="mb-10 text-center">
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
                maxLength={11}
                placeholder="2~12자 (한글,영문,숫자)"
              />
              <Button 
                type="button" 
                variant={isNicknameChecked ? "gray" : "sky"} 
                className="shrink-0 w-28 rounded-2xl font-bold"
                onClick={handleCheckDuplication}
              >
                {isNicknameChecked ? "확인 완료" : "중복 확인"}
              </Button>
            </div>
            <InlineFeedback
              tone={nicknameFeedback?.tone}
              message={nicknameFeedback?.message}
              reserveTopMargin
            />
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
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    [필수] 요기망치 서비스 이용약관 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal("terms")}
                  className="text-xs font-medium text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors cursor-pointer"
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
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    [필수] 개인정보 수집 및 이용 동의
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveModal("privacy")}
                  className="text-xs font-medium text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  보기
                </button>
              </div>

            </div>

            <div className="mb-4">
              <InlineFeedback message={termsFeedback} />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "가입 처리 중..." : "회원가입 완료"}
            </Button>
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
