"use client";
import { useEffect, useState } from "react";
import { X } from 'lucide-react';
import Button from "../ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import {
  applyContestSeason,
  getRecruitingContestSeasons,
  translateContestDisplayStatus,
  type ContestSeason,
} from "@/lib/api/contest";
import { formatDateTime } from "@/lib/utils/date";

export default function ContestDetailModal({ onClose }: { onClose: () => void }) {
    const isLogin = useAuthStore((state) => state.isLogin);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const [contestSeasons, setContestSeasons] = useState<ContestSeason[]>([]);
    const [isLoadingSeason, setIsLoadingSeason] = useState(true);
    const [seasonErrorMessage, setSeasonErrorMessage] = useState("");
    const [applyingSeasonId, setApplyingSeasonId] = useState<number | null>(null);
    const canViewContest = isLogin && !!user && user.role !== "USER";

    useEffect(() => {
        if (!canViewContest) {
            setContestSeasons([]);
            setIsLoadingSeason(false);
            setSeasonErrorMessage(
                !isLogin || !user
                    ? "로그인 후 대회 정보를 확인할 수 있습니다."
                    : "대회 정보는 인증회원만 확인할 수 있습니다."
            );
            return;
        }

        let isActive = true;

        const loadRecruitingSeason = async () => {
            setIsLoadingSeason(true);
            setSeasonErrorMessage("");

            try {
                const response = await getRecruitingContestSeasons({ size: 10 });
                const nextSeasons =
                    response && Array.isArray(response.content)
                        ? response.content
                        : [];

                if (!isActive) {
                    return;
                }

                setContestSeasons(nextSeasons);
            } catch (error) {
                if (!isActive) {
                    return;
                }

                const message = error instanceof Error ? error.message : "";

                if (message.includes("401") || message.includes("403")) {
                    setContestSeasons([]);
                    setSeasonErrorMessage("대회 정보를 불러올 수 없습니다.");
                    return;
                }

                console.error("대회 시즌 조회 실패:", error);
                setContestSeasons([]);
                setSeasonErrorMessage("모집중인 대회 정보를 불러오지 못했습니다.");
            } finally {
                if (isActive) {
                    setIsLoadingSeason(false);
                }
            }
        };

        void loadRecruitingSeason();

        return () => {
            isActive = false;
        };
    }, [canViewContest, isLogin, user]);

    const handleApply = async (season: ContestSeason) => {
        if (isLoadingSeason) {
            return;
        }

        if (!isLogin || !user) {
            alert("로그인이 필요한 서비스입니다.");
            router.push("/login");
            return;
        }

        if (user.role === "USER") {
            alert("본인인증이 필요한 서비스입니다.");
            router.push("/verify");
            return;
        }

        try {
            setApplyingSeasonId(season.id);
            await applyContestSeason(season.id);
            setContestSeasons((prev) =>
              prev.map((item) =>
                item.id === season.id
                  ? {
                      ...item,
                      appliedByMe: true,
                    }
                  : item
              )
            );
            alert("대회 신청이 완료되었습니다.");
        } catch (error) {
            console.error("대회 신청 실패:", error);
            alert("대회 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setApplyingSeasonId(null);
        }
    };



  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 배경 (Dim) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 모달 콘텐츠 */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-zinc-900 dark:hover:text-white">
          <X className="w-8 h-8" />
        </button>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
            모집중 대회 목록
          </span>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {isLoadingSeason ? (
            <div className="rounded-xl bg-gray-50 p-4 text-xs font-bold text-gray-400 dark:bg-zinc-800">
              모집중인 대회 정보를 불러오는 중입니다.
            </div>
          ) : seasonErrorMessage ? (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-500 dark:bg-zinc-800">
              {seasonErrorMessage}
            </div>
          ) : contestSeasons.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-4 text-xs font-bold text-gray-400 dark:bg-zinc-800">
              현재 모집중인 대회가 없습니다.
            </div>
          ) : (
            contestSeasons.map((season) => {
              const isAlreadyApplied = season.appliedByMe === true;
              const isApplying = applyingSeasonId === season.id;
              const normalizedStatus = season.isRecruiting
                ? "모집중"
                : translateContestDisplayStatus(season);
              const isRecruiting = season.isRecruiting !== false;

              return (
                <div
                  key={season.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-base font-black text-zinc-900 dark:text-white">
                      {season.title}
                    </p>
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {normalizedStatus}
                    </span>
                  </div>

                  <p className="mb-4">{season.description}</p>
                  <p>
                    • <strong>모집 기간 :</strong> {formatDateTime(season.recruitmentStartAt)} ~ {formatDateTime(season.recruitmentEndAt)}
                  </p>
                  <p>
                    • <strong>대회 기간 :</strong> {formatDateTime(season.contestStartAt)} ~ {formatDateTime(season.contestEndAt)}
                  </p>

                  {isAlreadyApplied ? (
                    <div className="mt-4 rounded-xl bg-blue-50 p-4 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      이미 이 대회에 신청한 상태입니다.
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Button
                      onClick={() => handleApply(season)}
                      size="lg"
                      fullWidth
                      disabled={
                        isLoadingSeason ||
                        isApplying ||
                        isAlreadyApplied ||
                        !canViewContest ||
                        !isRecruiting
                      }
                    >
                      {isAlreadyApplied
                        ? "이미 신청한 대회입니다"
                        : isApplying
                          ? "신청 처리 중..."
                          : !isRecruiting
                            ? "모집이 종료된 대회입니다"
                            : !canViewContest
                              ? "인증회원만 참가 가능합니다"
                              : "참가 신청"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
