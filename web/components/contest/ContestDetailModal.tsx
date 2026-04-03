"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from 'lucide-react';
import Button from "../ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import {
  applyContestSeason,
  getRecruitingContestSeasons,
  type ContestSeason,
} from "@/lib/api/contest";
import { formatDateTime } from "@/lib/utils/date";

export default function ContestDetailModal({ onClose }: { onClose: () => void }) {
    const isLogin = useAuthStore((state) => state.isLogin);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const [contestSeason, setContestSeason] = useState<ContestSeason | null>(null);
    const [isLoadingSeason, setIsLoadingSeason] = useState(true);
    const [seasonErrorMessage, setSeasonErrorMessage] = useState("");
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        let isActive = true;

        const loadRecruitingSeason = async () => {
            setIsLoadingSeason(true);
            setSeasonErrorMessage("");

            try {
                const response = await getRecruitingContestSeasons({ size: 1 });
                const nextSeason =
                    response && Array.isArray(response.content)
                        ? (response.content[0] ?? null)
                        : null;

                if (!isActive) {
                    return;
                }

                setContestSeason(nextSeason);
            } catch (error) {
                if (!isActive) {
                    return;
                }

                const message = error instanceof Error ? error.message : "";

                if (message.includes("401") || message.includes("403")) {
                    setContestSeason(null);
                    setSeasonErrorMessage("대회 정보를 불러올 수 없습니다. 현재는 공개 조회가 막혀 있습니다.");
                    return;
                }

                console.error("대회 시즌 조회 실패:", error);
                setContestSeason(null);
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
    }, []);

    const isAlreadyApplied = contestSeason?.appliedByMe === true;
    const hasRecruitingSeason = contestSeason !== null;
    const canApply = isLogin && !!user && user.role !== "USER";
    const actionButtonDisabled =
        isLoadingSeason || isApplying || !hasRecruitingSeason || isAlreadyApplied || !canApply;

    const contestStatusLabel = useMemo(() => {
        if (!contestSeason?.status?.label) {
            return "모집중 대회";
        }

        return contestSeason.status.label;
    }, [contestSeason]);

    const handleApply = async () => {
        if (isLoadingSeason || !contestSeason) {
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
            setIsApplying(true);
            await applyContestSeason(contestSeason.id);
            setContestSeason((prev) =>
              prev
                ? {
                    ...prev,
                    appliedByMe: true,
                  }
                : prev
            );
            alert("대회 신청이 완료되었습니다.");
            onClose();
        } catch (error) {
            console.error("대회 신청 실패:", error);
            alert("대회 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsApplying(false);
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
            {contestStatusLabel}
          </span>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">대회 상세 정보</h2>
        </div>

        <div className="space-y-4 mb-8 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {isLoadingSeason ? (
            <div className="rounded-xl bg-gray-50 p-4 text-xs font-bold text-gray-400 dark:bg-zinc-800">
              모집중인 대회 정보를 불러오는 중입니다.
            </div>
          ) : seasonErrorMessage ? (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-500 dark:bg-zinc-800">
              {seasonErrorMessage}
            </div>
          ) : !contestSeason ? (
            <div className="rounded-xl bg-gray-50 p-4 text-xs font-bold text-gray-400 dark:bg-zinc-800">
              현재 모집중인 대회가 없습니다.
            </div>
          ) : (
            <>
              <p className="text-base font-black text-zinc-900 dark:text-white">
                {contestSeason.title}
              </p>
              <p>{contestSeason.description}</p>
              <p>
                • <strong>참가 신청 기간 :</strong> {formatDateTime(contestSeason.recruitmentStartAt)} ~ {formatDateTime(contestSeason.recruitmentEndAt)}
              </p>
              <p>
                • <strong>대회 기간 :</strong> {formatDateTime(contestSeason.contestStartAt)} ~ {formatDateTime(contestSeason.contestEndAt)}
              </p>
              <p>• <strong>참여 대상 :</strong> 요기망치 인증회원</p>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 text-xs mt-4">
                * 대회 시작 전까지 신청이 가능하며, 시작 후에는 중도 참여가 불가능합니다.
              </div>
              {!isLogin ? (
                <div className="rounded-xl bg-gray-50 p-4 text-xs font-bold text-gray-500 dark:bg-zinc-800">
                  대회 정보는 누구나 볼 수 있고, 참가 신청은 로그인 후 가능합니다.
                </div>
              ) : user?.role === "USER" ? (
                <div className="rounded-xl bg-gray-50 p-4 text-xs font-bold text-gray-500 dark:bg-zinc-800">
                  대회 참가 신청은 인증회원만 가능합니다.
                </div>
              ) : null}
              {isAlreadyApplied ? (
                <div className="rounded-xl bg-blue-50 p-4 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  이미 현재 모집중인 대회에 신청한 상태입니다.
                </div>
              ) : null}
            </>
          )}
        </div>

        <Button
          onClick={handleApply}
          size="lg"
          fullWidth
          disabled={actionButtonDisabled}
        >
          {isLoadingSeason
            ? "대회 정보 확인 중..."
            : isAlreadyApplied
              ? "이미 신청한 대회입니다"
            : isApplying
                ? "신청 처리 중..."
                : !hasRecruitingSeason
                  ? "모집중인 대회가 없습니다"
                  : !isLogin
                    ? "로그인 후 참여 신청하기"
                    : user?.role === "USER"
                      ? "인증회원만 참가 가능합니다"
                  : "지금 바로 참여 신청하기"}
        </Button>
      </div>
    </div>
  );
}
