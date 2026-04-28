import { create } from "zustand";
import {
  formatNotificationDescription,
  formatNotificationTitle,
  getNotificationActivityTime,
  getNotificationActivityValue,
  getNotificationTradeMeta,
  hasNewerNotificationActivity,
  sortNotificationsByNewestActivity,
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
  unreadCount: number;
  hasHydratedStatus: boolean;
  lastSyncedAt: number;
  nextCursorId: number | null;
  hasNext: boolean;
  hasHydratedLatest: boolean;
  liveToasts: NotificationToastItem[];
  acknowledgedActivityAtById: Record<number, string>;
  pendingActivityAtById: Record<number, string>;
  hydrateStatus: (status: NotificationStatusResponse) => void;
  replaceNotifications: (
    response: CursorResponseDto<NotificationItem>
  ) => void;
  appendNotifications: (
    response: CursorResponseDto<NotificationItem>
  ) => void;
  receiveNotification: (notification: NotificationItem) => void;
  markChecked: () => void;
  markNotificationsAsRead: (notificationIds: number[]) => void;
  markAllAsRead: () => void;
  removeNotifications: (notificationIds: number[]) => void;
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

  // 같은 notificationId가 겹칠 때는 현재 호출 의도가 반영된 primaryItems를 우선 적용한다.
  [...secondaryItems, ...primaryItems].forEach((item) => {
    merged.set(item.notificationId, item);
  });

  return sortNotificationsByNewestActivity(Array.from(merged.values()));
};

const createLiveToast = (notification: NotificationItem): NotificationToastItem => ({
  ...getNotificationTradeMeta(notification),
  id: `${notification.notificationId}-${Date.now()}`,
  notificationId: notification.notificationId,
  type: notification.type,
  title: formatNotificationTitle(notification),
  description: formatNotificationDescription(notification),
  createdAt: getNotificationActivityValue(notification),
});

const mergeAcknowledgedActivities = (
  currentMap: Record<number, string>,
  notifications: NotificationItem[]
) => {
  if (notifications.length === 0) {
    return currentMap;
  }

  const nextMap = { ...currentMap };

  notifications.forEach((notification) => {
    nextMap[notification.notificationId] = getNotificationActivityValue(notification);
  });

  return nextMap;
};

const removeAcknowledgedActivities = (
  currentMap: Record<number, string>,
  notificationIds: number[]
) => {
  if (notificationIds.length === 0) {
    return currentMap;
  }

  const nextMap = { ...currentMap };

  notificationIds.forEach((notificationId) => {
    delete nextMap[notificationId];
  });

  return nextMap;
};

