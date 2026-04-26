"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Check, CheckCheck, ChevronDown, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import { cn } from "@/lib/utils/cs";
import {
  checkNotifications,
  deleteAllNotifications,
  deleteSelectedNotifications,
  getNotifications,
  readNotification,
  readAllNotifications,
  readSelectedNotifications,
} from "@/lib/api/notifications";
import {
  getNotificationNavigationTarget,
  getNotificationListTabValue,
  type NotificationListTabValue,
} from "@/lib/utils/notification-navigation";
import {
  formatNotificationDescription,
  formatNotificationRelativeTime,
  formatNotificationTitle,
  getNotificationTradeMeta,
  getNotificationCategoryLabel,
} from "@/lib/utils/notification";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { NotificationItem } from "@/types/notification";
import { getNotificationTradeToneStyles } from "./notificationTradeTone";

const NOTIFICATIONS_PAGE_SIZE = 20;
const TAB_UNREAD_COUNT_PAGE_SIZE = 50;
const OTHER_NOTIFICATION_CATEGORIES = new Set(["FOLLOW", "REPORT"]);

type NotificationListState = {
  items: NotificationItem[];
  nextCursorId: number | null;
  hasNext: boolean;
};

type NotificationTabUnreadCounts = Record<NotificationListTabValue, number>;

const NOTIFICATION_TABS = [
  { label: "전체", value: "ALL" },
  { label: "모의투자", value: "MOCK" },
  { label: "트레이딩", value: "TRADE" },
  { label: "대회", value: "CONTEST" },
  { label: "커뮤니티", value: "COMMUNITY" },
  { label: "기타", value: "OTHER" },
] as const;

const initialNotificationListState: NotificationListState = {
  items: [],
  nextCursorId: null,
  hasNext: false,
};

const createEmptyTabUnreadCounts = (): NotificationTabUnreadCounts => ({
  ALL: 0,
  MOCK: 0,
  TRADE: 0,
  CONTEST: 0,
  COMMUNITY: 0,
  OTHER: 0,
});

const buildTabUnreadCounts = (
  notifications: NotificationItem[]
): NotificationTabUnreadCounts => {
  const counts = createEmptyTabUnreadCounts();

  notifications.forEach((notification) => {
    if (notification.isRead) {
      return;
    }

    counts.ALL += 1;
    counts[getNotificationListTabValue(notification.category)] += 1;
  });

  return counts;
};

const decreaseTabUnreadCounts = (
  currentCounts: NotificationTabUnreadCounts,
  notifications: NotificationItem[]
) => {
  if (notifications.length === 0) {
    return currentCounts;
  }

  const nextCounts = { ...currentCounts };

  notifications.forEach((notification) => {
    if (notification.isRead) {
      return;
    }

    nextCounts.ALL = Math.max(0, nextCounts.ALL - 1);

    const targetTab = getNotificationListTabValue(notification.category);

    nextCounts[targetTab] = Math.max(0, nextCounts[targetTab] - 1);
  });

  return nextCounts;
};

const formatUnreadCount = (count: number) => {
  return count > 99 ? "99+" : String(count);
};

const hasAnyUnreadCounts = (counts: NotificationTabUnreadCounts) => {
  return Object.values(counts).some((count) => count > 0);
};

const isNotificationListTabValue = (
  value: string | null
): value is NotificationListTabValue => {
  return NOTIFICATION_TABS.some((tab) => tab.value === value);
};

const getNotificationCategoryFilter = (tab: NotificationListTabValue) => {
  if (tab === "ALL" || tab === "OTHER") {
    return undefined;
  }

  return tab;
};

const filterNotificationsByTab = (
  notifications: NotificationItem[],
  activeTab: NotificationListTabValue
) => {
  if (activeTab === "ALL") {
    return notifications;
  }

  if (activeTab === "OTHER") {
    return notifications.filter((notification) =>
      OTHER_NOTIFICATION_CATEGORIES.has(notification.category)
    );
  }

  return notifications.filter((notification) => notification.category === activeTab);
};

