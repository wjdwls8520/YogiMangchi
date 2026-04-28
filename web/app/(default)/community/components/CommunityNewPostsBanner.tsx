"use client";

import Button from "@/components/ui/Button";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { ArrowUp, RefreshCcw } from "lucide-react";

interface Props {
  count?: number;
  open: boolean;
  isRefreshing: boolean;
  onClick: () => void;
}

export default function CommunityNewPostsBanner({
  count,
  open,
  isRefreshing,
  onClick,
}: Props) {
  const headerHeight = useHeaderHeight();
  const message =
    typeof count === "number" && count > 0
      ? `새로운 게시글이 ${count}건 있습니다.`
      : "새로운 게시글이 있습니다.";

  if (!open) {
    return null;
  }

  return (
    <div
      className="sticky z-30 mb-5 flex justify-center"
      style={{ top: headerHeight + 12 }}
    >
      <Button
        type="button"
        variant="blue"
        size="sm"
        onClick={onClick}
        disabled={isRefreshing}
        className="shadow-lg shadow-blue-200/60"
        aria-label={message}
      >
        {isRefreshing ? (
          <RefreshCcw className="mr-1.5 h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
        ) : (
          <ArrowUp className="mr-1.5 h-3.5 w-3.5" strokeWidth={2.4} />
        )}
        {isRefreshing ? "새 게시글 불러오는 중..." : message}
      </Button>
    </div>
  );
}
