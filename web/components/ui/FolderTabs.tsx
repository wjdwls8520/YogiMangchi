"use client";

import { useState } from "react";

export interface FolderTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface FolderTabsProps {
  tabs: FolderTab[];
  defaultActiveId?: string;
  activeId?: string;
  onChange?: (id: string) => void;
  children?: React.ReactNode;
}

export default function FolderTabs({
  tabs,
  defaultActiveId,
  activeId,
  onChange,
  children,
}: FolderTabsProps) {
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId || tabs[0]?.id);
  const currentActiveId = activeId ?? internalActiveId;

  const handleChange = (id: string) => {
    if (activeId === undefined) {
      setInternalActiveId(id);
    }

    onChange?.(id);
  };

  return (
    <div className="w-full">
      {/* 1. 탭 타이틀 영역 (왼쪽 상단 정렬) */}
      <div className="flex items-end gap-0.5 h-12 rounded-t-md bg-gray-50 dark:bg-zinc-950">
        {tabs.map((tab) => {
          const isActive = currentActiveId === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={`
                relative flex items-center justify-center px-6 transition-colors duration-200 rounded-t-lg text-sm
                ${
                  isActive
                    ? // [활성 상태] 바디와 선이 연결되도록 z-index를 높이고 밑으로 2px 당겨서 덮습니다.
                      "z-20 h-11 text-gray-900 dark:text-gray-100 font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-b-white dark:border-b-gray-800 -mb-[2px]"
                    : // [비활성 상태] 바디 뒤로 숨어있는 느낌을 줍니다.
                      "z-0 h-10 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 border-b-transparent hover:bg-gray-200 dark:hover:bg-zinc-800"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. 바디 영역 */}
      <div className="relative z-10 w-full min-h-[300px] p-4 sm:p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl rounded-tl-none transition-colors">
        {children ?? tabs.find((tab) => tab.id === currentActiveId)?.content}
      </div>
    </div>
  );
}
