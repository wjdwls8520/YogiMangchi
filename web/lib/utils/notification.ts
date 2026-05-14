import { formatAssetNumber } from "@/lib/utils/number";
import { formatDateTime } from "@/lib/utils/date";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationPayload,
  NotificationTradeTone,
} from "@/types/notification";

const CATEGORY_LABELS: Record<string, string> = {
  MOCK: "모의투자",
  TRADE: "실전투자",
  CONTEST: "대회",
  COMMUNITY: "커뮤니티",
  FOLLOW: "팔로우",
  REPORT: "신고",
};

const SIDE_LABELS: Record<string, string> = {
  BUY: "매수",
  SELL: "매도",
  LONG: "Long",
  SHORT: "Short",
};

const TYPE_LABELS: Record<string, string> = {
  ORDER_COMPLETED: "주문 체결",
  ORDER_CANCELED: "주문 취소",
  LIQUIDATION_COMPLETED: "강제청산",
  ASSET_TRANSFER_COMPLETED: "자산 이체",
  POST_COMMENT_CREATED: "게시글 댓글",
  REPLY_COMMENT_CREATED: "답글",
  POST_LIKED: "게시글 좋아요",
  REPLY_LIKED: "댓글 좋아요",
  FOLLOW_CREATED: "팔로우",
};

export interface NotificationDetailField {
  label: string;
  value: string;
  align: "left" | "center" | "right";
}

export const formatNotificationCount = (count: number) => {
  return count > 99 ? "99+" : String(count);
};

const getPayloadRecord = (payload?: NotificationPayload | null) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload;
};

const getPayloadString = (
  payload: NotificationPayload | null | undefined,
  key: string
) => {
  const record = getPayloadRecord(payload);
  const value = record?.[key];

  return typeof value === "string" && value.trim() ? value : null;
};

const getPayloadStringListFirst = (
  payload: NotificationPayload | null | undefined,
  ...keys: string[]
) => {
  const record = getPayloadRecord(payload);

  for (const key of keys) {
    const value = record?.[key];

    if (!Array.isArray(value)) {
      continue;
    }

    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const itemRecord = item as Record<string, unknown>;

        if (
          typeof itemRecord.nickname === "string" &&
          itemRecord.nickname.trim()
        ) {
          return itemRecord.nickname.trim();
        }

        if (
          typeof itemRecord.nickName === "string" &&
          itemRecord.nickName.trim()
        ) {
          return itemRecord.nickName.trim();
        }

        if (
          typeof itemRecord.memberNickname === "string" &&
          itemRecord.memberNickname.trim()
        ) {
          return itemRecord.memberNickname.trim();
        }

        if (typeof itemRecord.name === "string" && itemRecord.name.trim()) {
          return itemRecord.name.trim();
        }
      }
    }
  }

  return null;
};

