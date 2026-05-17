import NotificationsPageView from "@/components/notifications/NotificationsPageView";
import { Suspense } from "react";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div>불러오는 중...</div>}>
      <NotificationsPageView />
    </Suspense>
  );
}
