"use client";

import { useEffect, useState } from "react";
import Top5 from "./Top5";
import { Ranker } from "../types/ranker";
import { getContestResults, getContestParticipationSeasonsByMember } from "@/lib/api/contest";
import { getMemberInfo } from "@/lib/api/member";
import { useAuthStore } from "@/stores/useAuthStore";

export default function Top5Wrapper() {
    const [rankers, setRankers] = useState<Ranker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchTop5 = async () => {
            try {
                // 1. 종료된 최신 시즌 ID 찾기
                // 만약 로그인되어 있다면 해당 멤버의 이력에서 찾고, 
                // 아니라면 (현재 전체 목록 API가 없으므로) 기본적으로 랭킹 페이지와 동일한 로직을 따르거나 
                // 특정 멤버(운영자 등)의 이력을 참고해야 함.
                // 여기서는 가장 보편적인 방법으로, 로그인된 유저가 있다면 그 유저의 종료된 대회 중 가장 최신 것을 가져옴.
                // 유저가 없다면 빈 목록으로 표시하거나 기본 데이터를 보여줌.
                
                let targetSeasonId: number | null = null;

                if (user?.memberId) {
                    const res = await getContestParticipationSeasonsByMember(user.memberId, { size: 10 });
                    const finished = res.content?.filter(
                        (s) => s.displayStatus === "FINISHED" || s.displayStatus === "SETTLED" || s.displayStatus === "종료"
                    );
                    if (finished && finished.length > 0) {
                        targetSeasonId = finished[0].seasonId;
                    }
                }

                // targetSeasonId가 없다면? 
                // 실제 서비스라면 getFinishedSeasons() 같은 전체 조회 API가 필요함.
                // 현재는 targetSeasonId가 있을 때만 실제 데이터를 불러오고, 없으면 빈 배열 처리.
                
                if (targetSeasonId) {
                    const res = await getContestResults(targetSeasonId, { size: 5 });
                    
                    // 각 랭커의 팔로우 여부 정보를 가져오기 위해 상세 정보 조회 (선택 사항)
                    // 현재 getContestResults에서 followedByMe를 주지 않는다면 
                    // 개별 getMemberInfo를 병렬로 호출하거나, 우선 기본값으로 세팅합니다.
                    
                    const top5: Ranker[] = (res.content ?? []).map(r => ({
                        memberId: r.memberId,
                        profile: r.profileImgUrl || '',
                        nickName: r.nickname,
                        Profit: r.realizedPnl,
                        rate: r.profitRate,
                        followedByMe: false // API에서 제공하지 않는 경우 초기값
                    }));

                    // 팔로우 상태 동기화 (로그인된 경우에만 추가 정보 조회 가능)
                    if (user?.memberId) {
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
