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
    <div className="flex items-center gap-3 text-sm">
      {isParticipated ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-l border-white/5 px-3">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                모의 잔고
              </p>
              <p className="mt-0.5 text-xs font-black tabular-nums text-emerald-400">
                {formattedBalance} {quoteAssetName && <span className="text-[10px] text-gray-500">{quoteAssetName}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting || isLoadingPortfolio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors disabled:opacity-50"
            title="초기 지원금으로 재도전"
          >
            {isResetting ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            재도전
          </button>
        </div>
      ) : (
        <button
          onClick={handleParticipate}
          disabled={isSubmitting || isLoadingPortfolio}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <Gift className="h-3.5 w-3.5" />
          {isLoadingPortfolio
            ? "확인 중..."
            : isSubmitting
              ? "처리 중..."
              : quoteAssetName
                ? `${rewardLabel} 받기`
                : "지원금 받기"}
        </button>
      )}

      {/* 실전 탈출구 */}
      <div className="border-l border-white/5 pl-3">
        <button
          onClick={() => router.push('/trading')} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-colors"
        >
          <TrendingUp className="h-3 w-3" />
          실전 입장
        </button>
      </div>
    </div>
  );
}
