"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Ranker } from "../types/ranker";
import UserAvatar from "@/components/user/UserAvatar";
import { useHeaderHeight } from "@/hooks/useHeaderHeight";
import { cn } from "@/lib/utils/cs";
import Button from "@/components/ui/Button";
import { followMember, unfollowMember } from "@/lib/api/member";
import { useWithAuth } from "@/hooks/useWithAuth";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useAuthStore } from "@/stores/useAuthStore";


interface Rankers {
  ranker: Ranker[];
}

export default function Top5({ranker} :Rankers) {

    const headerHeight = useHeaderHeight();
    const withAuth = useWithAuth();
    const { toast } = useFeedback();
    const { user: currentUser } = useAuthStore();
    const asideRef = useRef<HTMLElement>(null);
    const [position, setPosition] = useState({
        left: 0,
        width: 0,
        ready: false,
    });

    // 팔로우 로딩 상태 관리
    const [followLoadingMap, setFollowLoadingMap] = useState<Record<number, boolean>>({});
    // 팔로우 로컬 상태 반영 (UI 즉시 응답을 위함)
    const [localRankers, setLocalRankers] = useState<Ranker[]>(ranker);

    useEffect(() => {
        setLocalRankers(ranker);
    }, [ranker]);

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

    const handleFollowToggle = (memberId: number, isFollowing: boolean) => {
        withAuth(async () => {
            setFollowLoadingMap(prev => ({ ...prev, [memberId]: true }));
            try {
                if (isFollowing) {
                    await unfollowMember(memberId);
                    toast({ title: "팔로우를 취소했습니다.", tone: "success" });
                } else {
                    await followMember(memberId);
                    toast({ title: "팔로우했습니다.", tone: "success" });
                }

                // 로컬 상태 업데이트
                setLocalRankers(prev => prev.map(r => 
                    r.memberId === memberId ? { ...r, followedByMe: !isFollowing } : r
                ));
            } catch (error) {
                console.error("팔로우 작업 실패:", error);
                toast({ title: "요청 처리에 실패했습니다.", tone: "error" });
            } finally {
                setFollowLoadingMap(prev => ({ ...prev, [memberId]: false }));
            }
        })(); // <--- 반환된 함수를 실행해야 합니다.
    };

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
                        대회투자 TOP5
                        <span className="text-[14px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full tracking-tighter">FINISH</span>
                    </h2>
                    <p className="text-[13px] text-gray-400 mt-1">종료된 최신 대회 기준</p>
                </div>
            </div>

            <ul className="flex flex-col gap-5">
                {localRankers.map((user, index) => (
                    <li 
                        key={user.memberId} 
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
                        <Link href={`/member/${user.memberId}`} className="relative shrink-0 transition-transform hover:scale-105">
                            <UserAvatar profileImg={user.profile} classes="w-[40px] h-[40px] border border-gray-50" />
                        </Link>

                        {/* 유저 정보 */}
                        <div className="flex-auto min-w-0">
                            <Link href={`/member/${user.memberId}`} className="block">
                                <p className="truncate text-[15px] font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 transition-colors">
                                    {user.nickName}
                                </p>
                            </Link>
                            <p className="text-xs font-medium text-rose-500 mt-0.5">
                                +{user.Profit.toLocaleString()}원 
                                <span className="ml-1 text-[12px] opacity-80">({user.rate}%)</span>
                            </p>
                        </div>

                        {/* 팔로우 버튼 */}
                        {currentUser?.memberId !== user.memberId && (
                            <Button 
                                variant={user.followedByMe ? "gray" : "white"}
                                size="sm"
                                className="shrink-0 h-7 px-2.5 rounded-lg text-[12px] font-bold"
                                onClick={() => handleFollowToggle(user.memberId, !!user.followedByMe)}
                                disabled={followLoadingMap[user.memberId]}
                            >
                                {followLoadingMap[user.memberId] ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : user.followedByMe ? (
                                    "팔로잉"
                                ) : (
                                    "팔로우"
                                )}
                            </Button>
                        )}
                    </li>
                ))}
            </ul>

            {/* 하단 장식/링크 (선택사항) */}
            <Link
                href="/rank?tab=contest"
                className="block w-full mt-6 border-t border-gray-100 dark:border-gray-800 py-3 text-center text-[14px] font-semibold text-gray-400 transition-colors hover:text-gray-600"
            >
                전체 랭킹 보러가기 〉
            </Link>
        </div>
        </div>
    </aside>
    )
}
