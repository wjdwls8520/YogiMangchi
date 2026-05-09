"use client";

import { useState } from "react";
import RankItem from "./components/RankItem";
import Tabs from "@/components/ui/Tabs";
import { Info } from "./types/user";
import { useUIStore } from "@/stores/useUIStore";

const menus = [
  { value: "profit", label: "수익금 높은순" },
  { value: "rate", label: "수익률 높은순" },
  { value: "followers", label: "팔로워 많은순" },
];

export default function RankPage() {
  const [activeTab, setActiveTab] = useState("profit");
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  const users: Info[] = [
    {
      profile: "",
      nickName: "주식고수",
      title: "단타왕",
      rate: 170,
      follower: 536,
    },
    {
      profile: "",
      nickName: "병아리",
      title: "기술적 분석가",
      rate: 166,
      follower: 411,
    },
    {
      profile: "",
      nickName: "ABDD11",
      title: "코인 전문가",
      rate: 161,
      follower: 511,
    },
    {
      profile: "",
      nickName: "돈많은백수",
      title: "배당주 마스터",
      rate: 128,
      follower: 389,
    },
    {
      profile: "",
      nickName: "돈많은백수2",
      title: "배당주 마스터",
      rate: 121,
      follower: 380,
    },
    {
      profile: "",
      nickName: "돈많은백수3",
      title: "배당주 마스터",
      rate: 108,
      follower: 324,
    },
  ];

  return (
    <div className="flex flex-col gap-6 min-h-screen transition-colors">
      <div className="border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs
            tabs={menus}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
            size="md"
            mode={isDarkMode ? "dark" : "light"}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 w-full">
        <ul className="grid md:grid-cols-3 grid-cols-1 md:gap-7 gap-5">
          {users.map((user, index) => (
            <RankItem key={user.nickName} rank={index + 1} {...user} />
          ))}
        </ul>
      </div>
    </div>
  );
}