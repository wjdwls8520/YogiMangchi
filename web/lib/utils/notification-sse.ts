export const FORWARDED_NOTIFICATION_EVENT_NAMES = [
  "EMAIL_SENT",
  "EMAIL_SEND_FAILED",
  "NOTIFICATION_MOCK_ORDER_COMPLETED",
  "NOTIFICATION_TRADE_ORDER_COMPLETED",
  "NOTIFICATION_CONTEST_ORDER_COMPLETED",
  "NOTIFICATION_CONTEST_APPLICATION_APPROVED",
  "NOTIFICATION_CONTEST_APPLICATION_REJECTED",
  "CONTEST_APPLICATION_APPROVED",
  "CONTEST_APPLICATION_REJECTED",
  "CONTEST_APPROVED",
  "CONTEST_REJECTED",
] as const;

export type ForwardedNotificationEventName =
  (typeof FORWARDED_NOTIFICATION_EVENT_NAMES)[number];

export const getNotificationSseBridgeEventName = (
  eventName: ForwardedNotificationEventName
) => `notification-sse:${eventName}`;

export const dispatchNotificationSseBridgeEvent = (
  eventName: ForwardedNotificationEventName,
  data: string
) => {
  window.dispatchEvent(
    new CustomEvent(getNotificationSseBridgeEventName(eventName), {
      detail: data,
    })
  );
};
