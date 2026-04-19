"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { ChevronDown } from "lucide-react";
import {
  inferContestIsCanceled,
  inferContestIsPublic,
  translateContestDisplayStatus,
  type ContestSeason,
  type ContestSeasonDisplayStatus,
} from "@/lib/api/contest";
import {
  getAdminContestSeasons,
  updateContestSeasonStatus,
} from "@/lib/api/admin-contest";
import ContestCreateModal from "./components/ContestCreateModal";
import ContestEditModal from "./components/ContestEditModal";
import {
  ADMIN_LOGIN_REQUIRED_MESSAGE,
  getAdminForbiddenMessage,
} from "@/lib/utils/adminFeedback";

const ADMIN_CONTEST_PAGE_SIZE = 5;

type ContestSeasonRow = {
  season: ContestSeason;
  id: number;
  title: string;
  progressBadges: ("모집중" | "Live")[];
  status: ContestSeasonDisplayStatus;
  isPublic: boolean;
  isCancel: boolean;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
  updatedAt: string;
};

// 시즌 목록 화면에서 쓰기 좋게 응답 DTO를 테이블 행 형태로 정리합니다.
const toContestSeasonRow = (season: ContestSeason): ContestSeasonRow => {
  return {
    season,
    id: season.id,
      title: season.title,
      progressBadges: [
        ...(season.isRecruiting ? (["모집중"] as const) : []),
        ...(season.isLive ? (["Live"] as const) : []),
      ],
    status: translateContestDisplayStatus(season),
    isPublic: inferContestIsPublic(season),
    isCancel: inferContestIsCanceled(season),
    recruitmentStartAt: season.recruitmentStartAt,
    recruitmentEndAt: season.recruitmentEndAt,
    contestStartAt: season.contestStartAt,
    contestEndAt: season.contestEndAt,
    updatedAt: season.updatedAt ?? season.createdAt ?? season.recruitmentStartAt,
  };
};

// 상태 변경 API 응답을 현재 목록 행과 합쳐 토글 상태를 즉시 반영합니다.
const mergeUpdatedSeasonRow = (
  currentRow: ContestSeasonRow,
  updatedSeason: ContestSeason,
  {
    isPublic,
    isCancel,
  }: {
    isPublic: boolean;
    isCancel: boolean;
  }
): ContestSeasonRow => {
  const nextRow = toContestSeasonRow(updatedSeason);

  return {
    ...currentRow,
    ...nextRow,
    isPublic,
    isCancel,
  };
};

const getProgressBadgeClassName = (progress: "모집중" | "Live") => {
  if (progress === "모집중") {
    return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";
  }

  return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
};

const getStatusBadgeClassName = (status: ContestSeasonDisplayStatus) => {
  if (status === "공개중") {
    return "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100";
  }

  if (status === "종료") {
    return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  }

  if (status === "취소됨") {
    return "bg-rose-50 text-rose-600 ring-1 ring-rose-100";
  }

  return "bg-amber-50 text-amber-600 ring-1 ring-amber-100";
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
  return (
    <div className="flex flex-col items-center">
      <span>{formatDateTime(startAt)}</span>
      <span>~</span>
      <span>{formatDateTime(endAt)}</span>
    </div>
  );
};

