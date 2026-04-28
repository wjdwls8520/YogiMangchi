"use client";

import { subscribeNotifications } from "@/lib/api/notifications";
import {
  dispatchNotificationSseBridgeEvent,
  FORWARDED_NOTIFICATION_EVENT_NAMES,
  type ForwardedNotificationEventName,
} from "@/lib/utils/notification-sse";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useAuthStore } from "@/stores/useAuthStore";
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
];

export default function SSEProvider({ children }: Props) {
  const isLogin = useAuthStore((state) => state.isLogin);
  const hasHydratedAuth = useAuthStore((state) => state.hasHydrated);
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved);
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

    const eventSource = subscribeNotifications();

    const handleIncomingNotification = (
      event: Event,
      sourceEventName?: string
    ) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        return;
      }

      try {
        const notification = JSON.parse(event.data) as NotificationItem;

        if (
          sourceEventName?.endsWith(GROUPED_NOTIFICATION_UPDATED_EVENT_SUFFIX) &&
          !notification.lastEventAt
        ) {
          notification.lastEventAt = new Date().toISOString();
        }

        receiveNotification(notification);
      } catch (error) {
        console.error("알림 SSE 데이터 파싱 실패", error);
      }
    };

    const handleStatusEvent = (event: Event) => {
      if (!(event instanceof MessageEvent) || typeof event.data !== "string") {
        return;
      }

      try {
        const status = JSON.parse(event.data) as NotificationStatusResponse;
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

    eventSource.onerror = (error) => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error("알림 SSE 연결이 종료되었습니다.", error);
      }
    };

    return () => {
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
