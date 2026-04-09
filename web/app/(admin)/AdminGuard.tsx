"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

// /admin 하위 페이지 진입 전에 실제 서버 기준으로 ADMIN 권한을 다시 확인하는 가드입니다.
export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 로컬 스토어만 믿지 않고 /member/me/info로 현재 로그인/권한 상태를 재검증합니다.
    const checkAdmin = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
          method: "GET",
          credentials: "include",
        });

        // 인증이 없거나 서버에서 권한 확인에 실패하면 관리자 영역 접근을 막습니다.
        if (!response.ok) {
          logout();
          router.replace(response.status === 401 ? "/login" : "/");
          return;
        }

        const data = await response.json();
        login(data);

        // 로그인은 되어 있어도 ADMIN이 아니면 일반 서비스 메인으로 돌려보냅니다.
        if (data.role !== "ADMIN") {
          router.replace("/");
          return;
        }
      } catch {
        // 네트워크 오류 등으로 권한 확인 자체가 안 되면 로그인부터 다시 유도합니다.
        logout();
        router.replace("/login");
        return;
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    void checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [login, logout, router]);

  // 서버 재검증이 끝나기 전에는 관리자 영역을 잠깐 숨겨 둡니다.
  if (isChecking) {
    return <div className="p-8 text-sm font-bold">관리자 권한 확인 중...</div>;
  }

  // 가드에서 걸러진 경우 관리자 레이아웃이 렌더되지 않도록 null 처리합니다.
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  // ADMIN 확인이 끝난 경우에만 실제 관리자 화면을 렌더합니다.
  return <>{children}</>;
}
