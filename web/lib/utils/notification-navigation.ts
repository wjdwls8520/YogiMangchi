import type { NotificationItem, NotificationPayload } from "@/types/notification";

export interface NotificationNavigationTarget {
  href: string;
  label: string;
}

export type NotificationListTabValue =
  | "ALL"
  | "MOCK"
  | "TRADE"
  | "CONTEST"
  | "COMMUNITY"
  | "OTHER";

const getPayloadRecord = (payload?: NotificationPayload | null) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
};

const getPayloadInteger = (
  payload: NotificationPayload | null | undefined,
  ...keys: string[]
) => {
  const record = getPayloadRecord(payload);

  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsedValue = Number(value);

      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return null;
};

const getAssetTabByCategory = (category: NotificationItem["category"]) => {
  if (category === "TRADE") {
    return "trade";
  }

  if (category === "CONTEST") {
    return "contest";
  }

  return "mock";
};

const getCommunityTargetHref = (notification: NotificationItem) => {
  const postId = getPayloadInteger(
    notification.payload,
    "postId",
    "targetPostId"
  );

  if (postId === null) {
    return null;
  }

  const replyId = getPayloadInteger(
    notification.payload,
    "replyId",
    "targetReplyId",
    "commentId"
  );

  return `/community/latest/${postId}${replyId !== null ? `#comment-${replyId}` : ""}`;
};

export const getNotificationListTabValue = (
  category: NotificationItem["category"]
) => {
  if (
    category === "MOCK" ||
    category === "TRADE" ||
    category === "CONTEST" ||
    category === "COMMUNITY"
  ) {
    return category;
  }

  if (category === "FOLLOW") {
    return "COMMUNITY" as NotificationListTabValue;
  }

  return "OTHER" as NotificationListTabValue;
};

export const getNotificationListPageHref = (notification?: NotificationItem) => {
  if (!notification) {
    return "/notifications?tab=ALL";
  }

  const params = new URLSearchParams();
  params.set("tab", getNotificationListTabValue(notification.category));
  params.set("focus", String(notification.notificationId));

  return `/notifications?${params.toString()}#notification-${notification.notificationId}`;
};

export const getNotificationNavigationTarget = (
  notification: NotificationItem
) => {
  switch (notification.type) {
    case "ORDER_COMPLETED":
      return {
        href: `/assets?assetTab=${getAssetTabByCategory(notification.category)}&detailTab=trades#asset-detail-tabs`,
        label: "거래내역으로 이동",
      } satisfies NotificationNavigationTarget;
    case "ORDER_CANCELED":
      return {
        href: `/assets?assetTab=${getAssetTabByCategory(notification.category)}&detailTab=orders#asset-detail-tabs`,
        label: "주문내역으로 이동",
      } satisfies NotificationNavigationTarget;
    case "POST_COMMENT_CREATED":
    case "REPLY_COMMENT_CREATED": {
      const href = getCommunityTargetHref(notification);

      if (!href) {
        return null;
      }

      return {
        href,
        label: href.includes("#comment-") ? "댓글로 이동" : "게시글로 이동",
      } satisfies NotificationNavigationTarget;
    }
    case "POST_LIKED": {
      const href = getCommunityTargetHref(notification);

      return href
        ? ({
            href,
            label: "게시글로 이동",
          } satisfies NotificationNavigationTarget)
        : null;
    }
    case "REPLY_LIKED": {
      const href = getCommunityTargetHref(notification);

      if (!href) {
        return null;
      }

      return {
        href,
        label: href.includes("#comment-") ? "댓글로 이동" : "게시글로 이동",
      } satisfies NotificationNavigationTarget;
    }
    case "FOLLOW_CREATED": {
      const memberId =
        notification.actorMemberId ??
        getPayloadInteger(
          notification.payload,
          "actorMemberId",
          "memberId",
          "targetMemberId"
        );

      return memberId !== null
        ? ({
            href: `/member/${memberId}`,
            label: "프로필로 이동",
          } satisfies NotificationNavigationTarget)
        : null;
    }
    default:
      return null;
  }
};
