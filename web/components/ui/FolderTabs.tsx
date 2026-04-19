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
      <div className="flex items-end gap-0.5">
        {tabs.map((tab) => {
          const isActive = currentActiveId === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={`
                relative flex items-center justify-center px-6 transition-colors duration-200 rounded-t-md text-sm
                ${
                  isActive
                    ? // [활성 상태] 바디와 선이 연결되도록 z-index를 높이고 밑으로 2px 당겨서 덮습니다.
                      "z-20 h-11 text-gray-900 font-bold bg-white border-1 border-gray-200 border-b-white -mb-[2px]"
                    : // [비활성 상태] 바디 뒤로 숨어있는 느낌을 줍니다.
                      "z-0 h-10 text-gray-100 bg-gray-700 border-1 border-gray-700 border-b-transparent hover:bg-gray-900"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. 바디 영역 */}
      <div className="relative z-10 w-full min-h-[300px] p-8 bg-white border-1 border-gray-200 rounded-xl rounded-tl-none">
        {children ?? tabs.find((tab) => tab.id === currentActiveId)?.content}
      </div>
    </div>
  );
}
