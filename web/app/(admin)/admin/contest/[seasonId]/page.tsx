"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  inferContestIsCanceled,
  inferContestIsPublic,
  translateContestDisplayStatus,
  type ContestSeason,
  type ContestSeasonDisplayStatus,
} from "@/lib/api/contest";
import {
  getAdminContestSeasonById,
  updateContestSeasonStatus,
} from "@/lib/api/admin-contest";
import ContestMembersManager, {
  type ContestMembersTab,
} from "../components/ContestMembersManager";
import ContestEditModal from "../components/ContestEditModal";

// 멤버 관리 전용 탭 정의
type MemberTab = "applicants" | "participants" | "rejected";

const getStatusBadgeClassName = (status: ContestSeasonDisplayStatus) => {
  if (status === "공개중") return "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50";
  if (status === "종료") return "bg-gray-100 text-gray-600 ring-1 ring-gray-200/50";
  if (status === "취소됨") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50";
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50";
};

const getProgressBadgeClassName = (progress: "모집중" | "라이브 진행중") => {
  if (progress === "모집중") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50";
  }

  return "bg-sky-50 text-sky-700 ring-1 ring-sky-200/50";
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
};

const formatPeriod = (startAt: string, endAt: string) => {
  return `${formatDateTime(startAt)} ~ ${formatDateTime(endAt)}`;
};

const memberTabs: { label: string; value: MemberTab }[] = [
  { label: "신청자 관리", value: "applicants" },
  { label: "참가자 목록", value: "participants" },
  { label: "반려 이력", value: "rejected" },
];

