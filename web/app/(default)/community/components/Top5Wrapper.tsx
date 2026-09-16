"use client";

import { useEffect, useState } from "react";
import Top5 from "./Top5";
import { Ranker } from "../types/ranker";
import { getLatestFinishedContestResults } from "@/lib/api/contest";
import { getMemberInfo } from "@/lib/api/member";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Top5Wrapper() {
    const [rankers, setRankers] = useState<Ranker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchTop5 = async () => {
            try {
                // [비로그인 전용 복사본 API 사용]
                // /community/all 및 /community/all/{id} 우측 사이드바:
                // 비로그인 사용자도 가장 최근 종료된 대회의 상위 5명 순위를 즉시 조회
                const res = await getLatestFinishedContestResults({ size: 5 });

                const top5: Ranker[] = (res.content ?? []).map(r => ({
                    memberId: r.memberId,
                    profile: r.profileImgUrl || '',
                    nickName: r.nickname,
                    Profit: r.realizedPnl,
                    rate: r.profitRate,
                    followedByMe: false // 기본값
                }));

                // 팔로우 상태 동기화 (로그인된 경우에만 내 팔로우 여부 조회)
                if (user?.memberId && top5.length > 0) {
                    const resultsWithFollow = await Promise.all(
                        top5.map(async (ranker) => {
                            try {
                                const memberInfo = await getMemberInfo(ranker.memberId);
                                return { ...ranker, followedByMe: memberInfo.followedByMe };
                            } catch {
                                return ranker;
                            }
                        })
                    );
                    setRankers(resultsWithFollow);
                } else {
                    setRankers(top5);
                }
            } catch (error) {
                console.error("Top5 데이터를 가져오는데 실패했습니다:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTop5();
    }, [user]);

    if (isLoading) {
        return (
            <div className="card animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gray-200 rounded"></div>
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 데이터가 없을 경우 하드코딩된 기본값 대신 안내 문구 표시 가능
    if (rankers.length === 0) {
        return (
            <div className="card text-center py-10 text-gray-400 font-medium">
                표시할 대회 순위가 없습니다.
            </div>
        );
    }

    return <Top5 ranker={rankers} />;
}
