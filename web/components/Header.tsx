"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { useUIStore } from "@/stores/useUIStore";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NavMenu from "./NavMenu";
import Dim from "./Dim";
import Logo from "./ui/Logo";
import NotificationDrawer from "./notifications/NotificationDrawer";
import NotificationToastStack from "./notifications/NotificationToastStack";
import {
  Bell,
  Moon,
  Settings,
  Sun,
  Menu,
  UserRound,
  Wallet,
} from "lucide-react";
import MenuLayer from "./ui/MenuLayer";
import {
  checkNotifications,
  getNotifications,
  readNotification,
  readAllNotifications,
} from "@/lib/api/notifications";
import {
  getNotificationListPageHref,
  getNotificationNavigationTarget,
} from "@/lib/utils/notification-navigation";
import { formatNotificationCount } from "@/lib/utils/notification";
import type { NotificationItem } from "@/types/notification";

const NOTIFICATION_PAGE_SIZE = 10;

export default function Header() {
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);
  const alarmPanelRef = useRef<HTMLDivElement | null>(null);
  const alarmTriggerRef = useRef<HTMLButtonElement | null>(null);
  const isLogin = useAuthStore((state) => state.isLogin);
  const user = useAuthStore((state) => state.user);
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode);

  const notifications = useNotificationStore((state) => state.items);
  const newCount = useNotificationStore((state) => state.newCount);
  const nextCursorId = useNotificationStore((state) => state.nextCursorId);
  const hasNext = useNotificationStore((state) => state.hasNext);
  const liveToasts = useNotificationStore((state) => state.liveToasts);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);
  const appendNotifications = useNotificationStore((state) => state.appendNotifications);
  const markChecked = useNotificationStore((state) => state.markChecked);
  const markNotificationsAsRead = useNotificationStore(
    (state) => state.markNotificationsAsRead
  );
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  const [isOpen, setIsOpen] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [isAlarmMounted, setIsAlarmMounted] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isReadingAllNotifications, setIsReadingAllNotifications] = useState(false);
  const [isLoadingMoreNotifications, setIsLoadingMoreNotifications] = useState(false);
  const [readingNotificationIds, setReadingNotificationIds] = useState<number[]>([]);
  const [headerHeight, setHeaderHeight] = useState(72);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isMenuMounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAlarmMounted, isMenuMounted]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1100) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const headerElement = headerRef.current;

    if (!headerElement) {
      return;
    }

    const syncHeaderHeight = () => {
      setHeaderHeight(headerElement.getBoundingClientRect().height);
    };

    syncHeaderHeight();

    const resizeObserver = new ResizeObserver(() => {
      syncHeaderHeight();
    });

    resizeObserver.observe(headerElement);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (isOpen || !isMenuMounted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsMenuMounted(false);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isMenuMounted, isOpen]);

  useEffect(() => {
    if (isAlarmOpen || !isAlarmMounted) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsAlarmMounted(false);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isAlarmMounted, isAlarmOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isAlarmOpen) {
        setIsAlarmOpen(false);
      }

      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (!isAlarmMounted && !isMenuMounted) {
      return;
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAlarmMounted, isAlarmOpen, isMenuMounted, isOpen]);

  useEffect(() => {
    if (!isLogin) {
      setIsLoadingNotifications(false);
      setIsLoadingMoreNotifications(false);
      setIsAlarmOpen(false);
      setIsAlarmMounted(false);
    }
  }, [isLogin]);

  useEffect(() => {
    if (!isAlarmOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const clickedInsidePanel = alarmPanelRef.current?.contains(target);
      const clickedTrigger = alarmTriggerRef.current?.contains(target);

      if (clickedInsidePanel || clickedTrigger) {
        return;
      }

      closeAlarm();
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAlarmOpen]);

  const openMobileMenu = () => {
    setIsMenuMounted(true);
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  const closeAlarm = () => {
    setIsAlarmOpen(false);
  };

  const refreshNotifications = async () => {
    if (isLoadingNotifications) {
      return;
    }

    setIsLoadingNotifications(true);

    try {
      const response = await getNotifications({
        size: NOTIFICATION_PAGE_SIZE,
      });

      replaceNotifications(response);
    } catch (error) {
      console.error("알림 목록 조회 실패", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const loadMoreNotifications = async () => {
    if (!hasNext || nextCursorId === null || isLoadingMoreNotifications) {
      return;
    }

    setIsLoadingMoreNotifications(true);

    try {
      const response = await getNotifications({
        cursorId: nextCursorId,
        size: NOTIFICATION_PAGE_SIZE,
      });

      appendNotifications(response);
    } catch (error) {
      console.error("알림 추가 조회 실패", error);
    } finally {
      setIsLoadingMoreNotifications(false);
    }
  };

  const markNotificationsAsChecked = async () => {
    if (newCount === 0) {
      return;
    }

    try {
      await checkNotifications();
      markChecked();
    } catch (error) {
      console.error("알림 확인 처리 실패", error);
    }
  };

  const acknowledgeNewNotifications = async () => {
    if (newCount === 0) {
      return;
    }

    markChecked();

    try {
      await checkNotifications();
    } catch (error) {
      console.error("알림 확인 처리 실패", error);
    }
  };

  const handleReadAllNotifications = async () => {
    if (
      isReadingAllNotifications ||
      notifications.length === 0 ||
      notifications.every((notification) => notification.isRead)
    ) {
      return;
    }

    setIsReadingAllNotifications(true);

    try {
      await readAllNotifications();
      markAllAsRead();
    } catch (error) {
      console.error("알림 전체 읽음 처리 실패", error);
    } finally {
      setIsReadingAllNotifications(false);
    }
  };

  const openAlarm = () => {
    setIsAlarmMounted(true);

    requestAnimationFrame(() => {
      setIsAlarmOpen(true);
    });

    void refreshNotifications();
    void markNotificationsAsChecked();
  };

  const moveToNotificationsPage = () => {
    closeAlarm();
    router.push(getNotificationListPageHref());
  };

  const moveToNotificationTarget = (notification: NotificationItem) => {
    const navigationTarget = getNotificationNavigationTarget(notification);
    const targetHref = navigationTarget?.href ?? getNotificationListPageHref(notification);

    closeAlarm();

    if (notification.isRead || readingNotificationIds.includes(notification.notificationId)) {
      router.push(targetHref);
      return;
    }

    setReadingNotificationIds((prev) => [...prev, notification.notificationId]);
    markNotificationsAsRead([notification.notificationId]);
    router.push(targetHref);

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

  const handleAlarmButtonClick = () => {
    if (!isLogin) {
      router.push("/login");
      return;
    }

    if (isAlarmOpen) {
      closeAlarm();
      return;
    }

    openAlarm();
  };

  const mobileMenuLayer =
    isMenuMounted && typeof document !== "undefined"
      ? createPortal(
          <>
            <Dim onClickDim={closeMobileMenu} isVisible={isOpen} />
            <MenuLayer isOpen={isOpen} close={closeMobileMenu}>
              <NavMenu
                onClickItem={closeMobileMenu}
                classes="flex-col gap-2"
                variant="drawer"
              />

              <div className="mt-6 border-t border-gray-100 pt-5 dark:border-zinc-800">
                <div className="flex flex-col gap-2">
                  {user?.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
                    >
                      <Settings strokeWidth={2} size={16} />
                      <span>Admin</span>
                    </Link>
                  ) : null}

                  {isLogin ? (
                    <Link
                      href="/assets"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
                    >
                      <Wallet strokeWidth={2} size={16} />
                      <span>자산</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </MenuLayer>
          </>,
          document.body
        )
      : null;

  const alarmLayer =
    isAlarmMounted && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={alarmPanelRef}
            className={`fixed bottom-0 right-0 z-[120] w-full max-w-sm border-l border-gray-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-zinc-800 dark:bg-zinc-900 ${
              isAlarmOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
            style={{ top: `${headerHeight}px` }}
          >
            <NotificationDrawer
              notifications={notifications}
              isLoading={isLoadingNotifications}
              isReadingAll={isReadingAllNotifications}
              isLoadingMore={isLoadingMoreNotifications}
              hasNext={hasNext}
              onClose={closeAlarm}
              onMoveListPage={moveToNotificationsPage}
              onMoveNotification={moveToNotificationTarget}
              onAcknowledgeNewNotifications={() => void acknowledgeNewNotifications()}
              onReadAll={() => void handleReadAllNotifications()}
              onLoadMore={() => void loadMoreNotifications()}
            />
          </div>,
          document.body
        )
      : null;

  return (
    <header
      ref={headerRef}
      id="header"
      className="sticky left-0 top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="relative m-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
        <Link
          href="/"
          aria-label="메인 페이지로 이동"
          className="origin-left flex flex-shrink-0 items-center scale-[0.85]"
        >
          <Logo />
        </Link>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 min-[1101px]:block">
          <NavMenu classes="flex" variant="desktop" />
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
          >
            {isDarkMode ? (
              <Sun strokeWidth={2} size={20} />
            ) : (
              <Moon strokeWidth={2} size={20} />
            )}
          </button>

          <div className="relative">
            <button
              ref={alarmTriggerRef}
              type="button"
              onClick={handleAlarmButtonClick}
              className="flex items-center justify-center rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800"
              aria-label="알림 열기"
            >
              <Bell size={20} strokeWidth={2} />

              {isLogin && newCount > 0 ? (
                <span className="absolute right-0.5 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 text-center text-[9px] font-bold text-white">
                  {formatNotificationCount(newCount)}
                </span>
              ) : null}
            </button>
          </div>

          <div className="mx-1 hidden h-4 w-[1px] bg-gray-200 dark:bg-zinc-700 sm:block" />

          {user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 sm:flex"
            >
              <Settings strokeWidth={2} size={15} />
              <span>Admin</span>
            </Link>
          ) : null}

          {isLogin ? (
            <Link
              href="/assets"
              className="hidden items-center gap-1.5 rounded-full bg-gray-900 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white sm:flex"
            >
              <Wallet strokeWidth={2} size={15} />
              <span>자산</span>
            </Link>
          ) : null}

          <Link href={isLogin ? "/me" : "/login"} className="ml-1">
            {isLogin ? (
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-50 ring-1 ring-gray-200 transition-transform hover:scale-105 dark:bg-zinc-800 dark:ring-zinc-700">
                {user?.profileImgUrl ? (
                  <img
                    src={user.profileImgUrl}
                    alt="프로필"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound
                    strokeWidth={2}
                    size={18}
                    className="text-gray-400"
                  />
                )}
              </div>
            ) : (
              <span className="px-2 text-sm font-bold text-gray-700 transition-colors hover:text-black dark:text-gray-300 dark:hover:text-white">
                로그인
              </span>
            )}
          </Link>

          <button
            type="button"
            className="ml-1 block p-2 text-gray-600 min-[1101px]:hidden dark:text-gray-300"
            onClick={openMobileMenu}
          >
            <Menu strokeWidth={2} size={22} />
          </button>
        </div>

        {!isAlarmOpen ? (
          <NotificationToastStack
            toasts={liveToasts}
            onDismiss={dismissToast}
          />
        ) : null}
      </div>

      {mobileMenuLayer}
      {alarmLayer}
    </header>
  );
}
