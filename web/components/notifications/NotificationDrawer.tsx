"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cs";
import {
  getNotificationActivityTime,
  getNotificationActivityValue,
  formatNotificationCount,
  formatNotificationDescription,
  formatNotificationRelativeTime,
  formatNotificationTitle,
  getNotificationTradeMeta,
  getNotificationCategoryLabel,
  isCommentNotification,
  sortNotificationsByNewestActivity,
} from "@/lib/utils/notification";
import { getNotificationTradeToneStyles } from "./notificationTradeTone";
import type { NotificationItem } from "@/types/notification";
import { Bell, ChevronRight, CornerDownRight, RefreshCcw, X } from "lucide-react";

interface NotificationDrawerProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  isReadingAll: boolean;
  isLoadingMore: boolean;
  hasNext: boolean;
  onClose: () => void;
  onMoveListPage: () => void;
  onMoveNotification: (notification: NotificationItem) => void;
  onAcknowledgeNewNotifications: () => void;
  onReadAll: () => void;
  onLoadMore: () => void;
}

const mergeNotificationsByNewest = (...groups: NotificationItem[][]) => {
  const merged = new Map<number, NotificationItem>();

  groups.flat().forEach((notification) => {
    merged.set(notification.notificationId, notification);
  });

  return sortNotificationsByNewestActivity(Array.from(merged.values()));
};

