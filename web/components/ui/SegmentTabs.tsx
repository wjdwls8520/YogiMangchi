"use client";

export interface SegmentTabOption {
  label: string;
  value: string;
}

type SegmentTabsSize = "sm" | "md" | "lg" | "xl";
type SegmentTabsRadius = "none" | "md" | "lg" | "xl" | "full";

const SIZE_CLASSES: Record<
  SegmentTabsSize,
  { button: string; compactPadding: string }
> = {
  sm: {
    button: "py-1.5 text-xxs",
    compactPadding: "px-3",
  },
  md: {
    button: "py-2 text-xs",
    compactPadding: "px-4",
  },
  lg: {
    button: "py-2.5 text-sm",
    compactPadding: "px-5",
  },
  xl: {
    button: "py-3 text-sm",
    compactPadding: "px-6",
  },
};

const RADIUS_CLASSES: Record<
  SegmentTabsRadius,
  { wrapper: string; button: string }
> = {
  none: {
    wrapper: "",
    button: "",
  },
  md: {
    wrapper: "rounded-md",
    button: "rounded",
  },
  lg: {
    wrapper: "rounded-lg",
    button: "rounded-md",
  },
  xl: {
    wrapper: "rounded-xl",
    button: "rounded-lg",
  },
  full: {
    wrapper: "rounded-full",
    button: "rounded-full",
  },
};

type SegmentTabsProps = {
  tabs: SegmentTabOption[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
  fullWidth?: boolean;
  size?: SegmentTabsSize;
  radius?: SegmentTabsRadius;
};

export default function SegmentTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  fullWidth = true,
  size = "md",
  radius = "none",
}: SegmentTabsProps) {
  const sizeClasses = SIZE_CLASSES[size];
  const radiusClasses = RADIUS_CLASSES[radius];

  return (
    <div className={`flex gap-1 ${radiusClasses.wrapper} ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`border font-black transition-all ${sizeClasses.button} ${radiusClasses.button} ${
              fullWidth ? "flex-1" : `flex-none ${sizeClasses.compactPadding}`
            } ${
              isActive
                ? "border-gray-800 bg-gray-800 text-white"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
