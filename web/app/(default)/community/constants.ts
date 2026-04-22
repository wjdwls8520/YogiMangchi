import type { TabOption } from "@/components/ui/Tabs";

export const COMMUNITY_TABS: TabOption[] = [
  { label: "전체글", value: "all" },
  { label: "주간 인기글", value: "best" },
  { label: "최신글", value: "latest" },
];

export const COMMUNITY_LIST_CATEGORIES = new Set(
  COMMUNITY_TABS.map((tab) => tab.value)
);
