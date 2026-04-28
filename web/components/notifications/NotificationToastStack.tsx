"use client";

import { cn } from "@/lib/utils/cs";
import {
  formatNotificationRelativeTime,
  isCommentNotification,
} from "@/lib/utils/notification";
import type { NotificationToastItem } from "@/types/notification";
import { Bell, CornerDownRight, X } from "lucide-react";
import { getNotificationTradeToneStyles } from "./notificationTradeTone";

interface NotificationToastStackProps {
  toasts: NotificationToastItem[];
  onDismiss: (toastId: string) => void;
}

export default function NotificationToastStack({
  toasts,
  onDismiss,
}: NotificationToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-0 top-full z-[60] mt-3 flex w-[calc(100vw-2rem)] max-w-[360px] flex-col gap-2">
      {toasts.map((toast) => {
        const toneStyles = getNotificationTradeToneStyles(toast.tradeTone ?? null);
        const shouldShowCommentIcon = isCommentNotification(toast);

        return (
          <div
            key={toast.id}
            className="pointer-events-auto relative overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
            role="status"
            aria-live="polite"
          >
            {toast.tradeSideLabel ? (
              <div className={cn("absolute left-0 top-0 h-full w-[3px]", toneStyles.accent)} />
            ) : null}

            <div className="flex items-start gap-3 p-4">
              <div
                className={cn(
                  "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  toneStyles.icon
                )}
              >
                <Bell className="h-4 w-4" strokeWidth={2.2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-left text-sm font-semibold text-gray-900 dark:text-white">
                      새 알림
                    </p>

                    {toast.tradeSideLabel ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide",
                          toneStyles.badge
                        )}
                      >
                        {toast.tradeSideLabel}
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-center text-[11px] text-gray-400">
                    {formatNotificationRelativeTime(toast.createdAt)}
                  </span>
                </div>

                <p className="mt-1 text-left text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                  {toast.title}
                </p>

                {toast.description ? (
                  <div className="mt-1 flex items-start gap-1.5 text-left text-xs leading-5 text-gray-500 dark:text-gray-400">
                    {shouldShowCommentIcon ? (
                      <CornerDownRight
                        className="mt-[3px] h-3.5 w-3.5 shrink-0"
                        strokeWidth={2}
                      />
                    ) : null}
                    <span className="min-w-0">{toast.description}</span>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                aria-label="알림 토스트 닫기"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
