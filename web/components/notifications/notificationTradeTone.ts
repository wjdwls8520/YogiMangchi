import type { NotificationTradeTone } from "@/types/notification";

export const getNotificationTradeToneStyles = (
  tone: NotificationTradeTone
) => {
  switch (tone) {
    case "buy":
      return {
        accent: "bg-[#E12343]",
        dot: "bg-[#E12343]",
        unreadSurface: "bg-[#E12343]/[0.03]",
        highlightSurface: "bg-[#E12343]/[0.08]",
        badge: "bg-[#E12343]/10 text-[#E12343]",
        icon: "bg-[#E12343]/10 text-[#E12343]",
      } as const;
    case "sell":
      return {
        accent: "bg-[#1763B6]",
        dot: "bg-[#1763B6]",
        unreadSurface: "bg-[#1763B6]/[0.03]",
        highlightSurface: "bg-[#1763B6]/[0.08]",
        badge: "bg-[#1763B6]/10 text-[#1763B6]",
        icon: "bg-[#1763B6]/10 text-[#1763B6]",
      } as const;
    case "long":
      return {
        accent: "bg-[#2EBD85]",
        dot: "bg-[#2EBD85]",
        unreadSurface: "bg-[#2EBD85]/[0.03]",
        highlightSurface: "bg-[#2EBD85]/[0.08]",
        badge: "bg-[#2EBD85]/10 text-[#2EBD85]",
        icon: "bg-[#2EBD85]/10 text-[#2EBD85]",
      } as const;
    case "short":
      return {
        accent: "bg-[#F6465D]",
        dot: "bg-[#F6465D]",
        unreadSurface: "bg-[#F6465D]/[0.03]",
        highlightSurface: "bg-[#F6465D]/[0.08]",
        badge: "bg-[#F6465D]/10 text-[#F6465D]",
        icon: "bg-[#F6465D]/10 text-[#F6465D]",
      } as const;
    case "warning":
      return {
        accent: "bg-[#F0B90B]",
        dot: "bg-[#F0B90B]",
        unreadSurface: "bg-[#F0B90B]/[0.03]",
        highlightSurface: "bg-[#F0B90B]/[0.08]",
        badge: "bg-[#F0B90B]/15 text-[#F0B90B] font-bold",
        icon: "bg-[#F0B90B]/15 text-[#F0B90B]",
      } as const;
    case "info":
      return {
        accent: "bg-purple-500",
        dot: "bg-purple-500",
        unreadSurface: "bg-purple-500/[0.03]",
        highlightSurface: "bg-purple-500/[0.08]",
        badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        icon: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      } as const;
    default:
      return {
        accent: "bg-gray-400 dark:bg-gray-500",
        dot: "bg-gray-400 dark:bg-gray-500",
        unreadSurface: "bg-gray-400/[0.03] dark:bg-gray-500/[0.05]",
        highlightSurface: "bg-gray-400/[0.08] dark:bg-gray-500/[0.12]",
        badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        icon: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      } as const;
  }
};
