"use client";

import {
  getNotifications,
  getNotificationStatus,
  subscribeNotifications,
} from "@/lib/api/notifications";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ReactNode, useEffect } from "react";
import type { NotificationItem } from "@/types/notification";

interface Props {
  children: ReactNode;
}

const NOTIFICATION_POLL_INTERVAL_MS = 5000;
const NOTIFICATION_POLL_SIZE = 10;
const NOTIFICATION_EVENT_NAMES = [
  "NOTIFICATION_CREATED",
  "ORDER_COMPLETED",
  "ORDER_CANCELED",
  "POST_COMMENT_CREATED",
  "REPLY_COMMENT_CREATED",
  "POST_LIKED",
  "REPLY_LIKED",
  "FOLLOW_CREATED",
];

export default function SSEProvider({ children }: Props) {
  const isLogin = useAuthStore((state) => state.isLogin);
  const hydrateStatus = useNotificationStore((state) => state.hydrateStatus);
  const syncLatestNotifications = useNotificationStore(
    (state) => state.syncLatestNotifications
  );
  const receiveNotification = useNotificationStore((state) => state.receiveNotification);
  const resetNotifications = useNotificationStore((state) => state.reset);

  useEffect(() => {
    if (!isLogin) {
      resetNotifications();
      return;
    }

    const eventSource = subscribeNotifications();
    let isMounted = true;
    let intervalId: number | null = null;
    let hasBootstrappedNotifications = false;

    const refreshStatus = async () => {
      try {
        const status = await getNotificationStatus();

        if (isMounted) {
          hydrateStatus(status);
        }
      } catch (error) {
        console.error("알림 상태 조회 실패", error);
      }
    };

    const syncLatestFromList = async (treatNewAsLive: boolean) => {
      try {
        const latestResponse = await getNotifications({
          size: NOTIFICATION_POLL_SIZE,
        });

        if (!isMounted) {
          return;
        }

        syncLatestNotifications(latestResponse, { treatNewAsLive });
      } catch (error) {
        console.error("최신 알림 목록 동기화 실패", error);
      }
    };

    const bootstrapNotifications = async () => {
      await refreshStatus();
      await syncLatestFromList(false);
      hasBootstrappedNotifications = true;
    };

    const handleWindowFocus = () => {
      if (!hasBootstrappedNotifications) {
        return;
      }

      void syncLatestFromList(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasBootstrappedNotifications) {
        void syncLatestFromList(true);
      }
    };

    const handleIncomingNotification = (event: Event) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        return;
      }

      try {
        const notification = JSON.parse(event.data) as NotificationItem;
        receiveNotification(notification);
      } catch (error) {
        console.error("알림 SSE 데이터 파싱 실패", error);
      }
    };

    void bootstrapNotifications();
    intervalId = window.setInterval(() => {
      if (!hasBootstrappedNotifications) {
        return;
      }

      void syncLatestFromList(true);
    }, NOTIFICATION_POLL_INTERVAL_MS);

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    eventSource.onmessage = (event) => {
      handleIncomingNotification(event);
    };

    NOTIFICATION_EVENT_NAMES.forEach((eventName) => {
      eventSource.addEventListener(eventName, handleIncomingNotification);
    });

    eventSource.onerror = (error) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error("알림 SSE 연결이 종료되었습니다.", error);
      }
    };

    return () => {
      isMounted = false;
      hasBootstrappedNotifications = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      eventSource.onmessage = null;
      NOTIFICATION_EVENT_NAMES.forEach((eventName) => {
        eventSource.removeEventListener(eventName, handleIncomingNotification);
      });
      eventSource.close();
    };
  }, [
    hydrateStatus,
    isLogin,
    receiveNotification,
    resetNotifications,
    syncLatestNotifications,
  ]);

  return children;
}
