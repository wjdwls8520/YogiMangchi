"use client";

import { cn } from "@/lib/utils/cs";
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuType = {
  href: string;
  name: string;
  id: string;
};

type NavMenuProps = {
  classes?: string;
  onClickItem?: () => void;
  variant?: "desktop" | "drawer";
};

const menuList: MenuType[] = [
  { href: "/mock", name: "모의투자", id: "mock" },
  { href: "/trading", name: "트레이딩", id: "trading" },
  { href: "/contest", name: "대회", id: "contest" },
  { href: "/community/all", name: "커뮤니티", id: "community" },
  { href: "/rank", name: "차티스트", id: "rank" },
];

export default function NavMenu({
  classes,
  onClickItem,
  variant = "desktop",
}: NavMenuProps) {
  const pathArr = usePathname().split("/");
  const activeId = pathArr[1] || "Home";
  const isDrawer = variant === "drawer";

  return (
    <nav className={cn("flex md:gap-4", classes)}>
      {menuList.map((menu) => {
        const isActive = activeId === menu.id;

        return (
          <Link
            key={menu.id}
            href={menu.href}
            onClick={onClickItem}
            className={cn(
              "relative transition-all duration-200 group",
              isDrawer
                ? isActive
                  ? "w-full rounded-2xl bg-gray-100 px-4 py-3 text-[15px] font-bold text-gray-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                  : "w-full rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                : isActive
                  ? "rounded-lg px-4 py-2 text-[15px] font-bold text-gray-900 dark:text-white"
                  : "rounded-lg px-4 py-2 text-[15px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            )}
          >
            {menu.name}

            {!isDrawer ? (
              <span
                className={cn(
                  "absolute bottom-[-11px] left-1/2 hidden h-[2px] -translate-x-1/2 bg-[#000] transition-all duration-200 dark:bg-white md:block",
                  isActive ? "w-[60%]" : "w-0 opacity-30 group-hover:w-[60%]"
                )}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
