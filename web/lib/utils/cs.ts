import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getProfitColorClass = (value?: number | null) => {
  if ((value ?? 0) > 0) return "text-red-500 font-black";
  if ((value ?? 0) < 0) return "text-blue-500 font-black";
  return "text-gray-900 font-black";
};

export const getSideColorClass = (side: "BUY" | "SELL" | "LONG" | "SHORT") => {
  if (side === "BUY" || side === "LONG") return "text-red-500 font-black";
  return "text-blue-500 font-black";
};