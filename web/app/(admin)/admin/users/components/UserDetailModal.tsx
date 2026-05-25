"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import BaseModal from "@/components/ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { withdrawMemberByAdmin, type AdminMember } from "@/lib/api/admin-member";

type UserDetailModalProps = {
  member: AdminMember;
  onClose: () => void;
  onWithdrawn?: () => void;
};

export default function UserDetailModal({
  member,
  onClose,
  onWithdrawn,
}: UserDetailModalProps) {
  const { alert, confirm, toast } = useFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    const shouldProceed = await confirm({
      description: "정말 해당 회원을 강제 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      confirmText: "강제 탈퇴",
      tone: "danger",
    });

    if (!shouldProceed) {
      return;
    }

    const userInput = window.prompt("강제 탈퇴를 계속 진행하려면 대문자 'OK'를 입력해 주세요.");
    if (userInput !== "OK") {
      await alert("입력값이 올바르지 않습니다. 강제 탈퇴 처리가 취소되었습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await withdrawMemberByAdmin(member.memberId);
      toast({
        title: "회원이 성공적으로 강제 탈퇴 처리되었습니다.",
        tone: "success",
      });
      onWithdrawn?.();
      onClose();
    } catch (error) {
      console.error("회원 강제 탈퇴 실패:", error);
      await alert(error instanceof Error ? error.message : "회원 탈퇴 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <BaseModal
      title="회원 상세 정보"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="white" onClick={onClose}>
            닫기
          </Button>
          {member.deleteYn === "N" && (
            <Button
              type="button"
              variant="red"
              onClick={handleWithdraw}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "탈퇴 처리 중..." : "회원 강제 탈퇴"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
          {member.profileImgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.profileImgUrl}
              alt={member.nickname}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-700 text-xl font-bold text-gray-600 dark:text-gray-400">
              {member.nickname.slice(0, 1)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
              {member.nickname}
            </h3>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              ID: {member.memberId}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">권한 역할</p>
            <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">{member.role}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">회원 상태</p>
            <p className="mt-1 text-sm font-black">
              {member.deleteYn === "Y" ? (
                <span className="text-rose-600">탈퇴 회원</span>
              ) : (
                <span className="text-emerald-600">활성 회원</span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">가입 일자</p>
            <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">
              {formatDateTime(member.createdAt)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">소셜 계정 연동 여부</p>
            <p className="mt-1 text-sm font-black text-gray-900 dark:text-gray-100">
              {member.oauthProvider ? (
                <span className="capitalize">{member.oauthProvider} 연동됨</span>
              ) : (
                <span className="text-gray-500">연동 없음</span>
              )}
            </p>
          </div>
        </div>

        {member.oauthProvider && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5 space-y-4">
            <p className="text-sm font-black text-gray-900 dark:text-gray-100">OAuth 상세 연동 정보</p>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-gray-500 dark:text-gray-400">이메일</span>
                <span className="font-black text-gray-900 dark:text-gray-100">{member.oauthEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-500 dark:text-gray-400">제공자 (Provider)</span>
                <span className="font-black text-gray-900 dark:text-gray-100 capitalize">
                  {member.oauthProvider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-500 dark:text-gray-400">소셜 고유 ID</span>
                <span className="font-black text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                  {member.oauthProviderUserId}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
