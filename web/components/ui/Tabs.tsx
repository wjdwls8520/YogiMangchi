"use client";

import type { ReactNode } from "react";

export interface TabOption {
  label: ReactNode;
  value: string;
  activeColor?: string; // 탭마다 다른색상 줄수있는 옵션추가
}

interface TabsProps {
  tabs: TabOption[];             // 탭 목록 데이터
  activeTab: string;             // 현재 활성화된 탭의 value
  onChange: (value: string) => void; // 탭 클릭 시 실행될 함수
  className?: string;            // 전체 영역 여백 등 커스텀용
  tabClassName?: string;         // 개별 탭 버튼 커스텀용
  fullWidth?: boolean;           // true면 탭들이 1/n로 꽉 차게 늘어남
  activeColor?: string; // 컴포넌트 전체의 기본 색상
  size?: "sm" | "md"; // 탭 크기 옵션 추가
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  tabClassName = "",
  fullWidth = false,
  activeColor = "text-gray-900 border-gray-900 dark:text-gray-300 dark:border-gray-300", // 기본값은 검정
  size = "md",
}: TabsProps) {
  
  return (
    // 전체 컨테이너: 하단에 연한 회색 보더를 깔아줍니다.
    <div className={`flex border-b border-gray-200 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        // 탭 전용 색상이 있으면 그걸 쓰고, 없으면 전체 기본 색상(검정)을씀.
        const currentTabColor = tab.activeColor || activeColor;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            // 🌟 탭이 꽉 차야 하면 flex-1 적용, 아니면 글자 크기만큼만 (기본 갭은 우측에 마진으로 주거나 부모에 gap 줘도 됨)
            className={`
              relative transition-all duration-200
              ${size === "sm" ? "pb-1.5 text-[12px]" : "pb-3"}
              ${
                fullWidth
                  ? "flex-1 text-center"
                  : size === "sm" 
                    ? "min-w-[64px] whitespace-nowrap text-center px-3"
                    : "min-w-[112px] whitespace-nowrap text-center"
              }
              ${isActive 
                ? `font-black ${size === "sm" ? "border-b-2" : "border-b-[3px]"} ${currentTabColor}`
                : `font-bold text-gray-400 ${size === "sm" ? "border-b-2" : "border-b-[3px]"} border-transparent hover:text-gray-600`
              }
              ${tabClassName}
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
