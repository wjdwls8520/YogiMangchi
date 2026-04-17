"use client";

interface SubTabsProps {
  tabs: { label: string; value: string }[];
  activeTab: string;
  onChange: (value: string) => void;
}

export default function SubTabs({ tabs, activeTab, onChange }: SubTabsProps) {
  return (
    <div className="flex gap-5 px-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`
              relative py-1 text-xs transition-colors
              ${isActive ? "font-black text-gray-900" : "font-bold text-gray-400 hover:text-gray-600"}
            `}
          >
            {tab.label}
            {/* 활성화 시 우측 상단에 보라색 도트 표시 */}
            {isActive && (
              <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 bg-purple-600 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}