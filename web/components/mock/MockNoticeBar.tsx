"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { useTickerStore } from "@/stores/useTickerStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useRequireLogin } from "@/hooks/useWithAuth";

type AuthUser = NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>;

const formatQuoteBalance = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function DemoNoticeBar() {
  const { alert, confirm, toast } = useFeedback();
  const moveToLogin = useRequireLogin({ redirectMode: "push" });
  const router = useRouter();
  const selectedCoin = useTickerStore((state) => state.selectedCoin);
  const coinMetaList = useTickerStore((state) => state.coinMetaList);

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
  const selectedCoinMeta = coinMetaList.find((coin) => coin.symbol === selectedCoin);
  const quoteAssetName = selectedCoinMeta?.quoteAsset ?? coinMetaList[0]?.quoteAsset ?? "";
  const rewardLabel = quoteAssetName ? `10,000${quoteAssetName}` : "초기 지원금";
  const formattedBalance = formatQuoteBalance(usdtBalance);

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
      await moveToLogin();
      return;
    }

    const result = await participateMock(currentUser.memberId);

    if (result.success) {
      toast({
        title: "모의투자 계좌가 생성되었습니다.",
        description: quoteAssetName
          ? `${rewardLabel}가 지급되었습니다.`
          : "초기 지원금이 지급되었습니다.",
        tone: "success",
      });
    } else if (result.status === "already_participated") {
      toast({
        title: "이미 진행 중인 모의투자 계좌를 불러왔습니다.",
        tone: "info",
      });
    } else if (result.status === "login_required") {
      logout();
      syncWalletOwner(null);
      await moveToLogin();
    } else {
      await alert(
        result.message || "모의투자 계좌 생성에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
    }

    setIsSubmitting(false);
  };

  const handleReset = async () => {
    if (isResetting || isLoadingPortfolio) {
      return;
    }

    const isConfirmed = await confirm({
      description: quoteAssetName
        ? `모든 모의투자 내역을 정리하고 ${rewardLabel}로 다시 시작하시겠습니까?`
        : "모든 모의투자 내역을 정리하고 초기 지원금으로 다시 시작하시겠습니까?",
      confirmText: "초기화",
      tone: "danger",
    });

    if (!isConfirmed) {
      return;
    }

    setIsResetting(true);

    const currentUser = await resolveAuthenticatedUser();

    if (!currentUser) {
      logout();
      syncWalletOwner(null);
      setIsResetting(false);
      await moveToLogin();
      return;
    }

    const result = await resetMockWallet(currentUser.memberId);

    if (result.success) {
      toast({
        title: "모의투자 계좌를 초기화했습니다.",
        description: quoteAssetName
          ? `${rewardLabel}로 다시 시작합니다.`
          : "초기 지원금으로 다시 시작합니다.",
        tone: "success",
      });
    } else if (result.status === "login_required") {
      logout();
      syncWalletOwner(null);
      await moveToLogin();
    } else {
      await alert(
        result.message || "모의투자 초기화에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
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
            <TriangleAlert aria-hidden="true" className="h-5 w-5 shrink-0 text-yellow-300" />
            <p>
              현재 <span className="text-yellow-300 font-black">모의투자(연습)</span> 모드로 접속 중입니다. 실제 자산이 소모되지 않습니다.
            </p>
          </>
        ) : (
          <>
            <Lightbulb aria-hidden="true" className="h-5 w-5 shrink-0 text-yellow-200" />
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
              aria-label={
                quoteAssetName
                  ? `현재 모의 잔고는 ${formattedBalance} ${quoteAssetName}입니다`
                  : `현재 모의 잔고는 ${formattedBalance}입니다`
              }
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700"
            >
              <span className="text-gray-300">잔고:</span>
              <strong className="text-[#00C087] font-black">{formattedBalance}</strong>
              {quoteAssetName ? (
                <span className="text-gray-400 text-[10px] sm:text-xs">{quoteAssetName}</span>
              ) : null}
            </div>
            
            <button
              onClick={handleReset}
              aria-label="모의투자 지갑 초기화 및 재도전"
              disabled={isResetting || isLoadingPortfolio}
              className="shrink-0 text-[11px] sm:text-xs font-bold opacity-70 hover:opacity-100 underline underline-offset-2 transition-opacity flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-60"
              title="재도전(초기화)"
            >
              {isResetting ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              <span>재도전</span>
            </button>
          </div>
        ) : (
          /* 지갑이 없을 때: 지원금 받기 버튼 */
          <button
            onClick={handleParticipate}
            aria-label={quoteAssetName ? `초기 지원금 ${rewardLabel} 받기` : "초기 지원금 받기"}
            disabled={isSubmitting || isLoadingPortfolio}
            className="shrink-0 px-4 py-1.5 bg-white text-[#8B5CF6] text-sm font-black rounded-full shadow-sm hover:bg-purple-50 hover:scale-105 transition-all active:scale-95 flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
          >
            <Gift className="h-4 w-4" />
            {isLoadingPortfolio
              ? "계좌 확인 중..."
              : isSubmitting
                ? "처리 중..."
                : quoteAssetName
                  ? `${rewardLabel} 받기`
                  : "지원금 받기"}
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
          <TrendingUp className="h-3.5 w-3.5" />
          <span>실전 입장</span>
        </button>

      </div>
    </aside>
  );
}
