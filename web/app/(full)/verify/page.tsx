"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Info } from "lucide-react";
import AddressSearchModal from "@/components/AddressSearchModal";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  completeMemberVerification,
  getMyMemberInfo,
  getOAuthEmail,
  sendEmailVerificationCode,
  verifyEmailVerificationCode,
} from "@/lib/api/member";
import { FetchClientError } from "@/lib/api/client";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/utils/phone";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { useAuthStore } from "@/stores/useAuthStore";

const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof FetchClientError) {
    return error.userMessage || fallbackMessage;
  }

  return fallbackMessage;
};

const logUnexpectedApiError = (label: string, error: unknown) => {
  if (error instanceof FetchClientError && error.status < 500) {
    return;
  }

  console.error(label, error);
};

export default function VerifyDetailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm font-bold text-gray-400 animate-pulse">불러오는 중...</div>}>
      <VerifyDetailContent />
    </Suspense>
  );
}

function VerifyDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const { alert, toast } = useFeedback();
  const sendCodeTimeoutRef = useRef<number | null>(null);

  const [phone, setPhone] = useState("");
  const [oauthEmail, setOauthEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [zonecode, setZonecode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const source = searchParams.get("source");
  const successRedirectPath = source === "benefits" ? "/" : "/me";

  useEffect(() => {
    let isMounted = true;

    const loadOAuthEmail = async () => {
      try {
        const response = await getOAuthEmail();

        if (isMounted) {
          setOauthEmail(response.email);
        }
      } catch (error) {
        console.error("소셜 이메일 조회 실패:", error);
        await alert("로그인이 필요하거나 이메일 정보를 불러올 수 없습니다.");
        router.push("/login");
      } finally {
        if (isMounted) {
          setIsLoadingEmail(false);
        }
      }
    };

    void loadOAuthEmail();

    return () => {
      isMounted = false;
    };
  }, [alert, router]);

  const handleAddressSelect = (
    selectedZipcode: string,
    selectedAddress: string
  ) => {
    setZonecode(selectedZipcode);
    setAddress(selectedAddress);
    setDetailAddress("");
  };

  const clearSendCodeTimeout = () => {
    if (sendCodeTimeoutRef.current !== null) {
      window.clearTimeout(sendCodeTimeoutRef.current);
      sendCodeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const handleEmailSent = (event: Event) => {
      const detail =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : "";

      clearSendCodeTimeout();
      setIsSendingCode(false);
      setIsEmailCodeSent(true);
      setIsEmailVerified(false);
      setEmailCode("");
      toast({
        title: detail || "이메일이 발송되었습니다.",
        tone: "success",
      });
    };

    const handleEmailSendFailed = (event: Event) => {
      const detail =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : "";

      clearSendCodeTimeout();
      setIsSendingCode(false);
      toast({
        title: detail || "이메일 발송에 실패했습니다. 다시 시도해 주세요.",
        tone: "error",
      });
    };

    window.addEventListener(
      getNotificationSseBridgeEventName("EMAIL_SENT"),
      handleEmailSent
    );
    window.addEventListener(
      getNotificationSseBridgeEventName("EMAIL_SEND_FAILED"),
      handleEmailSendFailed
    );

    return () => {
      clearSendCodeTimeout();
      window.removeEventListener(
        getNotificationSseBridgeEventName("EMAIL_SENT"),
        handleEmailSent
      );
      window.removeEventListener(
        getNotificationSseBridgeEventName("EMAIL_SEND_FAILED"),
        handleEmailSendFailed
      );
    };
  }, [toast]);

  const handleSendCode = async () => {
    if (!oauthEmail) {
      await alert("인증에 사용할 이메일 정보를 확인할 수 없습니다.");
      return;
    }

    try {
      setIsSendingCode(true);
      clearSendCodeTimeout();
      await sendEmailVerificationCode(oauthEmail);
      sendCodeTimeoutRef.current = window.setTimeout(() => {
        setIsSendingCode(false);
        toast({
          title: "응답 시간이 초과되었습니다. 다시 시도해 주세요.",
          tone: "error",
        });
      }, 30000);
    } catch (error) {
      logUnexpectedApiError("이메일 인증코드 발송 실패:", error);
      clearSendCodeTimeout();
      setIsSendingCode(false);
      toast({
        title: getApiErrorMessage(
          error,
          "인증코드 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."
        ),
        tone: "error",
      });
    } finally {
    }
  };

  const handleVerifyCode = async () => {
    if (!oauthEmail) {
      await alert("인증에 사용할 이메일 정보를 확인할 수 없습니다.");
      return;
    }

    const trimmedCode = emailCode.trim();

    if (trimmedCode.length !== 6) {
      await alert("인증코드 6자리를 입력해 주세요.");
      return;
    }

    try {
      setIsVerifyingCode(true);
      await verifyEmailVerificationCode(oauthEmail, trimmedCode);
      setIsEmailVerified(true);
      toast({
        title: "이메일 인증이 완료되었습니다.",
        tone: "success",
      });
    } catch (error) {
      logUnexpectedApiError("이메일 인증 실패:", error);
      setIsEmailVerified(false);
      await alert(
        getApiErrorMessage(
          error,
          "인증코드가 올바르지 않거나 만료되었습니다."
        )
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneNumber(phone);

    if (!/^\d{10,11}$/.test(normalizedPhone)) {
      await alert("휴대폰 번호는 숫자 10~11자리로 입력해 주세요.");
      return;
    }

    if (!isEmailVerified) {
      await alert("이메일 인증을 완료해 주세요.");
      return;
    }

    if (!zonecode || !address) {
      await alert("주소를 입력해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      await completeMemberVerification({
        phoneNumber: normalizedPhone,
        addressCode: zonecode,
        address1: address,
        address2: detailAddress.trim() || undefined,
      });

      window.sessionStorage.setItem("needs-auth-sync", "1");

      try {
        const memberInfo = await getMyMemberInfo();
        login(memberInfo);
      } catch (error) {
        logUnexpectedApiError("인증 완료 후 회원 정보 동기화 실패:", error);
      }

      toast({
        title: "인증 회원 전환이 완료되었습니다.",
        tone: "success",
      });
      router.push(successRedirectPath);
    } catch (error) {
      logUnexpectedApiError("인증 회원 전환 실패:", error);
      await alert(
        getApiErrorMessage(
          error,
          "인증 회원 전환에 실패했습니다. 잠시 후 다시 시도해 주세요."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-10 flex justify-center">
          <Link href="/" aria-label="메인 페이지로 이동">
            <Logo className="h-10" />
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            인증 회원 전환
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              휴대폰 번호
            </label>
            <Input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
              maxLength={13}
              placeholder="숫자만 입력해 주세요"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              이메일 인증
            </label>
            <div className="mb-2 flex gap-2">
              <Input
                type="email"
                value={oauthEmail}
                readOnly
                disabled={isLoadingEmail}
                placeholder="소셜 로그인 이메일을 불러오는 중입니다"
              />
              <Button
                type="button"
                variant="white"
                onClick={handleSendCode}
                disabled={isLoadingEmail || isSendingCode || isEmailVerified}
              >
                {isSendingCode
                  ? "발송 중"
                  : isEmailCodeSent
                    ? "재전송"
                    : "인증코드 받기"}
              </Button>
            </div>

            {isEmailCodeSent && !isEmailVerified ? (
              <div className="mt-2 flex gap-2">
                <Input
                  type="text"
                  value={emailCode}
                  onChange={(e) =>
                    setEmailCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  maxLength={6}
                  placeholder="인증코드 6자리 입력"
                />
                <Button
                  type="button"
                  variant="white"
                  onClick={handleVerifyCode}
                  disabled={isVerifyingCode}
                >
                  {isVerifyingCode ? "확인 중" : "확인"}
                </Button>
              </div>
            ) : null}

            {isEmailVerified ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                이메일 인증이 완료되었습니다.
              </p>
            ) : (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Info className="h-3.5 w-3.5 shrink-0" />
                소셜 로그인에 사용한 이메일로 인증코드가 발송됩니다.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              주소
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input type="text" value={zonecode} readOnly placeholder="우편번호" />
                <Button
                  type="button"
                  variant="gray"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  우편번호 찾기
                </Button>
              </div>
              <Input
                type="text"
                value={address}
                readOnly
                placeholder="기본 주소"
              />
              <Input
                type="text"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                disabled={!zonecode}
                placeholder="상세 주소를 입력해 주세요 (선택)"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              size="lg"
              fullWidth
              disabled={isSubmitting || isLoadingEmail}
            >
              {isSubmitting ? "처리 중..." : "인증 회원 등록 완료"}
            </Button>
          </div>
        </form>
      </div>

      <AddressSearchModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onComplete={handleAddressSelect}
      />
    </div>
  );
}