// 관리자 대회 상세 페이지:
// 시즌 정보 확인, 공개/취소 상태 변경, 멤버 관리 탭을 한 화면에서 처리합니다.
export default function AdminContestDetailPage() {
  const params = useParams<{ seasonId: string }>();
  const seasonId = Number(params.seasonId);

  const [season, setSeason] = useState<ContestSeason | null>(null);
  const [isLoadingSeason, setIsLoadingSeason] = useState(true);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updatingStatusField, setUpdatingStatusField] = useState<
    "isPublic" | "isCancel" | null
  >(null);

  // 기본 탭을 '신청자 관리'로 설정
  const [activeTab, setActiveTab] = useState<MemberTab>("applicants");

  const normalizedStatus = useMemo(
    () => translateContestDisplayStatus(season ?? {}),
    [season]
  );
  const isPublic = useMemo(() => inferContestIsPublic(season ?? {}), [season]);
  const isCancel = useMemo(() => inferContestIsCanceled(season ?? {}), [season]);
  const progressBadges = useMemo(
    () => [
      ...(season?.isRecruiting ? (["모집중"] as const) : []),
      ...(season?.isLive ? (["라이브 진행중"] as const) : []),
    ],
    [season?.isLive, season?.isRecruiting]
  );
  const createdAtValue = useMemo(
    () => season?.createdAt ?? season?.updatedAt ?? season?.recruitmentStartAt ?? null,
    [season]
  );
  const updatedAtValue = useMemo(
    () => season?.updatedAt ?? season?.createdAt ?? season?.recruitmentStartAt ?? null,
    [season]
  );
  const canProcessApplicants = useMemo(
    () => Boolean(season?.isRecruiting) && isPublic && !isCancel,
    [isCancel, isPublic, season?.isRecruiting]
  );
  const processBlockedMessage = useMemo(() => {
    if (isCancel) {
      return "취소된 시즌에서는 신청자를 승인하거나 반려할 수 없습니다.";
    }

    if (!isPublic) {
      return "비공개 시즌에서는 신청자를 승인하거나 반려할 수 없습니다.";
    }

    if (!season?.isRecruiting) {
      return "신청자 승인과 반려는 모집 기간에만 가능합니다.";
    }

    return "신청 승인과 반려는 모집중이고 공개 상태이며 취소되지 않은 시즌에서만 가능합니다.";
  }, [isCancel, isPublic, season?.isRecruiting]);

  const loadSeason = useCallback(async () => {
    if (!Number.isFinite(seasonId)) {
      setSeason(null);
      setSeasonError("잘못된 대회 시즌 ID입니다.");
      setIsLoadingSeason(false);
      return;
    }

    setIsLoadingSeason(true);
    setSeasonError(null);

    try {
      const response = await getAdminContestSeasonById(seasonId);
      if (!response) throw new Error("대회 시즌 정보를 찾을 수 없습니다.");
      setSeason(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("401")) setSeasonError("로그인이 필요한 관리자 기능입니다.");
      else if (message.includes("403")) setSeasonError("관리자 권한이 없어 대회 상세를 조회할 수 없습니다.");
      else setSeasonError("대회 시즌 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingSeason(false);
    }
  }, [seasonId]);

  useEffect(() => {
    void loadSeason();
  }, [loadSeason]);

  const handleToggleStatus = async (field: "isPublic" | "isCancel") => {
    if (!season) {
      return;
    }

    const nextIsPublic = field === "isPublic" ? !isPublic : isPublic;
    const nextIsCancel = field === "isCancel" ? !isCancel : isCancel;
    const confirmMessage =
      field === "isPublic"
        ? nextIsPublic
          ? "이 시즌을 공개 상태로 변경할까요?"
          : "이 시즌을 비공개 상태로 변경할까요?"
        : nextIsCancel
          ? "이 시즌을 취소 상태로 변경할까요?"
          : "이 시즌의 취소 상태를 해제할까요?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setUpdatingStatusField(field);

    try {
      const updatedSeason = await updateContestSeasonStatus(season.id, {
        isPublic: nextIsPublic,
        isCancel: nextIsCancel,
      });

      setSeason(updatedSeason);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        alert("로그인이 필요한 관리자 기능입니다.");
        return;
      }

      if (message.includes("403")) {
        alert("관리자 권한이 없어 시즌 상태를 변경할 수 없습니다.");
        return;
      }

      console.error("시즌 상태 변경 실패:", error);
      alert("시즌 상태 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUpdatingStatusField(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12 px-4 sm:px-6">
      {/* 1. 상단 헤더 & 컨트롤 바 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6">
        <div>
          <Link
            href="/admin/contest"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-2 transition-colors"
          >
            <span className="mr-1.5">←</span> 대회 목록으로 돌아가기
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {season?.title || "대회 상세"}
            </h1>
            {season && (
              <>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClassName(normalizedStatus)}`}>
                  {normalizedStatus}
                </span>
                {progressBadges.length > 0 ? (
                  progressBadges.map((badge) => (
                    <span
                      key={badge}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getProgressBadgeClassName(
                        badge
                      )}`}
                    >
                      {badge}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500 ring-1 ring-gray-200/50">
                    대기중
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="white"
            className="shadow-sm font-bold"
            onClick={() => setIsEditModalOpen(true)}
          >
            대회 정보 수정
          </Button>
        </div>
      </div>

      {isLoadingSeason ? (
        <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
          <p className="text-sm font-medium text-gray-500 animate-pulse">데이터를 로드하고 있습니다...</p>
        </div>
      ) : seasonError ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
          <p className="text-sm font-medium text-red-600">{seasonError}</p>
        </div>
      ) : season ? (
        <div className="space-y-8">
          
          {/* 2. 대회 정보 대시보드 (기존 개요 탭 통합) */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* 대회 기본 설명 */}
            <div className="lg:col-span-2 space-y-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                  대회 상세 설명
                </h2>
                <div className="min-h-[142px] max-h-[142px] rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                  {season.description || "등록된 대회 설명이 없습니다."}
                </div>
              </section>

              {/* 상태 스위치 패널 */}
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">시즌 활성 제어</h2>
                <div className="flex flex-wrap items-center gap-8">
                  <label className="flex cursor-pointer items-center gap-3 group">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">시즌 공개 여부</span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isPublic}
                        disabled={updatingStatusField === "isPublic"}
                        onChange={() => void handleToggleStatus("isPublic")}
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"></div>
                    </div>
                  </label>

                  <div className="h-8 w-px bg-gray-100"></div>

                  <label className="flex cursor-pointer items-center gap-3 group">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">시즌 취소 상태</span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isCancel}
                        disabled={updatingStatusField === "isCancel"}
                        onChange={() => void handleToggleStatus("isCancel")}
                      />
                      <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-rose-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"></div>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* 일정 및 시스템 정보 사이드바 */}
            <div className="space-y-6">
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                  주요 일정
                </h2>
                <div className="space-y-5">
                  <div className="relative pl-4 border-l-2 border-blue-100">
                    <p className="text-[11px] font-bold text-blue-600 uppercase">참가 신청</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 tracking-tight">
                      {formatPeriod(season.recruitmentStartAt, season.recruitmentEndAt)}
                    </p>
                  </div>
                  <div className="relative pl-4 border-l-2 border-red-100">
                    <p className="text-[11px] font-bold text-red-600 uppercase">대회 진행</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 tracking-tight">
                      {formatPeriod(season.contestStartAt, season.contestEndAt)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-gray-400 rounded-full"></span>
                  시스템 정보
                </h2>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-xs text-gray-500">시즌 고유 ID</dt>
                    <dd className="text-xs font-mono font-bold text-gray-900">#{season.id}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-xs text-gray-500">생성일</dt>
                    <dd className="text-xs font-medium text-gray-900">
                      {createdAtValue ? formatDateTime(createdAtValue) : "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-xs text-gray-500">최종 업데이트</dt>
                    <dd className="text-xs font-medium text-gray-900">
                      {updatedAtValue ? formatDateTime(updatedAtValue) : "-"}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>

          {/* 3. 하단 섹션: 멤버 관리 탭 및 리스트 */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 border-b border-gray-200 px-6 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-gray-900">멤버 관리 시스템</h2>
                <span className="text-xs text-gray-400 font-medium">| 신청 승인 및 참가자 목록 조회</span>
              </div>
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {memberTabs.map((tab) => {
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`whitespace-nowrap border-b-2 py-4 px-2 text-sm font-bold transition-all ${
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              <ContestMembersManager
                key={activeTab}
                seasonId={season.id}
                initialTab={activeTab as ContestMembersTab}
                onUpdated={loadSeason}
                showTabs={false} // 내부 탭은 숨기고 상위 커스텀 탭으로 제어
                canProcessApplicants={canProcessApplicants}
                processBlockedMessage={processBlockedMessage}
              />
            </div>
          </div>
        </div>
      ) : null}

      {season && isEditModalOpen ? (
        <ContestEditModal
          season={season}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={(updatedSeason) => {
            setSeason(updatedSeason);
          }}
        />
      ) : null}
    </div>
  );
}
