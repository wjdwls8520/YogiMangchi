"use client";

import { useState, useRef, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const selectTriggerVariants = cva(
  "flex items-center justify-between gap-2 whitespace-nowrap rounded-xl border bg-white text-gray-900 transition-all cursor-pointer focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
  {
    variants: {
      variant: {
        default: "border-gray-200 hover:border-gray-300 focus:border-[#0058FF] focus:ring-[#0058FF]",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900",
        noStyle: "border-0 h-auto gap-1"
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4 text-sm",
        lg: "h-14 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface CustomSelectProps extends VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "선택해주세요",
  variant,
  size,
  disabled,
  className,
  fullWidth = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    if (onChange) onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${fullWidth ? "w-full" : "w-fit"} ${className || ""}`} ref={selectRef}>
      
      <button
        type="button"
        disabled={disabled}
        className={`${selectTriggerVariants({ variant, size })} ${fullWidth ? "w-full" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 min-w-full w-max overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-2">
          {options.map((option) => (
            <li
              key={option.value}
              className={`flex cursor-pointer items-center px-4 py-3 text-sm whitespace-nowrap transition-colors hover:bg-blue-50 hover:text-[#0058FF] ${
                value === option.value
                  ? "bg-blue-50 font-bold text-[#0058FF]"
                  : "text-gray-700"
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}