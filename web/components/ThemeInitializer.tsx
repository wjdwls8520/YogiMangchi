"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/useUIStore";

export default function ThemeInitializer() {
  const isDarkMode = useUIStore((state) => state.isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Initial sync to avoid flicker (as much as possible in client-side)
  useEffect(() => {
    const root = document.documentElement;
    const initialDark = useUIStore.getState().isDarkMode;
    if (initialDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return null;
}
