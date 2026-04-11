"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import BaseModal from "@/components/ui/BaseModal";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils/date";
import type { FollowMember } from "@/lib/api/member";

type FollowListType = "followers" | "followings";

type FollowMembersModalProps = {
  type: FollowListType | null;
  members: FollowMember[];
  isLoading: boolean;
  isLoadingMore: boolean;
  errorMessage: string;
  hasNext: boolean;
  onClose: () => void;
  onLoadMore: () => void;
};

const MODAL_TITLE: Record<FollowListType, string> = {
  followers: "팔로워 목록",
  followings: "팔로잉 목록",
};

const EMPTY_MESSAGE: Record<FollowListType, string> = {
  followers: "아직 팔로워가 없습니다.",
  followings: "아직 팔로잉한 멤버가 없습니다.",
};

export default function FollowMembersModal({
  type,
  members,
  isLoading,
  isLoadingMore,
  errorMessage,
  hasNext,
  onClose,
  onLoadMore,
}: FollowMembersModalProps) {
  if (!type) return null;

  return (
    <BaseModal title={MODAL_TITLE[type]} onClose={onClose}>
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl bg-gray-50 px-5 py-8 text-center text-sm font-bold text-gray-400">
            목록을 불러오는 중입니다.
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-5 py-8 text-center text-sm font-bold text-red-500">
            {errorMessage}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 px-5 py-8 text-center text-sm font-bold text-gray-400">
            {EMPTY_MESSAGE[type]}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={`${type}-${member.memberId}-${member.followCreatedAt}`}
                  className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/member/${member.memberId}`}
                      onClick={onClose}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl transition-colors hover:bg-gray-50"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                        <img
                          src={member.profileImgUrl || "/user_default.png"}
                          alt={member.nickname}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = "/user_default.png";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-gray-900 transition-colors hover:text-[#0058FF]">
                          {member.nickname}
                        </p>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {member.profileMsg || "소개글이 없습니다."}
                        </p>
                      </div>
                    </Link>

                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Since
                      </p>
                      <p className="mt-1 text-xs font-medium text-gray-600">
                        {formatDateTime(member.followCreatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasNext ? (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="white"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    "목록 불러오는 중..."
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      5명 더보기
                      <ChevronDown size={16} />
                    </span>
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </BaseModal>
  );
}
