"use client";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import Button from "../ui/Button";
import BaseModal from "../ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRequireVerifiedUser } from "@/hooks/useWithAuth";
import {
  applyContestSeason,
  getRecruitingContestSeasons,
  translateContestDisplayStatus,
  type ContestSeason,
} from "@/lib/api/contest";
import { formatDateTime } from "@/lib/utils/date";

const RECRUITING_CONTEST_PAGE_SIZE = 5;

export default function ContestDetailModal({ onClose }: { onClose: () => void }) {
    const isLogin = useAuthStore((state) => state.isLogin);
    const user = useAuthStore((state) => state.user);
    const { alert, toast } = useFeedback();
    const requireVerifiedUser = useRequireVerifiedUser({
        loginRedirectMode: "push",
        verifyRedirectMode: "push",
    });
    const [contestSeasons, setContestSeasons] = useState<ContestSeason[]>([]);
    const [isLoadingSeason, setIsLoadingSeason] = useState(true);
    const [isLoadingMoreSeason, setIsLoadingMoreSeason] = useState(false);
    const [seasonErrorMessage, setSeasonErrorMessage] = useState("");
    const [applyingSeasonId, setApplyingSeasonId] = useState<number | null>(null);
    const [nextSeasonCursorId, setNextSeasonCursorId] = useState<number | null>(null);
    const [hasNextSeason, setHasNextSeason] = useState(false);

    useEffect(() => {
        let isActive = true;

        const loadRecruitingSeason = async ({
            reset = false,
            cursorId,
        }: {
            reset?: boolean;
            cursorId?: number;
        } = {}) => {
            if (reset) {
                setIsLoadingSeason(true);
                setSeasonErrorMessage("");
            } else {
                setIsLoadingMoreSeason(true);
            }

            try {
                const isVerified = isLogin && !!user && user.role !== "USER";
                const response = await getRecruitingContestSeasons({
                    cursorId: reset ? undefined : cursorId,
                    size: RECRUITING_CONTEST_PAGE_SIZE,
                }, isVerified);
                const nextSeasons =
                    response && Array.isArray(response.content)
                        ? response.content
                        : [];

                if (!isActive) {
                    return;
                }

                setContestSeasons((prev) => (reset ? nextSeasons : [...prev, ...nextSeasons]));
                setNextSeasonCursorId(response.nextCursorId ?? null);
                setHasNextSeason(response.hasNext === true);
            } catch (error) {
                if (!isActive) {
                    return;
                }

                const message = error instanceof Error ? error.message : "";

                if (message.includes("401") || message.includes("403")) {
                    if (reset) {
                        setContestSeasons([]);
                        setSeasonErrorMessage("대회 정보를 불러올 수 없습니다.");
                    } else {
                        await alert("대회 목록을 더 불러올 수 없습니다.");
                    }
                    return;
                }

                console.error("대회 시즌 조회 실패:", error);

                if (reset) {
                    setContestSeasons([]);
                    setSeasonErrorMessage("모집중인 대회 정보를 불러오지 못했습니다.");
                } else {
                    await alert("대회 목록을 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
                }
            } finally {
                if (isActive) {
                    if (reset) {
                        setIsLoadingSeason(false);
                    } else {
                        setIsLoadingMoreSeason(false);
                    }
                }
            }
        };

        void loadRecruitingSeason({ reset: true });

        return () => {
            isActive = false;
        };
    }, [alert]);

    const handleApply = async (season: ContestSeason) => {
        if (isLoadingSeason) {
            return;
        }

        const canApplyContest = await requireVerifiedUser();

        if (!canApplyContest) {
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
            toast({ title: "대회 신청이 완료되었습니다.", tone: "success" });
        } catch (error) {
            console.error("대회 신청 실패:", error);
            await alert("대회 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setApplyingSeasonId(null);
        }
    };

    const handleLoadMoreSeasons = async () => {
        if (nextSeasonCursorId == null || isLoadingMoreSeason) {
            return;
        }

        setIsLoadingMoreSeason(true);

        try {
            const isVerified = isLogin && !!user && user.role !== "USER";
            const response = await getRecruitingContestSeasons({
                cursorId: nextSeasonCursorId,
                size: RECRUITING_CONTEST_PAGE_SIZE,
            }, isVerified);
            const nextSeasons =
                response && Array.isArray(response.content)
                    ? response.content
                    : [];

            setContestSeasons((prev) => [...prev, ...nextSeasons]);
            setNextSeasonCursorId(response.nextCursorId ?? null);
            setHasNextSeason(response.hasNext === true);
        } catch (error) {
            const message = error instanceof Error ? error.message : "";

            if (message.includes("401") || message.includes("403")) {
                await alert("대회 목록을 더 불러올 수 없습니다.");
                return;
            }

            console.error("대회 시즌 추가 조회 실패:", error);
            await alert("대회 목록을 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setIsLoadingMoreSeason(false);
        }
    };



  return (
    <BaseModal
      title="대회 정보"
      onClose={onClose}
    >
      <div className="mb-6">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          모집중 대회 목록
        </span>
      </div>

      <div className="space-y-4 pr-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
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
            <>
              {contestSeasons.map((season) => {
                const isAlreadyApplied = season.appliedByMe === true;
                const isApplying = applyingSeasonId === season.id;
                const normalizedStatus = season.isRecruiting
                  ? "모집중"
                  : translateContestDisplayStatus(season);
                const isRecruiting = season.isRecruiting !== false;
                const isVerified = isLogin && !!user && user.role !== "USER";

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
                    ) : !isLogin ? (
                      <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        로그인 후 대회에 참가할 수 있습니다.
                      </div>
                    ) : !isVerified ? (
                      <div className="mt-4 rounded-xl bg-amber-50 p-4 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        인증회원만 대회에 참가할 수 있습니다.
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
                          !isRecruiting ||
                          (isLogin && !isVerified)
                        }
                      >
                        {isAlreadyApplied
                          ? "이미 신청한 대회입니다"
                          : isApplying
                            ? "신청 처리 중..."
                            : !isRecruiting
                              ? "모집이 종료된 대회입니다"
                              : !isLogin 
                                ? "로그인 후 참가"
                                : !isVerified
                                  ? "인증 후 참가 가능"
                                  : "참가 신청"}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {hasNextSeason ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="white"
                    onClick={handleLoadMoreSeasons}
                    disabled={isLoadingMoreSeason}
                  >
                    {isLoadingMoreSeason ? (
                      "대회 목록 불러오는 중..."
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        대회 5개 더보기
                        <ChevronDown size={16} />
                      </span>
                    )}
                  </Button>
                </div>
              ) : null}
            </>
          )}
      </div>
    </BaseModal>
  );
}
