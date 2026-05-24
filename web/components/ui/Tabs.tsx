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
  variant?: "underline" | "plain"; // 탭 스타일 옵션 추가
  mode?: "light" | "dark"; // 다크모드 옵션 추가
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  tabClassName = "",
  fullWidth = false,
  activeColor,
  size = "md",
  variant = "underline",
  mode,
}: TabsProps) {
  const isDark = mode === "dark";

  // 기본 색상 설정 (mode에 따라 다르게)
  const defaultActiveColor = isDark
    ? "text-white border-white"
    : "text-gray-900 border-gray-900 dark:text-white dark:border-white";

  const finalActiveColor = activeColor || defaultActiveColor;
  
  return (
    // 전체 컨테이너: 하단에 연한 회색 보더를 깔아줍니다 (underline인 경우만)
    <div className={cn(
      "flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", 
      variant === "underline" && cn("border-b", isDark ? "border-white/5" : "border-gray-200 dark:border-gray-800"), 
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        // 탭 전용 색상이 있으면 그걸 쓰고, 없으면 전체 기본 색상(검정)을씀.
        const currentTabColor = tab.activeColor || activeColor;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            // 🌟 탭이 꽉 차야 하면 flex-1 적용, 아니면 글자 크기만큼만 (기본 갭은 우측에 마진으로 주거나 부모에 gap 줘도 됨)
            className={cn(
              "relative transition-all duration-200 shrink-0",
              size === "sm" ? "pt-1.5 pb-1.5 text-[12px]" : "pt-2.5 pb-2.5 sm:pt-3 sm:pb-3 text-[13px] sm:text-base",
              fullWidth
                ? "flex-1 text-center"
                : size === "sm" 
                  ? "min-w-[56px] whitespace-nowrap text-center px-2"
                  : "min-w-[72px] sm:min-w-[112px] whitespace-nowrap text-center px-3 sm:px-4",
              isActive 
                ? cn(
                    "font-black transition-all", 
                    variant === "underline" && (size === "sm" ? "border-b-2" : "border-b-[3px]"),
                    currentTabColor || finalActiveColor
                  )
                : cn(
                    "font-bold transition-all",
                    isDark ? "text-white/30 hover:text-white/50" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400",
                    variant === "underline" && (size === "sm" ? "border-b-2 border-transparent" : "border-b-[3px] border-transparent")
                  ),
              tabClassName
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// cn 헬퍼가 필요할 수 있으므로 상단에 추가 (이미 있으면 무시)
import { cn } from "@/lib/utils/cs";
