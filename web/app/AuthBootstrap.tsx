"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/*
  앱이 시작될 때 클라이언트에 저장된 로그인 상태와
  서버 세션 상태를 한 번 동기화하는 초기화 컴포넌트입니다.
  Header 같은 공통 UI가 직접 인증 요청을 보내지 않도록 이 파일에서 처리합니다.
*/
const AUTH_SYNC_FLAG = "needs-auth-sync";

// 앱 시작 시 저장된 로그인 상태를 기준으로 서버 세션을 1회 동기화합니다.
export default function AuthBootstrap() {
  const isLogin = useAuthStore((state) => state.isLogin);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setAuthResolved = useAuthStore((state) => state.setAuthResolved);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const needsAuthSync = window.sessionStorage.getItem(AUTH_SYNC_FLAG) === "1";

    if (!isLogin && !needsAuthSync) {
      setAuthResolved(true);
      return;
    }

    let isMounted = true;
    setAuthResolved(false);

    const syncAuth = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        window.sessionStorage.removeItem(AUTH_SYNC_FLAG);

        if (!response.ok) {
          if (isMounted) {
            logout();
          }
          return;
        }

        const data = await response.json();

        if (isMounted) {
          login(data);
        }
      } catch {
        window.sessionStorage.removeItem(AUTH_SYNC_FLAG);
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setAuthResolved(true);
        }
      }
    };

    void syncAuth();

    return () => {
      isMounted = false;
    };
  }, [hasHydrated, isLogin, login, logout, setAuthResolved]);

  return null;
}
