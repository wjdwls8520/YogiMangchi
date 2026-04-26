import { create } from "zustand";
import {
  formatNotificationDescription,
  formatNotificationTitle,
  getNotificationTradeMeta,
} from "@/lib/utils/notification";
import type {
  CursorResponseDto,
  NotificationItem,
  NotificationStatusResponse,
  NotificationToastItem,
} from "@/types/notification";

interface NotificationStore {
  items: NotificationItem[];
  newCount: number;
  nextCursorId: number | null;
  hasNext: boolean;
  liveToasts: NotificationToastItem[];
  hydrateStatus: (status: NotificationStatusResponse) => void;
  replaceNotifications: (
    response: CursorResponseDto<NotificationItem>
  ) => void;
  syncLatestNotifications: (
    response: CursorResponseDto<NotificationItem>,
    options?: { treatNewAsLive?: boolean }
  ) => void;
  appendNotifications: (
    response: CursorResponseDto<NotificationItem>
  ) => void;
  receiveNotification: (notification: NotificationItem) => void;
  markChecked: () => void;
  markNotificationsAsRead: (notificationIds: number[]) => void;
  markAllAsRead: () => void;
  removeNotifications: (notificationIds: number[]) => void;
  removeAllNotifications: () => void;
  dismissToast: (toastId: string) => void;
  reset: () => void;
}

const MAX_LIVE_TOASTS = 3;
const LIVE_TOAST_DURATION = 4500;

const mergeNotifications = (
  primaryItems: NotificationItem[],
  secondaryItems: NotificationItem[]
) => {
  const merged = new Map<number, NotificationItem>();

  [...primaryItems, ...secondaryItems].forEach((item) => {
    merged.set(item.notificationId, item);
  });

  return Array.from(merged.values()).sort((a, b) => {
    const bTime = new Date(b.createdAt).getTime();
    const aTime = new Date(a.createdAt).getTime();

    return bTime - aTime;
  });
};

const createLiveToast = (notification: NotificationItem): NotificationToastItem => ({
  ...getNotificationTradeMeta(notification),
  id: `${notification.notificationId}-${Date.now()}`,
  notificationId: notification.notificationId,
  title: formatNotificationTitle(notification),
  description: formatNotificationDescription(notification),
  createdAt: notification.createdAt,
});

const scheduleToastDismiss = (
  get: () => NotificationStore,
  toastId: string
) => {
  window.setTimeout(() => {
    get().dismissToast(toastId);
  }, LIVE_TOAST_DURATION);
};

const initialState = {
  items: [] as NotificationItem[],
  newCount: 0,
  nextCursorId: null as number | null,
  hasNext: false,
  liveToasts: [] as NotificationToastItem[],
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  ...initialState,

  hydrateStatus: (status) => {
    set({
      newCount: status.newCount,
    });
  },

  replaceNotifications: (response) => {
    set((state) => ({
      items: mergeNotifications(response.content, state.items),
      nextCursorId: response.nextCursorId,
      hasNext: response.hasNext,
    }));
  },

  syncLatestNotifications: (response, options) => {
    const treatNewAsLive = options?.treatNewAsLive ?? false;
    const currentIds = new Set(get().items.map((item) => item.notificationId));
    const freshNotifications = response.content.filter(
      (item) => !currentIds.has(item.notificationId)
    );
    const nextToasts = treatNewAsLive
      ? freshNotifications.map(createLiveToast)
      : [];

    set((state) => ({
      items: mergeNotifications(response.content, state.items),
      nextCursorId: response.nextCursorId,
      hasNext: response.hasNext,
      newCount: treatNewAsLive
        ? state.newCount + freshNotifications.length
        : state.newCount,
      liveToasts: treatNewAsLive
        ? [...nextToasts, ...state.liveToasts].slice(0, MAX_LIVE_TOASTS)
        : state.liveToasts,
    }));

    nextToasts.forEach((toast) => {
      scheduleToastDismiss(get, toast.id);
    });
  },

  appendNotifications: (response) => {
    set((state) => ({
      items: mergeNotifications(state.items, response.content),
      nextCursorId: response.nextCursorId,
      hasNext: response.hasNext,
    }));
  },

  receiveNotification: (notification) => {
    const isExisting = get().items.some(
      (item) => item.notificationId === notification.notificationId
    );

    if (isExisting) {
      set((state) => ({
        items: mergeNotifications([notification], state.items),
      }));
      return;
    }

    const liveToast = createLiveToast(notification);

    set((state) => ({
      items: mergeNotifications([notification], state.items),
      newCount: state.newCount + 1,
      liveToasts: [liveToast, ...state.liveToasts].slice(0, MAX_LIVE_TOASTS),
    }));

    scheduleToastDismiss(get, liveToast.id);
  },

  markChecked: () => {
    set({
      newCount: 0,
    });
  },

  markNotificationsAsRead: (notificationIds) => {
    const notificationIdSet = new Set(notificationIds);

    set((state) => ({
      items: state.items.map((item) =>
        notificationIdSet.has(item.notificationId)
          ? {
              ...item,
              isRead: true,
            }
          : item
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      items: state.items.map((item) => ({
        ...item,
        isRead: true,
      })),
      newCount: 0,
    }));
  },

  removeNotifications: (notificationIds) => {
    const idSet = new Set(notificationIds);

    set((state) => ({
      items: state.items.filter(
        (item) => !idSet.has(item.notificationId)
      ),
    }));
  },

  removeAllNotifications: () => {
    set({
      items: [],
      nextCursorId: null,
      hasNext: false,
    });
  },

  dismissToast: (toastId) => {
    set((state) => ({
      liveToasts: state.liveToasts.filter((toast) => toast.id !== toastId),
    }));
  },

  reset: () => {
    set(initialState);
  },
}));
