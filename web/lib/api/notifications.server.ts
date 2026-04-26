import type { NotificationStatusResponse } from "@/types/notification";
import { serverFetchClient } from "./server";

export const getNotificationStatus = async () => {
  const result = await serverFetchClient("notifications/status");

  return result as NotificationStatusResponse;
};

export const getAlarmStatus = getNotificationStatus;
