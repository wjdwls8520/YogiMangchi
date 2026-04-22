"use client";

import { useRouter } from "next/navigation";
import Tabs from "@/components/ui/Tabs";
import { COMMUNITY_TABS } from "../constants";

interface Props {
  activeTab: string;
}

export default function CommunityTabs({ activeTab }: Props) {
  const router = useRouter();

  return (
    <Tabs
      tabs={COMMUNITY_TABS}
      activeTab={activeTab}
      onChange={(value) => router.push(`/community/${value}`)}
      className="mb-10"
    />
  );
}
