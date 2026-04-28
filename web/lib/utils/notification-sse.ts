export const FORWARDED_NOTIFICATION_EVENT_NAMES = [
  "EMAIL_SENT",
  "EMAIL_SEND_FAILED",
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