export default function NotificationsPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = useAuthStore((state) => state.isLogin);
  const newCount = useNotificationStore((state) => state.newCount);
  const markChecked = useNotificationStore((state) => state.markChecked);
  const markNotificationsAsRead = useNotificationStore(
    (state) => state.markNotificationsAsRead
  );
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const removeNotificationsFromStore = useNotificationStore(
    (state) => state.removeNotifications
  );
  const removeAllNotificationsFromStore = useNotificationStore(
    (state) => state.removeAllNotifications
  );

  const [notificationListState, setNotificationListState] = useState<NotificationListState>(
    initialNotificationListState
  );
  const [tabUnreadCounts, setTabUnreadCounts] = useState<NotificationTabUnreadCounts>(
    createEmptyTabUnreadCounts
  );
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<number[]>([]);
  const [highlightedNotificationId, setHighlightedNotificationId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReadingSelected, setIsReadingSelected] = useState(false);
  const [isReadingAll, setIsReadingAll] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [readingNotificationIds, setReadingNotificationIds] = useState<number[]>([]);
  const hasCheckedNewBadgeRef = useRef(false);
  const tabParam = searchParams.get("tab");
  const focusParam = searchParams.get("focus");
  const activeTab: NotificationListTabValue = isNotificationListTabValue(tabParam)
    ? tabParam
    : "ALL";
  const focusNotificationId =
    focusParam && Number.isFinite(Number(focusParam))
      ? Number(focusParam)
      : null;
  const hasFocusNotificationId = focusNotificationId !== null;

  const notifications = useMemo(
    () => filterNotificationsByTab(notificationListState.items, activeTab),
    [activeTab, notificationListState.items]
  );

  const notificationTabs = useMemo(
    () =>
      NOTIFICATION_TABS.map((tab) => {
        const unreadCount = tabUnreadCounts[tab.value];

        return {
          value: tab.value,
          label: (
            <span className="inline-flex items-center justify-center gap-1.5">
              <span>{tab.label}</span>
              {unreadCount > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0058FF]/10 px-1.5 text-[10px] font-bold tabular-nums text-[#0058FF] dark:bg-[#3B82F6]/15 dark:text-[#60A5FA]">
                  {formatUnreadCount(unreadCount)}
                </span>
              ) : null}
            </span>
          ),
        };
      }),
    [tabUnreadCounts]
  );

  useEffect(() => {
    if (!isLogin) {
      setTabUnreadCounts(createEmptyTabUnreadCounts());
      return;
    }

    let isActive = true;

    const loadTabUnreadCounts = async () => {
      try {
        let cursorId: number | undefined;
        let hasNext = true;
        const unreadNotifications: NotificationItem[] = [];

        while (hasNext) {
          const response = await getNotifications({
            cursorId,
            size: TAB_UNREAD_COUNT_PAGE_SIZE,
            read: false,
          });

          unreadNotifications.push(...response.content);
          cursorId = response.nextCursorId ?? undefined;
          hasNext = response.hasNext && response.nextCursorId !== null;
        }

        if (!isActive) {
          return;
        }

        setTabUnreadCounts(buildTabUnreadCounts(unreadNotifications));
      } catch (error) {
        console.error("알림 탭 카운트 조회 실패", error);
      }
    };

    void loadTabUnreadCounts();

    return () => {
      isActive = false;
    };
  }, [isLogin]);

  useEffect(() => {
    if (!isLogin || hasAnyUnreadCounts(tabUnreadCounts)) {
      return;
    }

    const fallbackCounts = buildTabUnreadCounts(notificationListState.items);

    if (!hasAnyUnreadCounts(fallbackCounts)) {
      return;
    }

    setTabUnreadCounts(fallbackCounts);
  }, [isLogin, notificationListState.items, tabUnreadCounts]);

  useEffect(() => {
    if (!isLogin) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadNotifications = async () => {
      setIsLoading(true);
      setSelectedNotificationIds([]);

      try {
        const initialResponse = await getNotifications({
          size: NOTIFICATIONS_PAGE_SIZE,
          category: getNotificationCategoryFilter(activeTab),
        });

        let mergedItems = [...initialResponse.content];
        let nextCursorId = initialResponse.nextCursorId;
        let hasNext = initialResponse.hasNext;

        while (
          hasFocusNotificationId &&
          !mergedItems.some(
            (notification) => notification.notificationId === focusNotificationId
          ) &&
          hasNext &&
          nextCursorId !== null
        ) {
          const nextResponse = await getNotifications({
            cursorId: nextCursorId,
            size: NOTIFICATIONS_PAGE_SIZE,
            category: getNotificationCategoryFilter(activeTab),
          });

          mergedItems = [...mergedItems, ...nextResponse.content];
          nextCursorId = nextResponse.nextCursorId;
          hasNext = nextResponse.hasNext;
        }

        if (!isActive) {
          return;
        }

        setNotificationListState({
          items: mergedItems,
          nextCursorId,
          hasNext,
        });
      } catch (error) {
        console.error("알림 목록 조회 실패", error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isActive = false;
    };
  }, [activeTab, focusNotificationId, hasFocusNotificationId, isLogin]);

  useEffect(() => {
    if (!isLogin || hasCheckedNewBadgeRef.current || newCount === 0) {
      return;
    }

    hasCheckedNewBadgeRef.current = true;

    let isActive = true;

    const markNotificationsAsChecked = async () => {
      try {
        await checkNotifications();

        if (isActive) {
          markChecked();
        }
      } catch (error) {
        console.error("알림 확인 처리 실패", error);
      }
    };

    void markNotificationsAsChecked();

    return () => {
      isActive = false;
    };
  }, [isLogin, markChecked, newCount]);

  useEffect(() => {
    if (!hasFocusNotificationId) {
      setHighlightedNotificationId(null);
      return;
    }

    const targetExists = notifications.some(
      (notification) => notification.notificationId === focusNotificationId
    );

    if (!targetExists) {
      setHighlightedNotificationId(null);
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const element = document.getElementById(`notification-${focusNotificationId}`);

      if (!element) {
        return;
      }

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setHighlightedNotificationId(focusNotificationId);
    });

    const timeout = window.setTimeout(() => {
      setHighlightedNotificationId(null);
    }, 2000);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
    };
  }, [focusNotificationId, hasFocusNotificationId, notifications]);

  const handleLoadMore = async () => {
    if (
      !notificationListState.hasNext ||
      notificationListState.nextCursorId === null ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await getNotifications({
        cursorId: notificationListState.nextCursorId,
        size: NOTIFICATIONS_PAGE_SIZE,
        category: getNotificationCategoryFilter(activeTab),
      });

      setNotificationListState((prev) => ({
        items: [...prev.items, ...response.content],
        nextCursorId: response.nextCursorId,
        hasNext: response.hasNext,
      }));
    } catch (error) {
      console.error("알림 추가 조회 실패", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleNotificationSelection = (notificationId: number) => {
    setSelectedNotificationIds((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotificationIds.length === notifications.length) {
      setSelectedNotificationIds([]);
    } else {
      setSelectedNotificationIds(
        notifications.map((n) => n.notificationId)
      );
    }
  };

  const unreadSelectedNotificationIds = notifications
    .filter(
      (notification) =>
        selectedNotificationIds.includes(notification.notificationId) &&
        !notification.isRead
    )
    .map((notification) => notification.notificationId);
  const unreadSelectedNotifications = notifications.filter(
    (notification) =>
      unreadSelectedNotificationIds.includes(notification.notificationId) &&
      !notification.isRead
  );

  const handleReadSelected = async () => {
    if (isReadingSelected || unreadSelectedNotificationIds.length === 0) {
      return;
    }

    setIsReadingSelected(true);

    try {
      await readSelectedNotifications(unreadSelectedNotificationIds);

      setNotificationListState((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          unreadSelectedNotificationIds.includes(item.notificationId)
            ? {
                ...item,
                isRead: true,
              }
            : item
        ),
      }));
      setTabUnreadCounts((prev) =>
        decreaseTabUnreadCounts(prev, unreadSelectedNotifications)
      );
      markNotificationsAsRead(unreadSelectedNotificationIds);
      setSelectedNotificationIds((prev) =>
        prev.filter((id) => !unreadSelectedNotificationIds.includes(id))
      );
    } catch (error) {
      console.error("알림 선택 읽음 처리 실패", error);
    } finally {
      setIsReadingSelected(false);
    }
  };

  const handleReadAll = async () => {
    if (
      isReadingAll ||
      tabUnreadCounts.ALL === 0
    ) {
      return;
    }

    setIsReadingAll(true);

    try {
      await readAllNotifications();
      setNotificationListState((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({
          ...item,
          isRead: true,
        })),
      }));
      setTabUnreadCounts(createEmptyTabUnreadCounts());
      markAllAsRead();
      setSelectedNotificationIds([]);
    } catch (error) {
      console.error("알림 전체 읽음 처리 실패", error);
    } finally {
      setIsReadingAll(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (isDeletingSelected || selectedNotificationIds.length === 0) {
      return;
    }

    const unreadDeletedNotifications = notifications.filter(
      (notification) =>
        selectedNotificationIds.includes(notification.notificationId) &&
        !notification.isRead
    );

    setIsDeletingSelected(true);

    try {
      await deleteSelectedNotifications(selectedNotificationIds);

      setNotificationListState((prev) => ({
        ...prev,
        items: prev.items.filter(
          (item) => !selectedNotificationIds.includes(item.notificationId)
        ),
      }));
      setTabUnreadCounts((prev) =>
        decreaseTabUnreadCounts(prev, unreadDeletedNotifications)
      );
      removeNotificationsFromStore(selectedNotificationIds);
      setSelectedNotificationIds([]);
    } catch (error) {
      console.error("알림 선택 삭제 실패", error);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleDeleteAll = async () => {
    if (isDeletingAll || notifications.length === 0) {
      return;
    }

    setIsDeletingAll(true);

    try {
      await deleteAllNotifications();

      setNotificationListState(initialNotificationListState);
      setTabUnreadCounts(createEmptyTabUnreadCounts());
      removeAllNotificationsFromStore();
      setSelectedNotificationIds([]);
    } catch (error) {
      console.error("알림 전체 삭제 실패", error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const moveToNotificationTarget = (notification: NotificationItem) => {
    const navigationTarget = getNotificationNavigationTarget(notification);

    if (!navigationTarget) {
      return;
    }

    const move = () => {
      router.push(navigationTarget.href);
    };

    if (notification.isRead || readingNotificationIds.includes(notification.notificationId)) {
      move();
      return;
    }

    setReadingNotificationIds((prev) => [...prev, notification.notificationId]);
    setNotificationListState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.notificationId === notification.notificationId
          ? {
              ...item,
              isRead: true,
            }
          : item
      ),
    }));
    setTabUnreadCounts((prev) => decreaseTabUnreadCounts(prev, [notification]));
    markNotificationsAsRead([notification.notificationId]);
    move();

    void readNotification(notification.notificationId)
      .catch((error) => {
        console.error("알림 단건 읽음 처리 실패", error);
      })
      .finally(() => {
        setReadingNotificationIds((prev) =>
          prev.filter((id) => id !== notification.notificationId)
        );
      });
  };

  const handleChangeTab = (value: string) => {
    const nextTab = isNotificationListTabValue(value) ? value : "ALL";
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTab);
    nextParams.delete("focus");

    router.replace(`/notifications?${nextParams.toString()}`, { scroll: false });
  };

  if (!isLogin) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card px-6 py-14 text-center">
          <p className="text-center text-base font-semibold text-gray-900 dark:text-white">
            로그인 후 전체 알림을 확인할 수 있습니다.
          </p>
          <div className="mt-6 flex justify-center">
            <Button type="button" size="sm" onClick={() => router.push("/login")}>
              로그인하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasUnreadNotifications = tabUnreadCounts.ALL > 0;
  const isAllSelected =
    notifications.length > 0 &&
    selectedNotificationIds.length === notifications.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-left text-2xl font-black tracking-tight text-gray-900 dark:text-white ">
          알림
        </h1>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={notificationTabs}
        activeTab={activeTab}
        onChange={handleChangeTab}
        fullWidth={false}
      />

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Select All */}
        <div className="flex items-center gap-2">
          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                  isAllSelected
                    ? "border-[#0058FF] bg-[#0058FF]"
                    : "border-gray-300 dark:border-zinc-600"
                )}
              >
                {isAllSelected ? (
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                ) : null}
              </div>
              전체선택
            </button>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <ActionButton
            onClick={handleReadSelected}
            disabled={unreadSelectedNotificationIds.length === 0 || isReadingSelected}
            icon={<Check className="h-3.5 w-3.5" strokeWidth={2.2} />}
            label={isReadingSelected ? "처리 중..." : "선택읽음"}
          />
          <ActionButton
            onClick={() => void handleReadAll()}
            disabled={!hasUnreadNotifications || isReadingAll}
            icon={<CheckCheck className="h-3.5 w-3.5" strokeWidth={2.2} />}
            label={isReadingAll ? "처리 중..." : "전체읽음"}
          />
          <div className="mx-1 h-3.5 w-px bg-gray-200 dark:bg-zinc-700" />
          <ActionButton
            onClick={() => void handleDeleteSelected()}
            disabled={selectedNotificationIds.length === 0 || isDeletingSelected}
            icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />}
            label={isDeletingSelected ? "삭제 중..." : "선택삭제"}
            variant="danger"
          />
          <ActionButton
            onClick={() => void handleDeleteAll()}
            disabled={notifications.length === 0 || isDeletingAll}
            icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />}
            label={isDeletingAll ? "삭제 중..." : "전체삭제"}
            variant="danger"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? <NotificationsPageSkeleton /> : null}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800/80">
            <Bell className="h-7 w-7 text-gray-300 dark:text-zinc-600" strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-[15px] font-semibold text-gray-500 dark:text-gray-400">
            도착한 알림이 없습니다
          </p>
          <p className="mt-1.5 text-[13px] leading-[20px] text-gray-400 dark:text-gray-500">
            새로운 알림이 도착하면 이 페이지에서 확인할 수 있어요.
          </p>
        </div>
      ) : null}

      {/* Notification List */}
      {!isLoading && notifications.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {notifications.map((notification, index) => (
            <NotificationsPageItem
              key={notification.notificationId}
              notification={notification}
              isHighlighted={highlightedNotificationId === notification.notificationId}
              isSelected={selectedNotificationIds.includes(notification.notificationId)}
              isLast={index === notifications.length - 1}
              onMove={moveToNotificationTarget}
              onToggleSelection={handleToggleNotificationSelection}
            />
          ))}
        </div>
      ) : null}

      {/* Load More */}
      {notificationListState.hasNext ? (
        <div className="flex justify-center pb-4">
          <button
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={isLoadingMore}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-[13px] font-semibold text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
          >
            {isLoadingMore ? (
              "불러오는 중..."
            ) : (
              <>
                이전 알림 더 보기
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Action Button ─── */
function ActionButton({
  onClick,
  disabled,
  icon,
  label,
  variant = "default",
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "danger"
          ? "text-red-400 hover:bg-red-50 hover:text-red-500 dark:text-red-400/80 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-zinc-800 dark:hover:text-gray-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Notification Item ─── */
function NotificationsPageItem({
  notification,
  isHighlighted,
  isSelected,
  isLast,
  onMove,
  onToggleSelection,
}: {
  notification: NotificationItem;
  isHighlighted: boolean;
  isSelected: boolean;
  isLast: boolean;
  onMove: (notification: NotificationItem) => void;
  onToggleSelection: (notificationId: number) => void;
}) {
  const title = formatNotificationTitle(notification);
  const description = formatNotificationDescription(notification);
  const categoryLabel = getNotificationCategoryLabel(notification.category);
  const timeLabel = formatNotificationRelativeTime(notification.createdAt);
  const navigationTarget = getNotificationNavigationTarget(notification);
  const { sideLabel, tone } = getNotificationTradeMeta(notification);
  const toneStyles = getNotificationTradeToneStyles(tone);

  const isUnread = !notification.isRead;

  const handleCardClick = () => {
    if (!navigationTarget) {
      return;
    }

    onMove(notification);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!navigationTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMove(notification);
    }
  };

  return (
    <div
      id={`notification-${notification.notificationId}`}
      className={cn(
        "group relative transition-all duration-300",
        !isLast && "border-b border-gray-50 dark:border-zinc-800/60",
        isHighlighted && "bg-[#0058FF]/[0.06] dark:bg-[#0058FF]/[0.08]"
      )}
    >
      {/* Unread left accent */}
      {isUnread ? (
        <div className={cn("absolute left-0 top-0 h-full w-[3px]", toneStyles.accent)} />
      ) : null}

      <div
        className={cn(
          "flex items-start gap-4 px-5 py-4",
          isUnread && toneStyles.unreadSurface
        )}
      >
        {/* Checkbox */}
        <label
          className="mt-0.5 flex shrink-0 cursor-pointer items-center"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className={cn(
              "flex h-[18px] w-[18px] items-center justify-center rounded border-[1.5px] transition-all",
              isSelected
                ? "border-[#0058FF] bg-[#0058FF]"
                : "border-gray-300 hover:border-gray-400 dark:border-zinc-600 dark:hover:border-zinc-500"
            )}
            onClick={() => onToggleSelection(notification.notificationId)}
          >
            {isSelected ? (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            ) : null}
          </div>
        </label>

        {/* Content */}
        <div
          role={navigationTarget ? "button" : undefined}
          tabIndex={navigationTarget ? 0 : undefined}
          onClick={handleCardClick}
          onKeyDown={handleCardKeyDown}
          className={cn(
            "min-w-0 flex-1",
            navigationTarget && "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-2">
            {/* Unread dot */}
            {isUnread ? (
              <div className={cn("h-[6px] w-[6px] shrink-0 rounded-full", toneStyles.dot)} />
            ) : null}

            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                isUnread
                  ? "bg-[#0058FF]/10 text-[#0058FF] dark:bg-[#3B82F6]/15 dark:text-[#60A5FA]"
                  : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500"
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

            <span className="ml-auto shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-gray-600">
              {timeLabel}
            </span>
          </div>

          <h2
            className={cn(
              "mt-2 text-left text-[14px] leading-[22px]",
              isUnread
                ? "font-bold text-gray-900 dark:text-white"
                : "font-medium text-gray-500 dark:text-gray-400"
            )}
          >
            {title}
          </h2>

          {description ? (
            <p className="mt-1 text-left text-[12px] leading-[18px] text-gray-400 dark:text-gray-500">
              {description}
            </p>
          ) : null}

          {navigationTarget ? (
            <p className="mt-2 text-left text-[12px] font-semibold text-[#0058FF] opacity-0 transition-opacity group-hover:opacity-100 dark:text-[#60A5FA]">
              {navigationTarget.label} →
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function NotificationsPageSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-4 px-5 py-4",
            index < 4 && "border-b border-gray-50 dark:border-zinc-800/60"
          )}
        >
          <div className="mt-0.5 h-[18px] w-[18px] shrink-0 animate-pulse rounded border border-gray-200 dark:border-zinc-700" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-[18px] w-14 animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800" />
              <div className="ml-auto h-3 w-12 animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800" />
            </div>
            <div className="h-[18px] w-4/5 animate-pulse rounded-md bg-gray-100 dark:bg-zinc-800" />
            <div className="h-3 w-1/3 animate-pulse rounded-md bg-gray-50 dark:bg-zinc-800/50" />
          </div>
        </div>
      ))}
    </div>
  );
}
