import type {
  CursorResponseDto,
  NotificationItem,
  NotificationListParams,
} from "@/types/notification";
import { fetchClient } from "./client";

export const subscribeNotifications = () => {
  return new EventSource(`/api/v1/notifications/subscribe`, {
    withCredentials: true,
  });
};

export const getNotifications = async ({
  cursorId,
  size,
  category,
  read,
}: NotificationListParams = {}) => {
  const params = new URLSearchParams();

  if (cursorId !== undefined) params.append("cursorId", String(cursorId));
  if (size !== undefined) params.append("size", String(size));
  if (category !== undefined) params.append("category", String(category));
  if (read !== undefined) params.append("read", String(read));

  const query = params.toString();
  const result = await fetchClient(`notifications${query ? `?${query}` : ""}`);

  return result as CursorResponseDto<NotificationItem>;
};

export const checkNotifications = async () => {
  await fetchClient("notifications/check", {
    method: "PUT",
  });
};

export const readAllNotifications = async () => {
  await fetchClient("notifications/read-all", {
    method: "PUT",
  });
};

export const readNotification = async (notificationId: number) => {
  await fetchClient(`notifications/${notificationId}/read`, {
    method: "PUT",
  });
};

export const readSelectedNotifications = async (notificationIds: number[]) => {
  await fetchClient("notifications/read", {
    method: "PUT",
    body: {
      notificationIds,
    },
  });
};

export const deleteSelectedNotifications = async (notificationIds: number[]) => {
  await fetchClient("notifications", {
    method: "DELETE",
    body: {
      notificationIds,
    },
  });
};

export const deleteReadNotifications = async () => {
  await fetchClient("notifications/read", {
    method: "DELETE",
  });
};
