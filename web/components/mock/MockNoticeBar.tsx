"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";

type AuthUser = NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;

export default function DemoNoticeBar() {
  const router = useRouter();

  const { isLogin, user, login, logout } = useAuthStore();
  const {
    isParticipated,
    usdtBalance,
    isLoadingPortfolio,
    syncWalletOwner,
    loadMockWallet,
    participateMock,
    resetMockWallet,
  } = useMockWalletStore();
  const currentMemberId = user?.memberId ?? null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const moveToLogin = () => {
    alert("모의투자를 시작하려면 로그인이 필요합니다.");
    router.push("/login");
  };

  const resolveAuthenticatedUser = useCallback(async (): Promise<AuthUser | null> => {
    if (isLogin && user) {
      return user;
    }

    try {
      const response = await fetch("http://localhost:8080/api/v1/member/me/info", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as AuthUser;
      login(data);
      syncWalletOwner(data.memberId);

      return data;
    } catch (error) {
      console.error("로그인 상태 확인 실패:", error);
      return null;
    }
  }, [isLogin, login, syncWalletOwner, user]);

  useEffect(() => {
    const bootstrapMockWallet = async () => {
      if (isLogin && currentMemberId !== null) {
        syncWalletOwner(currentMemberId);
        await loadMockWallet(currentMemberId, true);
        return;
      }

      const currentUser = await resolveAuthenticatedUser();

      if (!currentUser) {
        syncWalletOwner(null);
        return;
      }

      syncWalletOwner(currentUser.memberId);
      await loadMockWallet(currentUser.memberId, true);
    };

    void bootstrapMockWallet();
  }, [
    currentMemberId,
    isLogin,
    loadMockWallet,
    resolveAuthenticatedUser,
    syncWalletOwner,
  ]);

  const handleParticipate = async () => {
    if (isSubmitting || isLoadingPortfolio) {
      return;
    }

    setIsSubmitting(true);

    const currentUser = await resolveAuthenticatedUser();

    if (!currentUser) {
      logout();
      syncWalletOwner(null);
      setIsSubmitting(false);
      moveToLogin();
      return;
    }

    const result = await participateMock(currentUser.memberId);

    if (result.success) {
      alert("모의투자 계좌가 생성되고 10,000 USDT가 지급되었습니다.");
    } else if (result.status === "already_participated") {
      alert("이미 진행 중인 모의투자 계좌를 불러왔습니다.");
    } else if (result.status === "login_required") {
      logout();
      syncWalletOwner(null);
      moveToLogin();
    } else {
      alert(result.message || "모의투자 계좌 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    setIsSubmitting(false);
  };

  const handleReset = async () => {
    if (isResetting || isLoadingPortfolio) {
      return;
    }

    const isConfirmed = confirm(
      "모든 모의투자 내역을 정리하고 10,000 USDT로 다시 시작하시겠습니까?"
    );

    if (!isConfirmed) {
      return;
    }

    setIsResetting(true);

    const currentUser = await resolveAuthenticatedUser();

    if (!currentUser) {
      logout();
      syncWalletOwner(null);
      setIsResetting(false);
      moveToLogin();
      return;
    }

    const result = await resetMockWallet(currentUser.memberId);

    if (result.success) {
      alert("모의투자 계좌가 초기화되어 10,000 USDT로 다시 시작했습니다.");
    } else if (result.status === "login_required") {
      logout();
      syncWalletOwner(null);
      moveToLogin();
    } else {
      alert(result.message || "모의투자 초기화에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    setIsResetting(false);
  };

  return (
    <aside
      aria-label="모의투자 상태 안내 배너"
      className={`w-full px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 shrink-0 shadow-sm z-20 relative
        ${isParticipated ? "bg-gray-800 text-white" : "bg-[#8B5CF6] text-white"}
      `}
    >
      {/* ================== 좌측: 안내 문구 ================== */}
      <div className="flex items-center gap-2 text-sm font-bold text-center sm:text-left w-full sm:w-auto justify-center sm:justify-start">
        {isParticipated ? (
          <>
            <span aria-hidden="true" className="text-lg">🚨</span>
            <p>
              현재 <span className="text-yellow-300 font-black">모의투자(연습)</span> 모드로 접속 중입니다. 실제 자산이 소모되지 않습니다.
            </p>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-lg animate-bounce">💡</span>
            <p>요기망치 모의투자에 오신 것을 환영합니다! 초기 자금을 받고 투자를 연습해 보세요.</p>
          </>
        )}
      </div>

      {/* ================== 우측: 컨트롤 버튼들 ================== */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end shrink-0">
        
        {isParticipated ? (
          /* 지갑이 있을 때: 잔고 표시 & 초기화 버튼 */
          <div className="flex items-center gap-2">
            <div 
              aria-label={`현재 모의 잔고는 ${usdtBalance.toLocaleString()} 테더입니다`}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700"
            >
              <span className="text-gray-300">잔고:</span>
              <strong className="text-[#00C087] font-black">{usdtBalance.toLocaleString()}</strong>
              <span className="text-gray-400 text-[10px] sm:text-xs">YD</span>
            </div>
            
            <button
              onClick={handleReset}
              aria-label="모의투자 지갑 초기화 및 재도전"
              disabled={isResetting || isLoadingPortfolio}
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors group disabled:cursor-not-allowed disabled:opacity-60"
              title="재도전(초기화)"
            >
              <span className="block transition-transform group-hover:rotate-180">
                {isResetting ? "…" : "🔄"}
              </span>
            </button>
          </div>
        ) : (
          /* 지갑이 없을 때: 지원금 받기 버튼 */
          <button
            onClick={handleParticipate}
            aria-label="초기 지원금 1만 테더 받기"
            disabled={isSubmitting || isLoadingPortfolio}
            className="shrink-0 px-4 py-1.5 bg-white text-[#8B5CF6] text-sm font-black rounded-full shadow-sm hover:bg-purple-50 hover:scale-105 transition-all active:scale-95 flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            <span>🎁</span>
            {isLoadingPortfolio
              ? "계좌 확인 중..."
              : isSubmitting
                ? "처리 중..."
                : "10,000 USDT 받기"}
          </button>
        )}

        {/* 구분선 (PC에서만 보임) */}
        <div className="w-px h-4 bg-white/20 hidden sm:block mx-1"></div>

        {/* 실전 탈출구 */}
        <button
          onClick={() => router.push('/trading')} 
          aria-label="실전 트레이딩 페이지로 이동"
          className="shrink-0 text-[11px] sm:text-xs font-bold opacity-70 hover:opacity-100 underline underline-offset-2 transition-opacity flex items-center gap-1"
        >
          ⚔️ 실전 입장
        </button>

      </div>
    </aside>
  );
}
