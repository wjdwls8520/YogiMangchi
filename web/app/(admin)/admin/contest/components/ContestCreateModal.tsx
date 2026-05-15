"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import BaseModal from "@/components/ui/BaseModal";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import Input from "@/components/ui/Input";
import { createContestSeason } from "@/lib/api/admin-contest";
import type { ContestSeason } from "@/lib/api/contest";
import {
  ADMIN_LOGIN_REQUIRED_MESSAGE,
  getAdminForbiddenMessage,
} from "@/lib/utils/adminFeedback";

type ContestCreateModalProps = {
  onClose: () => void;
  onCreated?: (season: ContestSeason) => void;
};

type ContestCreateForm = {
  title: string;
  description: string;
  recruitmentStartAt: string;
  recruitmentEndAt: string;
  contestStartAt: string;
  contestEndAt: string;
};

const DESCRIPTION_MAX_LENGTH = 255;

const toDateTimeLocalString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getDateByOffset = (
  baseDate: Date,
  dayOffset: number,
  hour: number,
  minute: number
) => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + dayOffset);
  nextDate.setHours(hour, minute, 0, 0);
  return nextDate;
};

const getDefaultContestCreateForm = (): ContestCreateForm => {
  return {
    title: "",
    description: "",
    recruitmentStartAt: toDateTimeLocalString(getDateByOffset(new Date(), 0, 0, 0)),
    recruitmentEndAt: "",
    contestStartAt: "",
    contestEndAt: "",
  };
};

const getLocalDateTimeValue = (value: string) => {
  return value ? value.slice(0, 16) : "";
};

const getTodayMinDateTime = () => {
  return toDateTimeLocalString(getDateByOffset(new Date(), 0, 0, 0));
};

export default function ContestCreateModal({
  onClose,
  onCreated,
}: ContestCreateModalProps) {
  const { alert, toast } = useFeedback();
  const formId = "contest-create-form";
  const [form, setForm] = useState<ContestCreateForm>(
    getDefaultContestCreateForm
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const todayDateTime = getTodayMinDateTime();
  const descriptionLength = form.description.length;
  const isDescriptionTooLong = descriptionLength > DESCRIPTION_MAX_LENGTH;

  const updateField = (field: keyof ContestCreateForm, value: string) => {
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

    if (new Date(form.contestStartAt) < new Date(form.recruitmentStartAt)) {
      await alert("대회 시작 시점은 모집 시작 시점 이전일 수 없습니다.");
      return;
    }

    if (new Date(form.recruitmentEndAt) > new Date(form.contestEndAt)) {
      await alert("모집 마감 시점은 대회 종료 시점 이후일 수 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdSeason = await createContestSeason({
        title: form.title.trim(),
        description: form.description.trim(),
        recruitmentStartAt: form.recruitmentStartAt,
        recruitmentEndAt: form.recruitmentEndAt,
        contestStartAt: form.contestStartAt,
        contestEndAt: form.contestEndAt,
      });

      onCreated?.(createdSeason);
      toast({
        title: "대회가 생성되었습니다.",
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
        await alert(getAdminForbiddenMessage("대회를 생성할 수 없습니다."));
        return;
      }

      console.error("대회 생성 실패:", error);
      await alert("대회 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      title="대회 생성"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="white" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "대회 생성"}
          </Button>
        </div>
      }
    >
        <form id={formId} onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-5">
            <div className="grid gap-5">
              <label className="space-y-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">대회명</span>
                <Input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="예: 2026년 4월 선물 트레이딩 대회"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">설명</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  placeholder="대회 안내 문구와 운영 설명을 입력해 주세요."
                    className={`min-h-20 w-full resize-none rounded-xl border px-4 py-3 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-900 outline-none transition-all focus:ring-2 ${
                      isDescriptionTooLong
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-[#0058FF] dark:focus:border-[#0058FF] focus:ring-[#0058FF]"
                    }`}
                />
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span
                    className={
                      isDescriptionTooLong ? "font-medium text-red-500" : "text-gray-500 dark:text-gray-400"
                    }
                  >
                    {isDescriptionTooLong
                      ? `대회 설명은 ${DESCRIPTION_MAX_LENGTH}자 이하로 입력해 주세요.`
                      : "대회 설명은 최대 255자까지 입력할 수 있습니다."}
                  </span>
                  <span
                    className={
                      isDescriptionTooLong ? "font-bold text-red-500" : "font-medium text-gray-400 dark:text-gray-500"
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
               <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
                <p className="mb-4 text-sm font-black text-gray-900 dark:text-gray-100">모집 기간</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      모집 시작일
                    </span>
                    <Input
                      type="datetime-local"
                      min={todayDateTime}
                      value={getLocalDateTimeValue(form.recruitmentStartAt)}
                      onChange={(event) =>
                        updateField("recruitmentStartAt", event.target.value)
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      모집 종료일
                    </span>
                    <Input
                      type="datetime-local"
                      min={todayDateTime}
                      value={getLocalDateTimeValue(form.recruitmentEndAt)}
                      onChange={(event) =>
                        updateField("recruitmentEndAt", event.target.value)
                      }
                    />
                  </label>
                </div>
              </div>

               <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-5">
                <p className="mb-4 text-sm font-black text-gray-900 dark:text-gray-100">대회 기간</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      대회 시작일
                    </span>
                    <Input
                      type="datetime-local"
                      min={todayDateTime}
                      value={getLocalDateTimeValue(form.contestStartAt)}
                      onChange={(event) =>
                        updateField("contestStartAt", event.target.value)
                      }
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      대회 종료일
                    </span>
                    <Input
                      type="datetime-local"
                      min={todayDateTime}
                      value={getLocalDateTimeValue(form.contestEndAt)}
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
