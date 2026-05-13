"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useConfirmDialog } from "@/components/ui/FeedbackProvider";
import { useRouter } from "next/navigation";

// 로그인 유도 문구와 버튼은 여기서 단일하게 관리합니다.
const LOGIN_REQUIRED_CONFIRM_OPTIONS = {
  description: `로그인이 필요한 서비스입니다.
로그인 페이지로 이동하시겠습니까?`,
  confirmText: "로그인 하기",
  cancelText: "취소",
} as const;

// 본인인증 유도 문구와 버튼은 여기서 단일하게 관리합니다.
const VERIFICATION_REQUIRED_CONFIRM_OPTIONS = {
  description: `본인인증이 필요한 서비스입니다.
본인인증 페이지로 이동하시겠습니까?`,
  confirmText: "본인인증 하기",
  cancelText: "취소",
} as const;

type RequireLoginOptions = {
  redirectPath?: string;
  redirectMode?: "push" | "replace";
};

type RequireVerificationOptions = {
  redirectPath?: string;
  redirectMode?: "push" | "replace";
};

// 현재 액션이 로그인 상태를 요구할 때 공통 프롬프트와 이동을 처리합니다.
export const useRequireLogin = ({
  redirectPath = "/login",
  redirectMode = "replace",
}: RequireLoginOptions = {}) => {
  const router = useRouter();
  const confirm = useConfirmDialog();

  return useCallback(async () => {
    const { isLogin } = useAuthStore.getState();

    if (isLogin) {
      return true;
    }

    const goLogin = await confirm(LOGIN_REQUIRED_CONFIRM_OPTIONS);

    if (goLogin) {
      if (redirectMode === "push") {
        router.push(redirectPath);
      } else {
        router.replace(redirectPath);
      }
    }

    return false;
  }, [confirm, redirectMode, redirectPath, router]);
};

// 현재 액션이 본인인증 상태를 요구할 때 공통 프롬프트와 이동을 처리합니다.
export const useRequireVerification = ({
  redirectPath = "/verify",
  redirectMode = "push",
}: RequireVerificationOptions = {}) => {
  const router = useRouter();
  const confirm = useConfirmDialog();

  return useCallback(async () => {
    const { user } = useAuthStore.getState();

    if (!user || user.role !== "USER") {
      return true;
    }

    const shouldVerify = await confirm(VERIFICATION_REQUIRED_CONFIRM_OPTIONS);

    if (shouldVerify) {
      if (redirectMode === "push") {
        router.push(redirectPath);
      } else {
        router.replace(redirectPath);
      }
    }

    return false;
  }, [confirm, redirectMode, redirectPath, router]);
};

// 로그인과 본인인증이 모두 필요한 액션에 공통 가드를 제공합니다.
export const useRequireVerifiedUser = ({
  loginRedirectPath = "/login",
  loginRedirectMode = "replace",
  verifyRedirectPath = "/verify",
  verifyRedirectMode = "push",
}: {
  loginRedirectPath?: string;
  loginRedirectMode?: "push" | "replace";
  verifyRedirectPath?: string;
  verifyRedirectMode?: "push" | "replace";
} = {}) => {
  const requireLogin = useRequireLogin({
    redirectPath: loginRedirectPath,
    redirectMode: loginRedirectMode,
  });
  const requireVerification = useRequireVerification({
    redirectPath: verifyRedirectPath,
    redirectMode: verifyRedirectMode,
  });

  return useCallback(async () => {
    const { isLogin, user } = useAuthStore.getState();

    if (!isLogin || !user) {
      return requireLogin();
    }

    if (user.role === "USER") {
      return requireVerification();
    }

    return true;
  }, [requireLogin, requireVerification]);
};

// 기존 콜백 실행 흐름에 로그인 확인을 감싸는 래퍼 훅입니다.
export const useWithAuth = (options?: RequireLoginOptions) => {
  const requireLogin = useRequireLogin(options);

  return useCallback(
    (callback: () => void | Promise<void>) => {
      return async () => {
        const isAuthenticated = await requireLogin();

        if (!isAuthenticated) {
          return;
        }

        await callback();
      };
    },
    [requireLogin]
  );
};
