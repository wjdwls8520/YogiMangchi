"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import BaseModal from "@/components/ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  approveContestApplicant,
  getContestApplicants,
  getContestParticipants,
  getRejectedContestApplicants,
  rejectContestApplicant,
  type ContestApplicant,
  type ContestParticipant,
  type ContestRejectedApplicant,
} from "@/lib/api/admin-contest";
import {
  ADMIN_LOGIN_REQUIRED_MESSAGE,
  getAdminForbiddenMessage,
} from "@/lib/utils/adminFeedback";

export type ContestMembersTab = "applicants" | "participants" | "rejected";
const MEMBERS_PAGE_SIZE = 5;

type ContestMembersManagerProps = {
  seasonId: number;
  initialTab?: ContestMembersTab;
  onUpdated?: () => void;
  showTabs?: boolean;
  canProcessApplicants?: boolean;
  processBlockedMessage?: string;
};

// 상세 페이지와 모달 양쪽에서 재사용하는 멤버 관리 탭 정의입니다.
const tabItems: { label: string; value: ContestMembersTab }[] = [
  { label: "신청자", value: "applicants" },
  { label: "참가자", value: "participants" },
  { label: "반려 이력", value: "rejected" },
];

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
};

const AvatarName = ({
  name,
  profileImgUrl,
}: {
  name?: string;
  profileImgUrl?: string;
}) => {
  const fallbackLabel = name?.trim().slice(0, 1) || "?";

  return (
    <div className="flex items-center gap-3">
      {profileImgUrl ? (
        <img
          src={profileImgUrl}
          alt={`${name ?? "사용자"} 프로필`}
          className="h-8 w-8 shrink-0 rounded-full border border-gray-200 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-xs font-black text-gray-500 dark:text-gray-400">
          {fallbackLabel}
        </div>
      )}
      <span className="font-bold text-gray-900 dark:text-gray-100">{name ?? "-"}</span>
    </div>
  );
};

