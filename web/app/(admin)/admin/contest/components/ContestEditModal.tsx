"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import BaseModal from "@/components/ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import Input from "@/components/ui/Input";
import { updateContestSeason } from "@/lib/api/admin-contest";
import type { ContestSeason } from "@/lib/api/contest";
import {
  ADMIN_LOGIN_REQUIRED_MESSAGE,
  getAdminForbiddenMessage,
} from "@/lib/utils/adminFeedback";

type ContestEditModalProps = {
  season: ContestSeason;
  onClose: () => void;
  onUpdated?: (season: ContestSeason) => void;
};

type ContestEditForm = {
  title: string;
  description: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
};

const DESCRIPTION_MAX_LENGTH = 255;

const getLocalDateTimeValue = (value: string) => {
  return value ? value.slice(0, 16) : "";
};

const getInitialEditForm = (season: ContestSeason): ContestEditForm => {
  return {
    title: season.title,
    description: season.description,
    recruitmentStartAt: getLocalDateTimeValue(season.recruitmentStartAt),
    recruitmentEndAt: getLocalDateTimeValue(season.recruitmentEndAt),
    contestStartAt: getLocalDateTimeValue(season.contestStartAt),
    contestEndAt: getLocalDateTimeValue(season.contestEndAt),
  };
};

export default function ContestEditModal({
  season,
  onClose,
  onUpdated,
}: ContestEditModalProps) {
  const { alert, toast } = useFeedback();
  const formId = `contest-edit-form-${season.id}`;
  const [form, setForm] = useState<ContestEditForm>(() =>
    getInitialEditForm(season)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionLength = form.description.length;
  const isDescriptionTooLong = descriptionLength > DESCRIPTION_MAX_LENGTH;

  const hasChanged = useMemo(() => {
    const initialForm = getInitialEditForm(season);

    return (
      initialForm.title !== form.title ||
      initialForm.description !== form.description ||
      initialForm.recruitmentStartAt !== form.recruitmentStartAt ||
      initialForm.recruitmentEndAt !== form.recruitmentEndAt ||
      initialForm.contestStartAt !== form.contestStartAt ||
      initialForm.contestEndAt !== form.contestEndAt
    );
  }, [form, season]);

  const updateField = (field: keyof ContestEditForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.recruitmentStartAt ||
      !form.recruitmentEndAt ||
      !form.contestStartAt ||
      !form.contestEndAt
    ) {
      await alert("모든 항목을 입력해 주세요.");
      return;
    }

    if (isDescriptionTooLong) {
      await alert(`대회 설명은 ${DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`);
      return;
    }

    if (new Date(form.recruitmentStartAt) >= new Date(form.recruitmentEndAt)) {
      await alert("모집 종료일은 모집 시작일보다 뒤여야 합니다.");
      return;
    }

    if (new Date(form.contestStartAt) >= new Date(form.contestEndAt)) {
      await alert("대회 종료일은 대회 시작일보다 뒤여야 합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedSeason = await updateContestSeason(season.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        recruitmentStartAt: form.recruitmentStartAt,
        recruitmentEndAt: form.recruitmentEndAt,
        contestStartAt: form.contestStartAt,
        contestEndAt: form.contestEndAt,
      });

      onUpdated?.(updatedSeason);
      toast({
        title: "대회 정보가 수정되었습니다.",
        tone: "success",
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("401")) {
        await alert(ADMIN_LOGIN_REQUIRED_MESSAGE);
        return;
      }

      if (message.includes("403")) {
        await alert(
          getAdminForbiddenMessage("대회 정보를 수정할 수 없습니다.")
        );
        return;
      }

      console.error("대회 수정 실패:", error);
      await alert("대회 정보 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      title="대회 정보 수정"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="white" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting || !hasChanged}>
            {isSubmitting ? "수정 중..." : "수정 완료"}
          </Button>
        </div>
      }
    >
        <form id={formId} onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-5">
            <div className="grid gap-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-gray-700">대회명</span>
                <Input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="예: 2026년 4월 선물 트레이딩 대회"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-gray-700">설명</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  placeholder="대회 안내 문구와 운영 설명을 입력해 주세요."
                  className={`min-h-20 w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:ring-2 ${
                    isDescriptionTooLong
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:border-[#0058FF] focus:ring-[#0058FF]"
                  }`}
                />
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span
                    className={
                      isDescriptionTooLong ? "font-medium text-red-500" : "text-gray-500"
                    }
                  >
                    {isDescriptionTooLong
                      ? `대회 설명은 ${DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`
                      : "대회 설명은 최대 255자까지 입력할 수 있습니다."}
                  </span>
                  <span
                    className={
                      isDescriptionTooLong ? "font-bold text-red-500" : "font-medium text-gray-400"
                    }
                  >
                    {descriptionLength} / {DESCRIPTION_MAX_LENGTH}자
                  </span>
                </div>
              </label>
            </div>
          </section>

          <section className="space-y-5">
            <div className="grid gap-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="mb-4 text-sm font-black text-gray-900">모집 기간</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700">
                      모집 시작일
                    </span>
                    <Input
                      type="datetime-local"
                      value={form.recruitmentStartAt}
                      onChange={(event) =>
                        updateField("recruitmentStartAt", event.target.value)
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700">
                      모집 종료일
                    </span>
                    <Input
                      type="datetime-local"
                      value={form.recruitmentEndAt}
                      onChange={(event) =>
                        updateField("recruitmentEndAt", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <p className="mb-4 text-sm font-black text-gray-900">대회 기간</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700">
                      대회 시작일
                    </span>
                    <Input
                      type="datetime-local"
                      value={form.contestStartAt}
                      onChange={(event) =>
                        updateField("contestStartAt", event.target.value)
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700">
                      대회 종료일
                    </span>
                    <Input
                      type="datetime-local"
                      value={form.contestEndAt}
                      onChange={(event) =>
                        updateField("contestEndAt", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </form>
    </BaseModal>
  );
}
