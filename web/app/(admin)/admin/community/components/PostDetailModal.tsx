"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import BaseModal from "@/components/ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { deletePostByAdmin, type AdminPost } from "@/lib/api/admin-community";

type PostDetailModalProps = {
  post: AdminPost;
  onClose: () => void;
  onDeleted?: () => void;
};

export default function PostDetailModal({
  post,
  onClose,
  onDeleted,
}: PostDetailModalProps) {
  const { alert, confirm, toast } = useFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    const shouldProceed = await confirm({
      description: "정말 이 게시글을 강제 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      confirmText: "강제 삭제",
      tone: "danger",
    });

    if (!shouldProceed) {
      return;
    }

    const userInput = window.prompt("강제 삭제를 계속 진행하려면 대문자 'OK'를 입력해 주세요.");
    if (userInput !== "OK") {
      await alert("입력값이 올바르지 않습니다. 게시글 삭제 처리가 취소되었습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await deletePostByAdmin(post.postId);
      toast({
        title: "게시글이 성공적으로 삭제되었습니다.",
        tone: "success",
      });
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      await alert(error instanceof Error ? error.message : "게시글 삭제에 실패했습니다.");
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
      title="게시글 상세 정보"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="white" onClick={onClose}>
            닫기
          </Button>
          {post.deleteYn === "N" && (
            <Button
              type="button"
              variant="red"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "삭제 처리 중..." : "게시글 강제 삭제"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5 space-y-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">게시글 제목</span>
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">
            {post.title}
          </h3>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
            <span>게시글 ID: {post.postId}</span>
            <span>작성자 ID: {post.authorId}</span>
            <span>닉네임: {post.authorNickname}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-5 min-h-[120px] max-h-[300px] overflow-y-auto">
          <p className="text-xs font-bold text-gray-400 mb-2">본문 내용</p>
          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">좋아요 수</p>
            <p className="mt-1 text-lg font-black text-gray-900 dark:text-gray-100">{post.likeCount}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">댓글 수</p>
            <p className="mt-1 text-lg font-black text-gray-900 dark:text-gray-100">{post.replyCount}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">신고 수</p>
            <p className="mt-1 text-lg font-black text-red-600 dark:text-red-500">{post.reportCount}</p>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">상태</p>
            <p className="mt-1 text-sm font-black">
              {post.deleteYn === "Y" ? (
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
            <span className="font-black text-gray-900 dark:text-gray-100">{formatDateTime(post.createdAt)}</span>
          </div>
          <div className="flex justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
            <span className="font-bold text-gray-500 dark:text-gray-400">마지막 수정</span>
            <span className="font-black text-gray-900 dark:text-gray-100">{formatDateTime(post.updatedAt)}</span>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