export default function ContestMembersManager({
  seasonId,
  initialTab = "applicants",
  onUpdated,
  showTabs = true,
  canProcessApplicants = true,
  processBlockedMessage = "신청 승인과 반려는 모집중이고 공개 상태이며 취소되지 않은 시즌에서만 가능합니다.",
}: ContestMembersManagerProps) {
  const { alert, toast } = useFeedback();
  const [activeTab, setActiveTab] = useState<ContestMembersTab>(initialTab);
  const [applicants, setApplicants] = useState<ContestApplicant[]>([]);
  const [participants, setParticipants] = useState<ContestParticipant[]>([]);
  const [rejectedApplicants, setRejectedApplicants] = useState<
    ContestRejectedApplicant[]
  >([]);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<number[]>([]);
  const [rejectingApplicant, setRejectingApplicant] = useState<ContestApplicant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [applicantsNextCursorId, setApplicantsNextCursorId] = useState<
    number | null
  >(null);
  const [participantsNextCursorId, setParticipantsNextCursorId] = useState<
    number | null
  >(null);
  const [rejectedNextCursorId, setRejectedNextCursorId] = useState<number | null>(
    null
  );
  const [hasNextApplicants, setHasNextApplicants] = useState(false);
  const [hasNextParticipants, setHasNextParticipants] = useState(false);
  const [hasNextRejected, setHasNextRejected] = useState(false);

  // 신청자/참가자/반려 이력을 한 번에 불러와 탭 전환 시 즉시 보여줍니다.
  const loadMemberLists = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [applicantsResponse, participantsResponse, rejectedResponse] =
        await Promise.all([
          getContestApplicants(seasonId, { size: MEMBERS_PAGE_SIZE }),
          getContestParticipants(seasonId, { size: MEMBERS_PAGE_SIZE }),
          getRejectedContestApplicants(seasonId, { size: MEMBERS_PAGE_SIZE }),
        ]);

      setApplicants(applicantsResponse.content ?? []);
      setParticipants(participantsResponse.content ?? []);
      setRejectedApplicants(rejectedResponse.content ?? []);
      setApplicantsNextCursorId(applicantsResponse.nextCursorId ?? null);
      setParticipantsNextCursorId(participantsResponse.nextCursorId ?? null);
      setRejectedNextCursorId(rejectedResponse.nextCursorId ?? null);
      setHasNextApplicants(applicantsResponse.hasNext === true);
      setHasNextParticipants(participantsResponse.hasNext === true);
      setHasNextRejected(rejectedResponse.hasNext === true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        setLoadError(ADMIN_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      if (message.includes("403")) {
        setLoadError(
          getAdminForbiddenMessage("참가자 정보를 조회할 수 없습니다.")
        );
        return;
      }

      console.error("대회 참가자 목록 조회 실패:", error);
      setLoadError("참가자 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    void loadMemberLists();
  }, [loadMemberLists]);

  useEffect(() => {
    setSelectedApplicantIds([]);
  }, [activeTab]);

  const allApplicantIds = useMemo(
    () => applicants.map((applicant) => applicant.applicantId),
    [applicants]
  );

  const isAllSelected =
    applicants.length > 0 && selectedApplicantIds.length === applicants.length;

  const columnCount =
    activeTab === "rejected" ? 6 : activeTab === "participants" ? 5 : 5;
  const canLoadMore =
    activeTab === "applicants"
      ? hasNextApplicants
      : activeTab === "participants"
        ? hasNextParticipants
        : hasNextRejected;

  const toggleApplicantSelection = (applicantId: number) => {
    setSelectedApplicantIds((prev) =>
      prev.includes(applicantId)
        ? prev.filter((id) => id !== applicantId)
        : [...prev, applicantId]
    );
  };

  const toggleSelectAllApplicants = () => {
    setSelectedApplicantIds(isAllSelected ? [] : allApplicantIds);
  };

  // 승인/반려 액션 후에는 목록을 다시 조회해 화면과 서버 상태를 맞춥니다.
  const runApprove = async (applicantIds: number[]) => {
    if (!canProcessApplicants) {
      await alert(processBlockedMessage);
      return;
    }

    setIsSubmittingAction(true);

    try {
      await Promise.all(
        applicantIds.map((applicantId) =>
          approveContestApplicant(seasonId, applicantId)
        )
      );

      toast({
        title:
          applicantIds.length > 1
            ? "선택한 신청자를 승인했습니다."
            : "신청자를 승인했습니다.",
        tone: "success",
      });
      setSelectedApplicantIds([]);
      await loadMemberLists();
      onUpdated?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        await alert(ADMIN_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      if (message.includes("403")) {
        await alert(
          getAdminForbiddenMessage("신청자를 승인할 수 없습니다.")
        );
        return;
      }

      if (message.includes("409")) {
        await alert(processBlockedMessage);
        return;
      }

      console.error("대회 신청 승인 실패:", error);
      await alert("신청자 승인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const runReject = async (applicantIds: number[], rejectReason: string) => {
    if (!canProcessApplicants) {
      await alert(processBlockedMessage);
      return false;
    }

    setIsSubmittingAction(true);

    try {
      await Promise.all(
        applicantIds.map((applicantId) =>
          rejectContestApplicant(seasonId, applicantId, rejectReason)
        )
      );

      toast({
        title:
          applicantIds.length > 1
            ? "선택한 신청자를 반려했습니다."
            : "신청자를 반려했습니다.",
        tone: "success",
      });
      setSelectedApplicantIds([]);
      await loadMemberLists();
      onUpdated?.();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        await alert(ADMIN_LOGIN_REQUIRED_MESSAGE);
        return false;
      }

      if (message.includes("403")) {
        await alert(
          getAdminForbiddenMessage("신청자를 반려할 수 없습니다.")
        );
        return false;
      }

      if (message.includes("409")) {
        await alert(processBlockedMessage);
        return false;
      }

      console.error("대회 신청 반려 실패:", error);
      await alert("신청자 반려에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      return false;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleApproveSelected = async () => {
    if (selectedApplicantIds.length === 0) {
      await alert("승인할 신청자를 선택해 주세요.");
      return;
    }

    await runApprove(selectedApplicantIds);
  };

  const handleApproveSingle = async (applicantId: number) => {
    await runApprove([applicantId]);
  };

  const handleOpenRejectModal = (applicant: ContestApplicant) => {
    if (!canProcessApplicants) {
      void alert(processBlockedMessage);
      return;
    }

    setRejectingApplicant(applicant);
    setRejectReason("");
  };

  const handleCloseRejectModal = () => {
    if (isSubmittingAction) {
      return;
    }

    setRejectingApplicant(null);
    setRejectReason("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingApplicant) {
      return;
    }

    if (!rejectReason.trim()) {
      await alert("반려 사유를 입력해 주세요.");
      return;
    }

    const isRejected = await runReject(
      [rejectingApplicant.applicantId],
      rejectReason.trim()
    );

    if (isRejected) {
      handleCloseRejectModal();
    }
  };

  const handleLoadMore = async () => {
    const cursorId =
      activeTab === "applicants"
        ? applicantsNextCursorId
        : activeTab === "participants"
          ? participantsNextCursorId
          : rejectedNextCursorId;

    if (cursorId == null) {
      return;
    }

    setIsLoadingMore(true);

    try {
      if (activeTab === "applicants") {
        const response = await getContestApplicants(seasonId, {
          cursorId,
          size: MEMBERS_PAGE_SIZE,
        });

        setApplicants((prev) => [...prev, ...(response.content ?? [])]);
        setApplicantsNextCursorId(response.nextCursorId ?? null);
        setHasNextApplicants(response.hasNext === true);
        return;
      }

      if (activeTab === "participants") {
        const response = await getContestParticipants(seasonId, {
          cursorId,
          size: MEMBERS_PAGE_SIZE,
        });

        setParticipants((prev) => [...prev, ...(response.content ?? [])]);
        setParticipantsNextCursorId(response.nextCursorId ?? null);
        setHasNextParticipants(response.hasNext === true);
        return;
      }

      const response = await getRejectedContestApplicants(seasonId, {
        cursorId,
        size: MEMBERS_PAGE_SIZE,
      });

      setRejectedApplicants((prev) => [...prev, ...(response.content ?? [])]);
      setRejectedNextCursorId(response.nextCursorId ?? null);
      setHasNextRejected(response.hasNext === true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        await alert(ADMIN_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      if (message.includes("403")) {
        await alert(
          getAdminForbiddenMessage("참가자 정보를 더 불러올 수 없습니다.")
        );
        return;
      }

      console.error("대회 참가자 목록 추가 조회 실패:", error);
      await alert("참가자 정보를 더 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      {showTabs ? (
        <div className="flex flex-wrap gap-2">
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {activeTab === "applicants" ? (
        <div className="space-y-4">
          {!canProcessApplicants ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
              {processBlockedMessage}
            </div>
          ) : null}

          <div className="flex justify-end">
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="white"
                onClick={handleApproveSelected}
                disabled={
                  isSubmittingAction ||
                  selectedApplicantIds.length === 0 ||
                  !canProcessApplicants
                }
              >
                선택 승인
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {activeTab === "applicants" ? (
                <th className="w-[70px] px-4 py-4 text-center font-black">
                  <input
                    type="checkbox"
                    aria-label={isAllSelected ? "전체 선택 해제" : "전체 선택"}
                    checked={isAllSelected}
                    onChange={toggleSelectAllApplicants}
                    disabled={
                      isLoading || applicants.length === 0 || !canProcessApplicants
                    }
                  />
                </th>
              ) : null}
              <th className="w-[120px] px-4 py-4 text-center font-black">
                회원 ID
              </th>
              <th className="w-[220px] px-4 py-4 text-left font-black">
                닉네임
              </th>
              <th className="w-[220px] px-4 py-4 text-left font-black">
                신청일
              </th>
              {activeTab === "participants" ? (
                <th className="w-[220px] px-4 py-4 text-left font-black">
                  승인 관리자
                </th>
              ) : null}
              {activeTab === "participants" ? (
                <th className="w-[220px] px-4 py-4 text-left font-black">
                  승인일
                </th>
              ) : null}
              {activeTab === "rejected" ? (
                <>
                  <th className="w-[220px] px-4 py-4 text-left font-black">
                    반려 관리자
                  </th>
                  <th className="w-[220px] px-4 py-4 text-left font-black">
                    반려일
                  </th>
                  <th className="px-4 py-4 text-left font-black">반려 사유</th>
                </>
              ) : null}
              {activeTab === "applicants" ? (
                <th className="w-[220px] px-4 py-4 text-center font-black">
                  작업
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-6 py-16 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  참가자 정보를 불러오는 중입니다...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-6 py-16 text-center text-sm font-medium text-red-500"
                >
                  {loadError}
                </td>
              </tr>
            ) : activeTab === "applicants" ? (
              applicants.length > 0 ? (
                applicants.map((applicant) => (
                  <tr
                    key={applicant.applicantId}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedApplicantIds.includes(applicant.applicantId)}
                        onChange={() =>
                          toggleApplicantSelection(applicant.applicantId)
                        }
                      />
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-gray-600 dark:text-gray-400">
                      {applicant.memberId}
                    </td>
                    <td className="px-4 py-4">
                      <AvatarName
                        name={applicant.nickname}
                        profileImgUrl={applicant.profileImgUrl}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {formatDateTime(applicant.appliedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="white"
                          onClick={() =>
                            void handleApproveSingle(applicant.applicantId)
                          }
                          disabled={isSubmittingAction || !canProcessApplicants}
                        >
                          승인
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="gray"
                          onClick={() =>
                            handleOpenRejectModal(applicant)
                          }
                          disabled={isSubmittingAction || !canProcessApplicants}
                        >
                          반려
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-6 py-16 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    현재 승인 대기 중인 신청자가 없습니다.
                  </td>
                </tr>
              )
            ) : activeTab === "participants" ? (
              participants.length > 0 ? (
                participants.map((participant) => (
                  <tr
                    key={participant.participantId}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-4 text-center font-bold text-gray-600 dark:text-gray-400">
                      {participant.memberId}
                    </td>
                    <td className="px-4 py-4">
                      <AvatarName
                        name={participant.nickname}
                        profileImgUrl={participant.profileImgUrl}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {formatDateTime(participant.appliedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <AvatarName
                        name={participant.approvedByAdminNickname}
                        profileImgUrl={participant.approvedByAdminProfileImgUrl}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {formatDateTime(participant.approvedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columnCount}
                    className="px-6 py-16 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    현재 참가 승인된 사용자가 없습니다.
                  </td>
                </tr>
              )
            ) : rejectedApplicants.length > 0 ? (
              rejectedApplicants.map((rejectedApplicant) => (
                <tr
                  key={rejectedApplicant.rejectedApplicantId}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-4 text-center font-bold text-gray-600 dark:text-gray-400">
                    {rejectedApplicant.memberId}
                  </td>
                  <td className="px-4 py-4">
                    <AvatarName
                      name={rejectedApplicant.nickname}
                      profileImgUrl={rejectedApplicant.profileImgUrl}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {formatDateTime(rejectedApplicant.appliedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <AvatarName
                      name={rejectedApplicant.rejectedByAdminNickname}
                      profileImgUrl={rejectedApplicant.rejectedByAdminProfileImgUrl}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {formatDateTime(rejectedApplicant.rejectedAt)}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">
                    {rejectedApplicant.rejectReason}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-6 py-16 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  현재 반려 이력이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && !loadError && canLoadMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            size="sm"
            variant="white"
            onClick={() => void handleLoadMore()}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              "목록 불러오는 중..."
            ) : (
              <span className="inline-flex items-center gap-1">
                목록 5개 더보기
                <ChevronDown size={16} />
              </span>
            )}
          </Button>
        </div>
      ) : null}

      {rejectingApplicant ? (
        <BaseModal
          title="신청자 반려"
          onClose={handleCloseRejectModal}
          footer={
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="white"
                onClick={handleCloseRejectModal}
                disabled={isSubmittingAction}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="gray"
                onClick={() => void handleConfirmReject()}
                disabled={isSubmittingAction}
              >
                반려
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm font-medium leading-6 text-gray-600 dark:text-gray-400">
              <span className="font-black text-gray-900 dark:text-gray-100">
                {rejectingApplicant.nickname}
              </span>
              {" "}신청자를 반려합니다. 반려 사유를 입력해 주세요.
            </p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="반려 사유를 입력해 주세요."
              className="min-h-32 w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-[#0058FF] focus:ring-2 focus:ring-[#0058FF]"
            />
          </div>
        </BaseModal>
      ) : null}
    </div>
  );
}
