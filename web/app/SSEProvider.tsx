"use client";

import { subscribeNotifications } from "@/lib/api/notifications";
import {
  dispatchNotificationSseBridgeEvent,
  FORWARDED_NOTIFICATION_EVENT_NAMES,
  type ForwardedNotificationEventName,
} from "@/lib/utils/notification-sse";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMockWalletStore } from "@/stores/useMockWalletStore";
import { getNotificationSseBridgeEventName } from "@/lib/utils/notification-sse";
import { ReactNode, useEffect } from "react";
import type {
  NotificationItem,
  NotificationStatusResponse,
} from "@/types/notification";

interface Props {
  children: ReactNode;
}

const NOTIFICATION_STATUS_EVENT_NAME = "STATUS";
const GROUPED_NOTIFICATION_UPDATED_EVENT_SUFFIX = "_UPDATED";
const NOTIFICATION_EVENT_NAMES = [
  "NOTIFICATION_CREATED",
  "ORDER_COMPLETED",
  "ORDER_CANCELED",
  "POST_COMMENT_CREATED",
  "REPLY_COMMENT_CREATED",
  "POST_LIKED",
  "REPLY_LIKED",
  "FOLLOW_CREATED",
  "NOTIFICATION_MOCK_ORDER_COMPLETED",
  "NOTIFICATION_TRADE_ORDER_COMPLETED",
  "NOTIFICATION_CONTEST_ORDER_COMPLETED",
  "NOTIFICATION_COMMUNITY_POST_COMMENT_CREATED",
  "NOTIFICATION_COMMUNITY_REPLY_COMMENT_CREATED",
  "NOTIFICATION_COMMUNITY_POST_LIKED",
  "NOTIFICATION_COMMUNITY_POST_LIKED_CREATED",
  "NOTIFICATION_COMMUNITY_POST_LIKED_UPDATED",
  "NOTIFICATION_COMMUNITY_REPLY_LIKED",
  "NOTIFICATION_COMMUNITY_REPLY_LIKED_CREATED",
  "NOTIFICATION_COMMUNITY_REPLY_LIKED_UPDATED",
  "NOTIFICATION_COMMUNITY_FOLLOW_CREATED",
  "NOTIFICATION_CONTEST_APPLICATION_APPROVED",
  "NOTIFICATION_CONTEST_APPLICATION_REJECTED",
  "CONTEST_APPLICATION_APPROVED",
  "CONTEST_APPLICATION_REJECTED",
  "CONTEST_APPROVED",
  "CONTEST_REJECTED",
];

export default function SSEProvider({ children }: Props) {
  const isLogin = useAuthStore((state) => state.user !== null);
  const user = useAuthStore((state) => state.user);
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved);
  const hasHydratedAuth = useAuthStore((state) => state.hasHydrated);

  const hydrateStatus = useNotificationStore((state) => state.hydrateStatus);
  const receiveNotification = useNotificationStore((state) => state.receiveNotification);
  const resetNotifications = useNotificationStore((state) => state.reset);

  useEffect(() => {
    if (!hasHydratedAuth || !isAuthResolved) {
      return;
    }

    if (!isLogin) {
      resetNotifications();
      return;
    }

    const handleIncomingNotification = (
      event: Event,
      sourceEventName?: string
    ) => {
      console.log(`[SSE Notification] Raw Event Name: ${sourceEventName || 'message'}`);
      
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        console.warn("[SSE Notification] Invalid event data", event);
        return;
      }

      try {
        const notification = JSON.parse(event.data) as NotificationItem;
        console.log("[SSE Notification] Parsed Notification Data:", notification);

        // 만약 sourceEventName이 없는데(onmessage) 데이터 내부에 타입이 있다면 이를 기반으로 처리
        const effectiveType = sourceEventName || notification.type;
        console.log(`[SSE Notification] Effective Type: ${effectiveType}`);

        if (
          sourceEventName?.endsWith(GROUPED_NOTIFICATION_UPDATED_EVENT_SUFFIX) &&
          !notification.lastEventAt
        ) {
          notification.lastEventAt = new Date().toISOString();
        }

        receiveNotification(notification);
      } catch (error) {
        console.error("알림 SSE 데이터 파싱 실패", error, event.data);
      }
    };

    console.log(`[SSE] Subscribing for Member ID: ${user?.memberId || 'Unknown'}`);
    const eventSource = subscribeNotifications();

    const handleStatusEvent = (event: Event) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        return;
      }

      try {
        const status = JSON.parse(event.data) as NotificationStatusResponse;
        console.log("[SSE Status] Received:", status);
        hydrateStatus(status);
      } catch (error) {
        console.error("알림 STATUS SSE 데이터 파싱 실패", error);
      }
    };

    const handleForwardedSseEvent = (
      eventName: ForwardedNotificationEventName,
      event: Event
    ) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        return;
      }

      dispatchNotificationSseBridgeEvent(eventName, event.data);
    };

    const forwardedSseListeners = FORWARDED_NOTIFICATION_EVENT_NAMES.map(
      (eventName) => ({
        eventName,
        listener: (event: Event) => {
          handleForwardedSseEvent(eventName, event);
        },
      })
    );
    const notificationEventListeners = NOTIFICATION_EVENT_NAMES.map(
      (eventName) => ({
        eventName,
        listener: (event: Event) => {
          handleIncomingNotification(event, eventName);
        },
      })
    );

    eventSource.addEventListener(NOTIFICATION_STATUS_EVENT_NAME, handleStatusEvent);

    eventSource.onmessage = (event) => {
      handleIncomingNotification(event);
    };

    notificationEventListeners.forEach(({ eventName, listener }) => {
      eventSource.addEventListener(eventName, listener);
    });

    forwardedSseListeners.forEach(({ eventName, listener }) => {
      eventSource.addEventListener(eventName, listener);
    });

    eventSource.onopen = () => {
      console.log("[SSE] Connection established successfully.");
    };

    eventSource.onerror = (error) => {
      console.error("[SSE] Connection error occurred:", error);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error("알림 SSE 연결이 종료되었습니다.");
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        console.warn("알림 SSE 연결을 재시도 중입니다...");
      }
    };

    // 🌟 모의투자 체결 시 전역 자산 정보(WalletStore) 리프레시
    const handleMockOrderCompleted = () => {
      const { ownerMemberId, loadMockWallet } = useMockWalletStore.getState();
      if (ownerMemberId) {
        console.log("Real-time Mock Trade Completed! Refreshing wallet...");
        void loadMockWallet(ownerMemberId, true);
      }
    };

    const mockOrderCompletedEvent = getNotificationSseBridgeEventName("NOTIFICATION_MOCK_ORDER_COMPLETED");
    window.addEventListener(mockOrderCompletedEvent, handleMockOrderCompleted);

    return () => {
      window.removeEventListener(mockOrderCompletedEvent, handleMockOrderCompleted);
      eventSource.onmessage = null;
      eventSource.removeEventListener(
        NOTIFICATION_STATUS_EVENT_NAME,
        handleStatusEvent
      );
      notificationEventListeners.forEach(({ eventName, listener }) => {
        eventSource.removeEventListener(eventName, listener);
      });
      forwardedSseListeners.forEach(({ eventName, listener }) => {
        eventSource.removeEventListener(eventName, listener);
      });
      eventSource.close();
    };
  }, [
    hasHydratedAuth,
    hydrateStatus,
    isAuthResolved,
    isLogin,
    receiveNotification,
    resetNotifications,
  ]);

  return children;
}
