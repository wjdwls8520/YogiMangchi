"use client";
import { cn } from "@/utils/cs";
import { useState } from "react";

export default function SubMenu() {
    type Menu = {
        id: string;
        label: string;
    };

    const menus :Menu[]  = [
        { id: "profit", label: "수익금 높은순" },
        { id: "rate", label: "수익률 높은순" },
        { id: "followers", label: "팔로워 많은순" },
    ];

    const [active, setActive] = useState(menus[0].id);

    return (
        <ul className="flex gap-7 text-lg pt-11.25 border-b border-gray-300 mb-10">
            {menus.map((menu) => <li 
                                    key={menu.id} 
                                    className={cn("cursor-pointer leading-12", 
                                                    active === menu.id ? 
                                                                "text-black font-semibold border-b-2" : 
                                                                "text-gray-400 font-medium")}
                                    onClick={() => setActive(menu.id)}
                                >
                                    {menu.label}
                                </li>
            )}
        </ul>
    )
}