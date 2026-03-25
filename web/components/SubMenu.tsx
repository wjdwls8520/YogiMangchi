"use client";
import { cn } from "@/utils/cs";
import { useState } from "react";

type Menu = {
  id: string;
  label: string;
};

interface SubMenuProps {
  menus: Menu[];
}

export default function SubMenu({ menus }: SubMenuProps) {

    const [active, setActive] = useState(menus[0].id);

    return (
        <ul className="flex gap-7 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-touch touch-pan-y w-full text-lg border-b border-gray-300 mb-10">
            {menus.map((menu) => <li 
                                    key={menu.id} 
                                    className={cn("snap-start shrink-0 cursor-pointer leading-12", 
                                                    active === menu.id ? 
                                                                "font-semibold border-b-2" : 
                                                                "text-gray-400 font-medium")}
                                    onClick={() => setActive(menu.id)}
                                >
                                    {menu.label}
                                </li>
            )}
        </ul>
    )
}