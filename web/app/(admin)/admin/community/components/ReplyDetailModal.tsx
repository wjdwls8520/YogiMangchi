"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import BaseModal from "@/components/ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { deleteReplyByAdmin, type AdminReply } from "@/lib/api/admin-community";

type ReplyDetailModalProps = {
  reply: AdminReply;
  onClose: () => void;
  onDeleted?: () => void;
};

export default function ReplyDetailModal({
  reply,
  onClose,
  onDeleted,
}: ReplyDetailModalProps) {
  const { alert, confirm, toast } = useFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    const shouldProceed = await confirm({
      description: "정말 이 댓글을 강제 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      confirmText: "강제 삭제",
      tone: "danger",
    });

    if (!shouldProceed) {
      return;
    }

    const userInput = window.prompt("강제 삭제를 계속 진행하려면 대문자 'OK'를 입력해 주세요.");
    if (userInput !== "OK") {
      await alert("입력값이 올바르지 않습니다. 댓글 삭제 처리가 취소되었습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteReplyByAdmin(reply.replyId);
      toast({
        title: "댓글이 성공적으로 삭제되었습니다.",
        tone: "success",
      });
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      await alert(error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.");
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
      title="댓글 상세 정보"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="white" onClick={onClose}>
            닫기
          </Button>
          {reply.deleteYn === "N" && (
            <Button
              type="button"
              variant="red"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "삭제 처리 중..." : "댓글 강제 삭제"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5 space-y-1">
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-1">
            <span>댓글 ID: {reply.replyId}</span>
            <span>소속 게시글 ID: {reply.postId}</span>
            <span>작성자 ID: {reply.authorId}</span>
          </div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">댓글 내용</p>
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed font-black">
            {reply.content}
          </p>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">좋아요 수</p>
            <p className="mt-1 text-lg font-black text-gray-900 dark:text-gray-100">{reply.likeCount}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">신고 수</p>
            <p className="mt-1 text-lg font-black text-red-600 dark:text-red-500">{reply.reportCount}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">상태</p>
            <p className="mt-1 text-sm font-black">
              {reply.deleteYn === "Y" ? (
                <span className="text-rose-600">삭제됨</span>
              ) : (
                <span className="text-emerald-600">정상</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div className="flex justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
            <span className="font-bold text-gray-500 dark:text-gray-400">작성 시점</span>
            <span className="font-black text-gray-900 dark:text-gray-100">{formatDateTime(reply.createdAt)}</span>
          </div>
          <div className="flex justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
            <span className="font-bold text-gray-500 dark:text-gray-400">마지막 수정</span>
            <span className="font-black text-gray-900 dark:text-gray-100">{formatDateTime(reply.updatedAt)}</span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
