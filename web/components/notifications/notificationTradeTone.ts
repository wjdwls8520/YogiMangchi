import type { NotificationTradeTone } from "@/types/notification";

export const getNotificationTradeToneStyles = (
  tone: NotificationTradeTone
) => {
  switch (tone) {
    case "buy":
      return {
        accent: "bg-red-500 dark:bg-red-400",
        dot: "bg-red-500 dark:bg-red-400",
        unreadSurface: "bg-red-500/[0.03] dark:bg-red-500/[0.06]",
        highlightSurface: "bg-red-500/[0.08] dark:bg-red-500/[0.12]",
        badge:
          "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300",
        icon:
          "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300",
      } as const;
    case "sell":
      return {
        accent: "bg-blue-500 dark:bg-blue-400",
        dot: "bg-blue-500 dark:bg-blue-400",
        unreadSurface: "bg-blue-500/[0.03] dark:bg-blue-500/[0.06]",
        highlightSurface: "bg-blue-500/[0.08] dark:bg-blue-500/[0.12]",
        badge:
          "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300",
        icon:
          "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-300",
      } as const;
    default:
      return {
        accent: "bg-[#0058FF] dark:bg-[#3B82F6]",
        dot: "bg-[#0058FF] dark:bg-[#60A5FA]",
        unreadSurface: "bg-[#0058FF]/[0.03] dark:bg-[#0058FF]/[0.04]",
        highlightSurface: "bg-[#0058FF]/[0.08] dark:bg-[#0058FF]/[0.12]",
        badge:
          "bg-[#0058FF]/10 text-[#0058FF] dark:bg-[#3B82F6]/15 dark:text-[#60A5FA]",
        icon:
          "bg-blue-50 text-[#0058FF] dark:bg-blue-500/10 dark:text-blue-300",
      } as const;
  }
};