const hasNewActivitySinceAcknowledgement = (
  existingNotification: NotificationItem,
  nextNotification: NotificationItem,
  acknowledgedActivityAt?: string
) => {
  if (!acknowledgedActivityAt) {
    return false;
  }

  if (!hasNewerNotificationActivity(existingNotification, nextNotification)) {
    return false;
  }

  return (
    getNotificationActivityTime(nextNotification) >
    new Date(acknowledgedActivityAt).getTime()
  );
};

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
  unreadCount: 0,
  hasHydratedStatus: false,
  lastSyncedAt: 0,
  nextCursorId: null as number | null,
  hasNext: false,
  hasHydratedLatest: false,
  liveToasts: [] as NotificationToastItem[],
  acknowledgedActivityAtById: {} as Record<number, string>,
  pendingActivityAtById: {} as Record<number, string>,
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  ...initialState,

  hydrateStatus: (status) => {
    set((state) => ({
      newCount: status.newCount,
      unreadCount: status.unreadCount,
      hasHydratedStatus: true,
      hasHydratedLatest: true,
      acknowledgedActivityAtById:
        status.newCount === 0
          ? mergeAcknowledgedActivities(
              state.acknowledgedActivityAtById,
              state.items
            )
          : state.acknowledgedActivityAtById,
      pendingActivityAtById:
        status.newCount === 0 ? {} : state.pendingActivityAtById,
    }));
  },

  replaceNotifications: (response) => {
    set((state) => ({
      items: mergeNotifications(response.content, state.items),
      acknowledgedActivityAtById:
        state.hasHydratedStatus && state.newCount === 0
          ? mergeAcknowledgedActivities(
              state.acknowledgedActivityAtById,
              response.content
            )
          : state.acknowledgedActivityAtById,
      lastSyncedAt: Date.now(),
      nextCursorId: response.nextCursorId,
      hasNext: response.hasNext,
    }));
  },

  appendNotifications: (response) => {
    set((state) => ({
      items: mergeNotifications(state.items, response.content),
      acknowledgedActivityAtById:
        state.hasHydratedStatus && state.newCount === 0
          ? mergeAcknowledgedActivities(
              state.acknowledgedActivityAtById,
              response.content
            )
          : state.acknowledgedActivityAtById,
      lastSyncedAt: Date.now(),
      nextCursorId: response.nextCursorId,
      hasNext: response.hasNext,
    }));
  },

  receiveNotification: (notification) => {
    const currentState = get();
    const existingNotification = currentState.items.find(
      (item) => item.notificationId === notification.notificationId
    );

    if (existingNotification) {
      const pendingActivityAt =
        currentState.pendingActivityAtById[notification.notificationId];
      const acknowledgedActivityAt =
        currentState.acknowledgedActivityAtById[notification.notificationId];
      const shouldTreatAsNewActivity = hasNewActivitySinceAcknowledgement(
        existingNotification,
        notification,
        acknowledgedActivityAt
      );
      const unreadDelta =
        existingNotification.isRead === notification.isRead
          ? 0
          : notification.isRead
            ? -1
            : 1;
      const nextActivityValue = getNotificationActivityValue(notification);
      const shouldCreateLiveToast =
        shouldTreatAsNewActivity && !pendingActivityAt;
      const liveToast = shouldCreateLiveToast
        ? createLiveToast(notification)
        : null;

      set((state) => ({
        items: mergeNotifications([notification], state.items),
        lastSyncedAt: Date.now(),
        newCount:
          shouldTreatAsNewActivity && !pendingActivityAt
            ? state.newCount + 1
            : state.newCount,
        unreadCount: Math.max(0, state.unreadCount + unreadDelta),
        pendingActivityAtById:
          shouldTreatAsNewActivity || pendingActivityAt
            ? {
                ...state.pendingActivityAtById,
                [notification.notificationId]: nextActivityValue,
              }
            : state.pendingActivityAtById,
        liveToasts: liveToast
          ? [liveToast, ...state.liveToasts].slice(0, MAX_LIVE_TOASTS)
          : state.liveToasts,
      }));

      if (liveToast) {
        scheduleToastDismiss(get, liveToast.id);
      }

      return;
    }

    const liveToast = createLiveToast(notification);

    set((state) => ({
      items: mergeNotifications([notification], state.items),
      lastSyncedAt: Date.now(),
      newCount: state.newCount + 1,
      unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      pendingActivityAtById: {
        ...state.pendingActivityAtById,
        [notification.notificationId]: getNotificationActivityValue(notification),
      },
      liveToasts: [liveToast, ...state.liveToasts].slice(0, MAX_LIVE_TOASTS),
    }));

    scheduleToastDismiss(get, liveToast.id);
  },

  markChecked: () => {
    set((state) => ({
      newCount: 0,
      acknowledgedActivityAtById: mergeAcknowledgedActivities(
        state.acknowledgedActivityAtById,
        state.items
      ),
      pendingActivityAtById: {},
    }));
  },

  markNotificationsAsRead: (notificationIds) => {
    const notificationIdSet = new Set(notificationIds);

    set((state) => ({
      acknowledgedActivityAtById: mergeAcknowledgedActivities(
        state.acknowledgedActivityAtById,
        state.items.filter((item) => notificationIdSet.has(item.notificationId))
      ),
      pendingActivityAtById: removeAcknowledgedActivities(
        state.pendingActivityAtById,
        notificationIds
      ),
      lastSyncedAt: Date.now(),
      unreadCount: Math.max(
        0,
        state.unreadCount -
          state.items.filter(
            (item) =>
              notificationIdSet.has(item.notificationId) && !item.isRead
          ).length
      ),
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
      acknowledgedActivityAtById: mergeAcknowledgedActivities(
        state.acknowledgedActivityAtById,
        state.items
      ),
      pendingActivityAtById: {},
      lastSyncedAt: Date.now(),
      items: state.items.map((item) => ({
        ...item,
        isRead: true,
      })),
      newCount: 0,
      unreadCount: 0,
    }));
  },

  removeNotifications: (notificationIds) => {
    const idSet = new Set(notificationIds);

    set((state) => ({
      acknowledgedActivityAtById: removeAcknowledgedActivities(
        state.acknowledgedActivityAtById,
        notificationIds
      ),
      pendingActivityAtById: removeAcknowledgedActivities(
        state.pendingActivityAtById,
        notificationIds
      ),
      lastSyncedAt: Date.now(),
      unreadCount: Math.max(
        0,
        state.unreadCount -
          state.items.filter(
            (item) => idSet.has(item.notificationId) && !item.isRead
          ).length
      ),
      items: state.items.filter(
        (item) => !idSet.has(item.notificationId)
      ),
    }));
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
