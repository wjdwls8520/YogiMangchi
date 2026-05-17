"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ranker } from "../types/ranker";
import UserAvatar from "@/components/user/UserAvatar";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { cn } from "@/lib/utils/cs";


interface Rankers {
  ranker: Ranker[];
}

export default function Top5({ranker} :Rankers) {

    const headerHeight = useHeaderHeight();
    const asideRef = useRef<HTMLElement>(null);
    const [position, setPosition] = useState({
        left: 0,
        width: 0,
        ready: false,
    });

    useEffect(() => {
        const updatePosition = () => {
            if (!asideRef.current) {
                return;
            }

            const rect = asideRef.current.getBoundingClientRect();
            setPosition({
                left: rect.left,
                width: rect.width,
                ready: true,
            });
        };

        updatePosition();

        const resizeObserver = new ResizeObserver(() => {
            updatePosition();
        });

        if (asideRef.current) {
            resizeObserver.observe(asideRef.current);
        }

        window.addEventListener("resize", updatePosition);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updatePosition);
        };
    }, []);

    return (
        <aside 
        ref={asideRef}
        className="self-start pt-6"
    >
        <div
            className={cn("fixed z-40", !position.ready && "invisible")}
            style={{
                top: headerHeight + 48,
                left: position.left,
                width: position.width,
            }}
        >
        <div className="card">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
                        실시간 투자 랭킹 
                        <span className="text-[14px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">TOP 5</span>
                    </h2>
                    <p className="text-[13px] text-gray-400 mt-1">최근 1주일 수익금 기준</p>
                </div>
            </div>

            <ul className="flex flex-col gap-5">
                {ranker.map((user, index) => (
                    <li 
                        key={user.nickName} 
                        className="group flex items-center gap-3 transition-all"
                    >
                        {/* 순위 표시 */}
                        <div className="w-5 text-center flex-shrink-0">
                            <span className={cn(
                                "text-[15px] font-bold",
                                index === 0 ? "text-yellow-500" : 
                                index === 1 ? "text-gray-400" : 
                                index === 2 ? "text-orange-400" : "text-gray-300"
                            )}>
                                {index + 1}
                            </span>
                        </div>

                        {/* 아바타 */}
                        <div className="relative shrink-0">
                            <UserAvatar profileImg={user.profile} classes="w-[40px] h-[40px] border border-gray-50" />
                        </div>

                        {/* 유저 정보 */}
                        <div className="flex-auto min-w-0">
                            <p className="truncate text-[15px] font-bold text-gray-800 dark:text-gray-200">
                                {user.nickName}
                            </p>
                            <p className="text-xs font-medium text-rose-500 mt-0.5">
                                +{user.Profit.toLocaleString()}원 
                                <span className="ml-1 text-[12px] opacity-80">({user.rate}%)</span>
                            </p>
                        </div>

                        {/* 팔로우 버튼 - 더 미니멀하게 수정 */}
                        <button 
                            type="button" 
                            className="shrink-0 h-8 px-3 rounded-lg text-[13px] font-bold bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                        >
                            팔로우
                        </button>
                    </li>
                ))}
            </ul>

            {/* 하단 장식/링크 (선택사항) */}
            <Link
                href="/rank"
                className="block w-full mt-6 border-t border-gray-50 py-3 text-center text-[14px] font-semibold text-gray-400 transition-colors hover:text-gray-600"
            >
                전체 랭킹 보러가기 〉
            </Link>
        </div>
        </div>
    </aside>
    )
}
