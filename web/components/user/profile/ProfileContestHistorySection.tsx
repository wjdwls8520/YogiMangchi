"use client";

import { formatDateTime } from "@/lib/utils/date";
import {
  translateContestDisplayStatus,
  type ContestParticipationSeason,
} from "@/lib/api/contest";

import { ProfileEmptyState } from "./ProfileCommunitySection";

interface ProfileContestHistorySectionProps {
  contestSeasons: ContestParticipationSeason[];
  isLoading: boolean;
  errorMessage?: string;
}

export default function ProfileContestHistorySection({
  contestSeasons,
  isLoading,
  errorMessage = "",
}: ProfileContestHistorySectionProps) {
  return (
    <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-lg font-black text-gray-900">대회 이력</h3>
        <p className="mt-1 text-sm text-gray-500">
          공개된 대회 참가 이력만 확인할 수 있습니다.
        </p>
      </div>

      {isLoading ? (
        <ProfileEmptyState text="대회 이력을 불러오는 중입니다." />
      ) : errorMessage ? (
        <ProfileEmptyState text={errorMessage} />
      ) : contestSeasons.length > 0 ? (
        <div className="space-y-4">
          {contestSeasons.map((season) => (
            <div
              key={season.participantId}
              className="rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-base font-black text-gray-900">
                      {season.seasonTitle}
                    </h4>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                      {translateContestDisplayStatus({
                        displayStatus: season.displayStatus,
                      })}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                      {season.isLive
                        ? "라이브 진행중"
                        : season.isRecruiting
                          ? "모집중"
                          : "대기중"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {season.seasonDescription}
                  </p>
                </div>

                <div className="grid shrink-0 gap-2 text-sm text-gray-500 md:min-w-[220px]">
                  <p>
                    <span className="font-bold text-gray-700">승인일</span>{" "}
                    {formatDateTime(season.approvedAt)}
                  </p>
                  <p>
                    <span className="font-bold text-gray-700">대회 기간</span>{" "}
                    {formatDateTime(season.contestStartAt)} ~{" "}
                    {formatDateTime(season.contestEndAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ProfileEmptyState text="공개된 대회 이력이 없습니다." />
      )}
    </section>
  );
}