const ToggleSwitch = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-60" : "hover:opacity-90"}`}
    >
      <span
        className={`absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
};

// 관리자 대회 목록 페이지:
// 시즌 생성, 상태 토글, 상세 페이지 진입을 한 화면에서 관리합니다.
export default function AdminContestPage() {
  const { alert, confirm, toast } = useFeedback();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<ContestSeason | null>(null);
  const [rows, setRows] = useState<ContestSeasonRow[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [isLoadingMoreRows, setIsLoadingMoreRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [updatingRowKey, setUpdatingRowKey] = useState<string | null>(null);
  const [hasNextRows, setHasNextRows] = useState(false);
  const [nextRowsCursorId, setNextRowsCursorId] = useState<number | null>(null);

  const sortedRows = useMemo(() => {
    return [...rows].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [rows]);

  const loadContestSeasonRows = useCallback(
    async ({
      reset = false,
      cursorId,
    }: {
      reset?: boolean;
      cursorId?: number;
    } = {}) => {
      if (reset) {
        setIsLoadingRows(true);
        setRowsError(null);
      } else {
        setIsLoadingMoreRows(true);
      }

      try {
        const response = await getAdminContestSeasons({
          cursorId: reset ? undefined : cursorId,
          size: ADMIN_CONTEST_PAGE_SIZE,
        });
        const nextRows = (response.content ?? []).map(toContestSeasonRow);

        setRows((prev) => (reset ? nextRows : [...prev, ...nextRows]));
        setHasNextRows(response.hasNext === true);
        setNextRowsCursorId(response.nextCursorId ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "";

        if (message.includes("401")) {
          if (reset) {
            setRows([]);
            setRowsError(ADMIN_LOGIN_REQUIRED_MESSAGE);
          } else {
            await alert(ADMIN_LOGIN_REQUIRED_MESSAGE);
          }
          return;
        }

        if (message.includes("403")) {
          if (reset) {
            setRows([]);
            setRowsError(
              getAdminForbiddenMessage("대회 목록을 조회할 수 없습니다.")
            );
          } else {
            await alert(
              getAdminForbiddenMessage("대회 목록을 더 불러올 수 없습니다.")
            );
          }
          return;
        }

        console.error("대회 목록 조회 실패:", error);

        if (reset) {
          setRows([]);
          setRowsError("대회 목록을 불러오지 못했습니다.");
        } else {
          await alert("대회 목록을 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (reset) {
          setIsLoadingRows(false);
        } else {
          setIsLoadingMoreRows(false);
        }
      }
    },
    [alert]
  );

  useEffect(() => {
    void loadContestSeasonRows({ reset: true });
  }, [loadContestSeasonRows]);

  const handleCreatedSeason = () => {
    void loadContestSeasonRows({ reset: true });
  };

  const handleUpdatedSeason = useCallback(
    (updatedSeason: ContestSeason) => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === updatedSeason.id
            ? {
                ...toContestSeasonRow(updatedSeason),
                isPublic: inferContestIsPublic(updatedSeason),
                isCancel: inferContestIsCanceled(updatedSeason),
              }
            : row
        )
      );

      // 수정 응답과 목록 응답의 필드 구성이 다를 수 있어 최신 목록으로 한 번 더 동기화합니다.
      void loadContestSeasonRows({ reset: true });
    },
    [loadContestSeasonRows]
  );

  const recruitingCount = rows.filter((row) =>
    row.progressBadges.includes("모집중")
  ).length;
  const progressingCount = rows.filter((row) =>
    row.progressBadges.includes("Live")
  ).length;

  const handleToggleStatus = async (
    row: ContestSeasonRow,
    field: "isPublic" | "isCancel"
  ) => {
    const nextIsPublic = field === "isPublic" ? !row.isPublic : row.isPublic;
    const nextIsCancel = field === "isCancel" ? !row.isCancel : row.isCancel;
    const confirmMessage =
      field === "isPublic"
        ? nextIsPublic
          ? "이 대회를 공개 상태로 변경할까요?"
          : "이 대회를 비공개 상태로 변경할까요?"
        : nextIsCancel
          ? "이 대회를 취소 상태로 변경할까요?"
          : "이 대회의 취소 상태를 해제할까요?";

    const shouldProceed = await confirm({
      description: confirmMessage,
      confirmText: "변경",
      tone: field === "isCancel" && nextIsCancel ? "danger" : "default",
    });

    if (!shouldProceed) {
      return;
    }

    setUpdatingRowKey(`${row.id}-${field}`);

    try {
      const updatedSeason = await updateContestSeasonStatus(row.id, {
        isPublic: nextIsPublic,
        isCancel: nextIsCancel,
      });

      setRows((prev) =>
        prev.map((currentRow) =>
          currentRow.id === row.id
            ? mergeUpdatedSeasonRow(currentRow, updatedSeason, {
                isPublic: nextIsPublic,
                isCancel: nextIsCancel,
              })
            : currentRow
        )
      );

      toast({
        title:
          field === "isPublic"
            ? nextIsPublic
              ? "대회를 공개로 변경했습니다."
              : "대회를 비공개로 변경했습니다."
            : nextIsCancel
              ? "대회를 취소 상태로 변경했습니다."
              : "대회 취소 상태를 해제했습니다.",
        tone: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        await alert(ADMIN_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      if (message.includes("403")) {
        await alert(
          getAdminForbiddenMessage("대회 상태를 변경할 수 없습니다.")
        );
        return;
      }

      console.error("대회 상태 변경 실패:", error);
      await alert("대회 상태 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUpdatingRowKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900">대회 관리</h1>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setIsCreateModalOpen(true)}>대회 생성</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-bold text-gray-500">전체 대회</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{rows.length}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-bold text-gray-500">모집중 대회</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {recruitingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-bold text-gray-500">진행중 대회</p>
            <p className="mt-2 text-3xl font-black text-blue-600">
              {progressingCount}
            </p>
          </div>
        </div>
      </section>

      <section >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">대회 목록</h2>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="sticky left-0 z-10 w-[70px] bg-gray-50 px-3 py-4 text-center font-black">
                  ID
                </th>
                <th className="w-[220px] px-3 py-4 text-left font-black">
                  대회명
                </th>
                <th className="w-[80px] px-3 py-4 text-center font-black">
                  진행 상태
                </th>
                <th className="w-[80px] px-3 py-4 text-center font-black">
                  상태
                </th>
                <th className="w-[80px] px-3 py-4 text-center font-black">
                  공개여부
                </th>
                <th className="w-[80px] px-3 py-4 text-center font-black">
                  취소여부
                </th>
                <th className="w-[160px] px-3 py-4 text-center font-black">
                  신청 기간
                </th>
                <th className="w-[160px] px-3 py-4 text-center font-black">
                  대회 기간
                </th>
                <th className="w-[90px] px-3 py-4 text-center font-black">
                  관리
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoadingRows ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-sm font-medium text-gray-500"
                  >
                    대회 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : rowsError ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-sm font-medium text-red-500"
                  >
                    {rowsError}
                  </td>
                </tr>
              ) : sortedRows.length > 0 ? (
                sortedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="group border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="sticky left-0 z-[1] bg-white px-3 py-4 text-center font-bold text-gray-500 transition-colors group-hover:bg-gray-50">
                      {row.id}
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`/admin/contest/${row.id}`}
                        className="inline max-w-full break-words font-black leading-6 text-gray-900 underline underline-offset-4 hover:text-blue-600"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {row.progressBadges.length > 0 ? (
                            row.progressBadges.map((badge) => (
                              <span
                                key={badge}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${getProgressBadgeClassName(
                                  badge
                                )}`}
                              >
                                {badge === "Live" ? (
                                  <span aria-hidden="true" className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" />
                                  </span>
                                ) : null}
                                {badge}
                              </span>
                            ))
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-500 ring-1 ring-gray-200">
                            대기중
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClassName(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold leading-4 text-gray-600">
                          {row.isPublic ? "공개" : "비공개"}
                        </span>
                        <ToggleSwitch
                          checked={row.isPublic}
                          onChange={() => void handleToggleStatus(row, "isPublic")}
                          disabled={updatingRowKey === `${row.id}-isPublic`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold leading-4 text-gray-600">
                          {row.isCancel ? "취소됨" : "정상"}
                        </span>
                        <ToggleSwitch
                          checked={row.isCancel}
                          onChange={() => void handleToggleStatus(row, "isCancel")}
                          disabled={updatingRowKey === `${row.id}-isCancel`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium leading-5 text-gray-600">
                      {formatPeriod(row.recruitmentStartAt, row.recruitmentEndAt)}
                    </td>
                    <td className="px-3 py-4 text-center text-sm font-medium leading-5 text-gray-600">
                      {formatPeriod(row.contestStartAt, row.contestEndAt)}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="white"
                          size="xs"
                          onClick={() => setEditingSeason(row.season)}
                        >
                          수정
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-sm font-medium text-gray-500"
                  >
                    아직 등록된 대회가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!isLoadingRows && !rowsError && hasNextRows ? (
          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              size="sm"
              variant="white"
              onClick={() =>
                void loadContestSeasonRows({
                  cursorId: nextRowsCursorId ?? undefined,
                })
              }
              disabled={isLoadingMoreRows}
            >
              {isLoadingMoreRows ? (
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
      </section>

      {isCreateModalOpen ? (
        <ContestCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleCreatedSeason}
        />
      ) : null}

      {editingSeason ? (
        <ContestEditModal
          season={editingSeason}
          onClose={() => setEditingSeason(null)}
          onUpdated={handleUpdatedSeason}
        />
      ) : null}
    </div>
  );
}