export default function NotificationDrawer({
  notifications,
  isLoading,
  isReadingAll,
  isLoadingMore,
  hasNext,
  onClose,
  onMoveListPage,
  onMoveNotification,
  onAcknowledgeNewNotifications,
  onReadAll,
  onLoadMore,
}: NotificationDrawerProps) {
  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.isRead
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const revealHighlightTimeoutRef = useRef<number | null>(null);
  const hasStartedBufferingRef = useRef(false);
  const [pendingNotifications, setPendingNotifications] = useState<NotificationItem[]>([]);
  const [highlightedNotificationIds, setHighlightedNotificationIds] = useState<number[]>([]);
  const pendingNotificationsRef = useRef<NotificationItem[]>([]);
  const previousNotificationsRef = useRef<NotificationItem[]>([]);
  const visibleNotifications = notifications.filter(
    (notification) =>
      !notification.isRead &&
      !pendingNotifications.some(
        (pendingNotification) =>
          pendingNotification.notificationId === notification.notificationId
      )
  );

  useEffect(() => {
    pendingNotificationsRef.current = pendingNotifications;
  }, [pendingNotifications]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!hasStartedBufferingRef.current) {
      hasStartedBufferingRef.current = true;
      previousNotificationsRef.current = notifications;
      return;
    }

    const previousNotificationMap = new Map(
      previousNotificationsRef.current.map((notification) => [
        notification.notificationId,
        notification,
      ])
    );
    const pendingNotificationMap = new Map(
      pendingNotificationsRef.current.map((notification) => [
        notification.notificationId,
        notification,
      ])
    );
    const leadingPendingNotifications: NotificationItem[] = [];

    for (const notification of notifications) {
      const previousNotification = previousNotificationMap.get(
        notification.notificationId
      );
      const pendingNotification = pendingNotificationMap.get(
        notification.notificationId
      );
      const knownActivityTime = Math.max(
        previousNotification
          ? getNotificationActivityTime(previousNotification)
          : Number.NEGATIVE_INFINITY,
        pendingNotification
          ? getNotificationActivityTime(pendingNotification)
          : Number.NEGATIVE_INFINITY
      );

      if (knownActivityTime >= getNotificationActivityTime(notification)) {
        break;
      }

      leadingPendingNotifications.push(notification);
    }

    const nextPendingNotifications = mergeNotificationsByNewest(
      pendingNotificationsRef.current,
      leadingPendingNotifications
    );

    previousNotificationsRef.current = notifications;
    setPendingNotifications(nextPendingNotifications);
  }, [isLoading, notifications]);

  useEffect(() => {
    return () => {
      if (revealHighlightTimeoutRef.current !== null) {
        window.clearTimeout(revealHighlightTimeoutRef.current);
      }
    };
  }, [notifications]);

  const handleRevealPendingNotifications = () => {
    if (pendingNotifications.length === 0) {
      return;
    }

    const pendingNotificationIds = pendingNotifications.map(
      (notification) => notification.notificationId
    );

    setPendingNotifications([]);
    setHighlightedNotificationIds(pendingNotificationIds);
    onAcknowledgeNewNotifications();

    if (revealHighlightTimeoutRef.current !== null) {
      window.clearTimeout(revealHighlightTimeoutRef.current);
    }

    revealHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedNotificationIds([]);
      revealHighlightTimeoutRef.current = null;
    }, 2000);

    window.requestAnimationFrame(() => {
      scrollContainerRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  };

  const pendingNotificationCount = pendingNotifications.length;

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-left text-[17px] font-extrabold tracking-tight text-gray-900 dark:text-white">
              알림
            </h2>
          </div>

          {pendingNotificationCount > 0 ? (
            <button
              type="button"
              onClick={handleRevealPendingNotifications}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0058FF]/10 px-3 text-center text-[12px] font-bold text-[#0058FF] transition-colors hover:bg-[#0058FF]/15 dark:bg-[#3B82F6]/15 dark:text-[#60A5FA] dark:hover:bg-[#3B82F6]/20"
            >
              <span>{`새로운 알림 ${formatNotificationCount(
                pendingNotificationCount
              )}건이 있습니다`}</span>
              <RefreshCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-zinc-800 dark:hover:text-gray-300"
          aria-label="알림 패널 닫기"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => onMoveListPage()}
          className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 transition-colors hover:text-[#0058FF] dark:text-gray-400 dark:hover:text-[#3B82F6]"
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={onReadAll}
          disabled={!hasUnreadNotifications || isReadingAll}
          className="text-[12px] font-semibold text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:text-gray-300"
        >
          {isReadingAll ? "처리 중..." : "모두 읽음"}
        </button>
      </div>

      {/* Notification List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isLoading ? <NotificationListSkeleton /> : null}

        {!isLoading &&
        visibleNotifications.length === 0 &&
        pendingNotificationCount === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800/80">
              <Bell className="h-6 w-6 text-gray-300 dark:text-zinc-600" strokeWidth={1.8} />
            </div>
            <p className="mt-4 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
              아직 알림이 없습니다
            </p>
            <p className="mt-1.5 text-[12px] leading-[18px] text-gray-400 dark:text-gray-500">
              새로운 알림이 도착하면 여기에서
              <br />
              바로 확인할 수 있어요.
            </p>
          </div>
        ) : null}

        {!isLoading ? (
          <ul>
            {visibleNotifications.map((notification) => (
              <NotificationListItem
                key={notification.notificationId}
                notification={notification}
                isHighlighted={highlightedNotificationIds.includes(
                  notification.notificationId
                )}
                onMoveNotification={onMoveNotification}
              />
            ))}
          </ul>
        ) : null}
      </div>

      {/* Load More */}
      {hasNext ? (
        <div className="border-t border-gray-100 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex h-9 w-full items-center justify-center rounded-xl text-[12px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-zinc-800"
          >
            {isLoadingMore ? "불러오는 중..." : "이전 알림 더 보기"}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function NotificationListItem({
  notification,
  isHighlighted,
  onMoveNotification,
}: {
  notification: NotificationItem;
  isHighlighted: boolean;
  onMoveNotification: (notification: NotificationItem) => void;
}) {
  const title = formatNotificationTitle(notification);
  const description = formatNotificationDescription(notification);
  const categoryLabel = getNotificationCategoryLabel(notification.category);
  const timeLabel = formatNotificationRelativeTime(
    getNotificationActivityValue(notification)
  );
  const { sideLabel, tone } = getNotificationTradeMeta(notification);
  const toneStyles = getNotificationTradeToneStyles(tone);
  const shouldShowCommentIcon = isCommentNotification(notification);

  const isUnread = !notification.isRead;

  return (
    <li
      className={cn(
        "relative border-b border-gray-50 last:border-b-0 transition-colors duration-300 dark:border-zinc-800/60",
        isHighlighted ? toneStyles.highlightSurface : isUnread && toneStyles.unreadSurface
      )}
    >
      <button
        type="button"
        onClick={() => onMoveNotification(notification)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-800/40"
        aria-label={`${title} 알림으로 이동`}
      >
        {/* Unread Indicator */}
        <div className="mt-[7px] flex shrink-0">
          <div
            className={cn(
              "h-[7px] w-[7px] rounded-full transition-colors",
              isUnread ? toneStyles.dot : "bg-transparent"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  isUnread
                    ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    : "bg-gray-50 text-gray-400 dark:bg-zinc-900 dark:text-gray-600"
                )}
              >
                {categoryLabel}
              </span>

              {sideLabel ? (
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide",
                    toneStyles.badge
                  )}
                >
                  {sideLabel}
                </span>
              ) : null}
            </div>

            {timeLabel ? (
              <span className="ml-auto shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-600">
                {timeLabel}
              </span>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-2 text-left text-[13px] leading-[20px]",
              isUnread
                ? "font-bold text-gray-900 dark:text-white"
                : "font-medium text-gray-500 dark:text-gray-400"
            )}
          >
            {title}
          </p>

          {description ? (
            <div className="mt-1 flex items-start gap-1.5 text-left text-[12px] leading-[18px] text-gray-400 dark:text-gray-500">
              {shouldShowCommentIcon ? (
                <CornerDownRight
                  className="mt-[2px] h-3.5 w-3.5 shrink-0"
                  strokeWidth={2}
                />
              ) : null}
              <span className="min-w-0">{description}</span>
            </div>
          ) : null}
        </div>
      </button>
    </li>
  );
}

function NotificationListSkeleton() {
  return (
    <div className="px-5 py-4">
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl px-0 py-3"
          >
            <div className="mt-[7px] h-[7px] w-[7px] shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
            <div className="flex-1 space-y-2">
              <div className="h-[18px] w-14 animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800" />
              <div className="h-4 w-full animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800" />
              <div className="h-3 w-2/3 animate-pulse rounded-md bg-gray-50 dark:bg-zinc-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