const getPayloadNestedString = (
  payload: NotificationPayload | null | undefined,
  recordKeys: string[],
  valueKeys: string[]
) => {
  const record = getPayloadRecord(payload);

  for (const recordKey of recordKeys) {
    const nestedValue = record?.[recordKey];

    if (!nestedValue || typeof nestedValue !== "object") {
      continue;
    }

    const nestedRecord = nestedValue as Record<string, unknown>;

    for (const valueKey of valueKeys) {
      const value = nestedRecord[valueKey];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
};

const getPayloadNumber = (
  payload: NotificationPayload | null | undefined,
  key: string
) => {
  const record = getPayloadRecord(payload);
  const value = record?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const getPayloadNumericValue = (
  payload: NotificationPayload | null | undefined,
  ...keys: string[]
) => {
  for (const key of keys) {
    const numberValue = getPayloadNumber(payload, key);

    if (numberValue !== null) {
      return numberValue;
    }

    const stringValue = getPayloadString(payload, key);

    if (!stringValue) {
      continue;
    }

    const parsedValue = Number(stringValue);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return null;
};

const normalizeNotificationText = (value: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized || null;
};

const summarizeNotificationText = (value: string | null, maxLength = 24) => {
  const normalized = normalizeNotificationText(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength)}...`;
};

const getDisplayTarget = (notification: NotificationItem) => {
  return (
    getPayloadString(notification.payload, "displayNameKr") ??
    getPayloadString(notification.payload, "symbol")
  );
};

const getActorName = (notification: NotificationItem) => {
  return (
    getPayloadString(notification.payload, "actorNickname") ??
    getPayloadString(notification.payload, "actorNickName") ??
    getPayloadString(notification.payload, "latestActorNickname") ??
    getPayloadString(notification.payload, "recentActorNickname") ??
    getPayloadString(notification.payload, "firstActorNickname") ??
    getPayloadString(notification.payload, "senderNickname") ??
    getPayloadString(notification.payload, "senderNickName") ??
    getPayloadString(notification.payload, "likerNickname") ??
    getPayloadString(notification.payload, "likerNickName") ??
    getPayloadString(notification.payload, "fromNickname") ??
    getPayloadString(notification.payload, "triggerMemberNickname") ??
    getPayloadString(notification.payload, "representativeNickname") ??
    getPayloadString(notification.payload, "representativeActorNickname") ??
    getPayloadString(notification.payload, "nickname") ??
    getPayloadString(notification.payload, "nickName") ??
    getPayloadString(notification.payload, "memberNickname") ??
    getPayloadString(notification.payload, "memberNickName") ??
    getPayloadString(notification.payload, "writerNickname") ??
    getPayloadString(notification.payload, "writerNickName") ??
    getPayloadString(notification.payload, "actorName") ??
    getPayloadNestedString(
      notification.payload,
      [
        "actor",
        "latestActor",
        "recentActor",
        "firstActor",
        "sender",
        "liker",
        "member",
        "triggerMember",
        "representativeActor",
        "writer",
      ],
      ["nickname", "nickName", "memberNickname", "memberNickName", "name"]
    ) ??
    getPayloadStringListFirst(
      notification.payload,
      "actorsPreview",
      "actorNicknames",
      "memberNicknames",
      "likerNicknames",
      "userNicknames",
      "actorNames",
      "memberNames",
      "actors",
      "members",
      "likers"
    ) ??
    "다른 회원"
  );
};

const getPostTitle = (notification: NotificationItem) => {
  return (
    getPayloadString(notification.payload, "postTitle") ??
    getPayloadString(notification.payload, "targetPostTitle") ??
    getPayloadString(notification.payload, "title") ??
    getPayloadString(notification.payload, "communityTitle") ??
    getPayloadString(notification.payload, "articleTitle") ??
    getPayloadString(notification.payload, "boardTitle")
  );
};

const isGroupedLikeNotification = (notification: NotificationItem) => {
  return (
    notification.type === "POST_LIKED" || notification.type === "REPLY_LIKED"
  );
};

const getGroupedLikeCount = (notification: NotificationItem) => {
  if (!isGroupedLikeNotification(notification)) {
    return null;
  }

  return getPayloadNumericValue(
    notification.payload,
    "groupCount",
    "totalActorCount",
    "likeGroupCount",
    "aggregatedCount",
    "actorCount",
    "memberCount",
    "likeCount",
    "count"
  );
};

const getGroupedLikeAdditionalActorCount = (notification: NotificationItem) => {
  const groupedLikeCount = getGroupedLikeCount(notification);

  if (groupedLikeCount === null || groupedLikeCount <= 1) {
    return 0;
  }

  return groupedLikeCount - 1;
};

const getOrderSideLabel = (notification: NotificationItem) => {
  const rawSide =
    getPayloadString(notification.payload, "side") ??
    getPayloadString(notification.payload, "positionSide");

  if (!rawSide) {
    return null;
  }

  const sideLabel = SIDE_LABELS[rawSide] ?? rawSide;
  const assetType = getPayloadString(notification.payload, "assetType");
  const hasFuturesPayload =
    !!getPayloadString(notification.payload, "positionSide") ||
    !!getPayloadString(notification.payload, "positionAction");

  const isFutures =
    notification.category === "CONTEST" ||
    (assetType && assetType.includes("FUTURE")) ||
    hasFuturesPayload;

  if (isFutures) {
    const status =
      getPayloadString(notification.payload, "positionAction") ??
      getPayloadString(notification.payload, "positionStatus");

    if (status === "OPEN") return `${sideLabel} / Open`;
    if (status === "CLOSE") return `${sideLabel} / Close`;
  }

  return sideLabel;
};

const getOrderSideTone = (
  notification: NotificationItem
): NotificationTradeTone => {
  const type = notification.type;

  if (type.includes("LIQUIDATION_COMPLETED")) {
    return "warning";
  }

  if (type.includes("ASSET_TRANSFER_COMPLETED")) {
    return "info";
  }

  const rawSide =
    getPayloadString(notification.payload, "side") ??
    getPayloadString(notification.payload, "positionSide");

  const assetType = getPayloadString(notification.payload, "assetType");
  const isFutures =
    notification.category === "CONTEST" ||
    (assetType && assetType.includes("FUTURE"));

  if (rawSide === "BUY" || rawSide === "LONG") {
    return isFutures ? "long" : "buy";
  }

  if (rawSide === "SELL" || rawSide === "SHORT") {
    return isFutures ? "short" : "sell";
  }

  return null;
};

const getOrderQuantity = (notification: NotificationItem) => {
  return (
    getPayloadNumericValue(
      notification.payload,
      "quantity",
      "filledQuantity",
      "orderQuantity"
    )
  );
};

const getOrderAmount = (notification: NotificationItem) => {
  return (
    getPayloadNumericValue(
      notification.payload,
      "executedAmount",
      "settlementAmount",
      "totalAmount",
      "orderAmount"
    )
  );
};

const getContentSummary = (notification: NotificationItem) => {
  return summarizeNotificationText(getRawContent(notification));
};

const getPostTitleSummary = (notification: NotificationItem) => {
  return summarizeNotificationText(getPostTitle(notification));
};

const getRawContent = (notification: NotificationItem) => {
  const rawContent =
    getPayloadString(notification.payload, "replyContentPreview") ??
    getPayloadString(notification.payload, "content") ??
    getPayloadString(notification.payload, "replyContent") ??
    getPayloadString(notification.payload, "commentContent") ??
    getPayloadString(notification.payload, "message");

  return normalizeNotificationText(rawContent);
};

export const getNotificationCategoryLabel = (category: NotificationCategory) => {
  return CATEGORY_LABELS[category] ?? "알림";
};

export const getNotificationTypeLabel = (type: NotificationItem["type"]) => {
  return TYPE_LABELS[type] ?? "일반 알림";
};

export const getNotificationStatusLabel = (notification: NotificationItem) => {
  return notification.isRead ? "읽음" : "안 읽음";
};

export const getNotificationActivityValue = (notification: NotificationItem) => {
  return notification.lastEventAt ?? notification.createdAt;
};

export const getNotificationActivityTime = (notification: NotificationItem) => {
  return new Date(getNotificationActivityValue(notification)).getTime();
};

export const sortNotificationsByNewestActivity = (
  notifications: NotificationItem[]
) => {
  return [...notifications].sort((a, b) => {
    const bTime = getNotificationActivityTime(b);
    const aTime = getNotificationActivityTime(a);

    return bTime - aTime;
  });
};

export const hasNewerNotificationActivity = (
  currentNotification: NotificationItem,
  nextNotification: NotificationItem
) => {
  return (
    getNotificationActivityTime(nextNotification) >
    getNotificationActivityTime(currentNotification)
  );
};

export const isTradeNotification = (notification: NotificationItem) => {
  const type = notification.type;
  return (
    type.includes("ORDER_COMPLETED") ||
    type.includes("ORDER_CANCELED") ||
    type.includes("LIQUIDATION_COMPLETED") ||
    type.includes("ASSET_TRANSFER_COMPLETED")
  );
};

export const isCommentNotification = (
  notification: Pick<NotificationItem, "type">
) => {
  return (
    notification.type === "POST_COMMENT_CREATED" ||
    notification.type === "REPLY_COMMENT_CREATED"
  );
};

export const getNotificationTradeMeta = (notification: NotificationItem) => {
  if (!isTradeNotification(notification)) {
    return {
      sideLabel: null,
      tone: null,
    } as const;
  }

  return {
    sideLabel: getOrderSideLabel(notification),
    tone: getOrderSideTone(notification),
  } as const;
};

export const formatNotificationTitle = (notification: NotificationItem) => {
  const target = getDisplayTarget(notification);
  const actorName = getActorName(notification);
  const contentSummary = getContentSummary(notification);
  const postTitleSummary = getPostTitleSummary(notification);
  const groupedLikeAdditionalActorCount =
    getGroupedLikeAdditionalActorCount(notification);
  const groupedLikeTotalCount = groupedLikeAdditionalActorCount + 1;
  const groupedLikeActorLabel =
    actorName === "다른 회원"
      ? `회원 ${formatNotificationCount(groupedLikeTotalCount)}명`
      : `${actorName}님 외 ${groupedLikeAdditionalActorCount}명`;

  const type = notification.type;

  if (type.includes("ORDER_COMPLETED")) {
    return [target, "주문 체결되었습니다."].filter(Boolean).join(" ");
  }
  if (type.includes("ORDER_CANCELED")) {
    return [target, "주문 취소되었습니다."].filter(Boolean).join(" ");
  }
  if (type.includes("LIQUIDATION_COMPLETED")) {
    return `⚠️ [청산 알림] ${target} 포지션이 강제 청산되었습니다.`;
  }
  if (type.includes("ASSET_TRANSFER_COMPLETED")) {
    return "🔄 자산 이체가 완료되었습니다.";
  }

  switch (type) {
    case "POST_COMMENT_CREATED":
      if (postTitleSummary) {
        return `${actorName}님이 내 글 "${postTitleSummary}"에 댓글을 남겼습니다.`;
      }

      return contentSummary
        ? `${actorName}님이 내 글에 댓글을 남겼습니다: "${contentSummary}"`
        : `${actorName}님이 내 글에 댓글을 남겼습니다.`;
    case "REPLY_COMMENT_CREATED":
      if (postTitleSummary) {
        return `${actorName}님이 내 글 "${postTitleSummary}"에 댓글을 남겼습니다.`;
      }

      return contentSummary
        ? `${actorName}님이 내 글에 댓글을 남겼습니다: "${contentSummary}"`
        : `${actorName}님이 내 글에 댓글을 남겼습니다.`;
    case "POST_LIKED":
      if (postTitleSummary) {
        if (groupedLikeAdditionalActorCount > 0) {
          return `${groupedLikeActorLabel}이 내 글 "${postTitleSummary}"을 좋아합니다.`;
        }

        return `${actorName}님이 내 글 "${postTitleSummary}"을 좋아합니다.`;
      }

      if (groupedLikeAdditionalActorCount > 0) {
        return `${groupedLikeActorLabel}이 내 게시글을 좋아합니다.`;
      }

      return `${actorName}님이 내 게시글을 좋아합니다.`;
    case "REPLY_LIKED":
      if (postTitleSummary) {
        if (groupedLikeAdditionalActorCount > 0) {
          return `${groupedLikeActorLabel}이 글 "${postTitleSummary}"의 내 댓글을 좋아합니다.`;
        }

        return `${actorName}님이 글 "${postTitleSummary}"의 내 댓글을 좋아합니다.`;
      }

      if (groupedLikeAdditionalActorCount > 0) {
        return `${groupedLikeActorLabel}이 내 댓글을 좋아합니다.`;
      }

      return `${actorName}님이 내 댓글을 좋아합니다.`;
    case "FOLLOW_CREATED":
      return `${actorName}님이 나를 팔로우했습니다.`;
    default:
      return "새 알림이 도착했어요.";
  }
};

export const formatNotificationDescription = (notification: NotificationItem) => {
  const orderQuantity = getOrderQuantity(notification);
  const orderAmount = getOrderAmount(notification);
  const contentSummary = getContentSummary(notification);

  const type = notification.type;

  if (type.includes("ORDER_COMPLETED") || type.includes("ORDER_CANCELED")) {
    return [
      orderQuantity !== null ? `수량 ${formatAssetNumber(orderQuantity)}` : null,
      orderAmount !== null ? `금액 ${formatAssetNumber(orderAmount)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (type.includes("LIQUIDATION_COMPLETED")) {
    const pnl = getPayloadNumericValue(notification.payload, "pnl", "realizedPnl");
    return pnl !== null ? `실현 손익: ${formatAssetNumber(pnl)}` : "담보 부족으로 인한 강제 청산";
  }

  if (type.includes("ASSET_TRANSFER_COMPLETED")) {
    const rawFrom = getPayloadString(notification.payload, "fromType", "fromAccount", "from");
    const rawTo = getPayloadString(notification.payload, "toType", "toAccount", "to");
    
    const getWalletName = (t?: string | null) => {
      if (t === "TRADE_SPOT") return "현물 지갑";
      if (t === "TRADE_FUTURE") return "선물 지갑";
      return t ?? "";
    };

    const from = getWalletName(rawFrom);
    const to = getWalletName(rawTo);
    const amount = getPayloadNumericValue(notification.payload, "amount");
    return `${from} ➔ ${to} (${amount !== null ? formatAssetNumber(amount) : ""})`;
  }

  if (
    notification.type === "POST_COMMENT_CREATED" ||
    notification.type === "REPLY_COMMENT_CREATED"
  ) {
    return contentSummary ? `"${contentSummary}"` : "";
  }

  return "";
};

const createDetailField = (
  label: string,
  value: string | null,
  align: NotificationDetailField["align"] = "left"
) => {
  if (!value) {
    return null;
  }

  return {
    label,
    value,
    align,
  } satisfies NotificationDetailField;
};

export const getNotificationDetailFields = (notification: NotificationItem) => {
  const target = getDisplayTarget(notification);
  const sideLabel = getOrderSideLabel(notification);
  const actorName = getActorName(notification);
  const postTitle = getPostTitle(notification);
  const rawContent = getRawContent(notification);
  const orderQuantity = getOrderQuantity(notification);
  const orderAmount = getOrderAmount(notification);
  const groupedLikeCount = getGroupedLikeCount(notification);

  const type = notification.type;

  if (type.includes("ORDER_COMPLETED") || type.includes("ORDER_CANCELED")) {
    return [
      createDetailField("종목", target),
      createDetailField("주문 방향", sideLabel, "center"),
      createDetailField(
        "수량",
        orderQuantity !== null ? formatAssetNumber(orderQuantity) : null,
        "right"
      ),
      createDetailField(
        "금액",
        orderAmount !== null ? formatAssetNumber(orderAmount) : null,
        "right"
      ),
    ].filter((field): field is NotificationDetailField => field !== null);
  }

  switch (type) {
    case "POST_COMMENT_CREATED":
    case "REPLY_COMMENT_CREATED":
      return [
        createDetailField("글 제목", postTitle),
        createDetailField("작성자", actorName),
        createDetailField("내용", rawContent),
      ].filter((field): field is NotificationDetailField => field !== null);
    case "POST_LIKED":
    case "REPLY_LIKED":
      return [
        createDetailField("사용자", actorName),
        createDetailField(
          "반응 수",
          groupedLikeCount !== null ? `${formatNotificationCount(groupedLikeCount)}명` : null,
          "center"
        ),
        createDetailField("글 제목", postTitle),
        createDetailField("내용", rawContent),
      ].filter((field): field is NotificationDetailField => field !== null);
    case "FOLLOW_CREATED":
      return [
        createDetailField("사용자", actorName),
      ].filter((field): field is NotificationDetailField => field !== null);
    default:
      return [
        createDetailField("내용", rawContent),
      ].filter((field): field is NotificationDetailField => field !== null);
  }
};

export const formatNotificationRelativeTime = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return "";
  }

  const seconds = Math.floor((Date.now() - target.getTime()) / 1000);

  if (seconds < 60) {
    return "방금 전";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}일 전`;
  }

  return formatDateTime(value);
};
