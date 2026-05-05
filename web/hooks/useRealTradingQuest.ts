"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuestStore } from "@/stores/useQuestStore";
import { fetchTradeHistories } from "@/lib/api/trade";
import { getFuturesOrders } from "@/lib/api/futures";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";

/**
 * 본투자 해금 퀘스트 상태를 관리하고 실시간으로 동기화하는 훅
 */
export function useRealTradingQuest() {
  const isLogin = useAuthStore((s) => s.isLogin);
  const user = useAuthStore((s) => s.user);
  
  const { 
    updateQuestStatus, 
    setIsLoading,
    practiceOrderCount,
    isVerified,
    isUnlocked 
  } = useQuestStore();

  const syncQuestStatus = useCallback(async () => {
    if (!isLogin) return;

    setIsLoading(true);
    try {
      // 1. 인증 상태 확인 (Store 정보 활용)
      const verified = user?.role === "VERIFIED_USER" || user?.role === "ADMIN";

      // 2. 모의투자 횟수 확인 (최근 10건 가져와서 개수 체크)
      let count = 0;
      try {
        const tradeHistories = await fetchTradeHistories({
          assetType: "MOCK",
          size: 10,
        });
        count = Math.min(tradeHistories.content.length, 3);
      } catch (error: any) {
        // 계좌가 없어서 발생하는 400 에러 등은 0회로 간주
        count = 0;
      }

      // 3. 지갑 상태 확인 (본투자 선물 주문 조회 시도)
      let unlocked = false;
      try {
        await getFuturesOrders({ size: 1 });
        unlocked = true; // 에러가 안 나면 해금된 상태
      } catch (error: any) {
        // 404 에러면 미해금 상태
        if (error?.status === 404 || error?.message?.includes("지갑이 없습니다")) {
          unlocked = false;
        } else {
          // 다른 에러면 일단 기존 상태 유지하거나 해금된 것으로 간주 (API 서버 일시적 오류 등)
          unlocked = verified && count >= 3;
        }
      }

      updateQuestStatus({
        isVerified: verified,
        practiceOrderCount: count,
        isUnlocked: unlocked,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to sync quest status:", error);
      setIsLoading(false);
    }
  }, [isLogin, user, updateQuestStatus, setIsLoading]);

  // 초기 로드
  useEffect(() => {
    void syncQuestStatus();
  }, [syncQuestStatus]);

  // SSE 실시간 동기화
  useEffect(() => {
    // 모의투자 체결 시
    const mockOrderEvent = getNotificationSseBridgeEventName("NOTIFICATION_MOCK_ORDER_COMPLETED");
    // 본투자 체결 시 (해금 확인용)
    const tradeOrderEvent = getNotificationSseBridgeEventName("NOTIFICATION_TRADE_ORDER_COMPLETED");

    const handleUpdate = () => {
      console.log("Quest event received, syncing...");
      void syncQuestStatus();
    };

    window.addEventListener(mockOrderEvent, handleUpdate);
    window.addEventListener(tradeOrderEvent, handleUpdate);
    
    return () => {
      window.removeEventListener(mockOrderEvent, handleUpdate);
      window.removeEventListener(tradeOrderEvent, handleUpdate);
    };
  }, [syncQuestStatus]);

  return {
    practiceOrderCount,
    isVerified,
    isUnlocked,
    syncQuestStatus,
  };
}
