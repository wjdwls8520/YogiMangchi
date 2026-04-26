export type NotificationCategory =
  | "MOCK"
  | "TRADE"
  | "CONTEST"
  | "COMMUNITY"
  | "FOLLOW"
  | "REPORT"
  | string;

export type NotificationType =
  | "ORDER_COMPLETED"
  | "ORDER_CANCELED"
  | "POST_COMMENT_CREATED"
  | "REPLY_COMMENT_CREATED"
  | "POST_LIKED"
  | "REPLY_LIKED"
  | "FOLLOW_CREATED"
  | string;

export type NotificationPayload = Record<string, unknown>;
export type NotificationTradeTone = "buy" | "sell" | null;

export interface NotificationItem {
  notificationId: number;
  actorMemberId: number | null;
  category: NotificationCategory;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  lastEventAt?: string | null;
  payload?: NotificationPayload | null;
}

export interface NotificationStatusResponse {
  newCount: number;
  hasNew: boolean;
  unreadCount: number;
  hasUnread: boolean;
}

export interface CursorResponseDto<T> {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
}

export interface NotificationListParams {
  cursorId?: number;
  size?: number;
  category?: NotificationCategory;
  read?: boolean;
}

export interface NotificationToastItem {
  id: string;
  notificationId: number;
  title: string;
  description?: string;
  createdAt: string;
  tradeSideLabel?: string | null;
  tradeTone?: NotificationTradeTone;
}
