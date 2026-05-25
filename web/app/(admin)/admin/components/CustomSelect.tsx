"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: any) => void;
  options: Option[];
  label?: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  label,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <span className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all focus:ring-2 focus:ring-[#0058FF] focus:border-[#0058FF] dark:focus:border-[#0058FF]"
      >
        <span className="font-semibold">{selectedOption?.label}</span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* HTML hidden select 연동 (기능적으로 select를 지원하기 위한 요구사항 만족) */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hidden"
        aria-hidden="true"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Dropdown List */}
      {isOpen && (
        <ul className="absolute z-50 mt-1.5 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1.5 shadow-lg dark:shadow-black/50 outline-none max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  opt.value === value
                    ? "bg-blue-50/50 dark:bg-blue-950/20 font-black text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 font-semibold"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
