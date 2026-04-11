"use client";

import type { ReactNode } from "react";

import type {
  BaseMemberProfile,
  MemberRole,
  MemberProfileInfo,
  MyMemberProfile,
} from "./types";

type ProfileSidebarUser =
  | BaseMemberProfile
  | MemberProfileInfo
  | MyMemberProfile;

interface ProfileSidebarProps {
  profile: ProfileSidebarUser;
  actionArea?: ReactNode;
  relationArea?: ReactNode;
  onClickFollowers?: () => void;
  onClickFollowings?: () => void;
}

function StatTag({
  label,
  value,
  isClickable = false,
  onClick,
  hasLeftBorder = false,
}: {
  label: string;
  value: number;
  isClickable?: boolean;
  onClick?: () => void;
  hasLeftBorder?: boolean;
}) {
  const className = `${hasLeftBorder ? "border-l border-gray-50 " : ""}text-center`;

  if (isClickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} rounded-2xl px-2 py-1 transition-colors hover:bg-gray-50`}
      >
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          {label}
        </p>
        <p className="text-lg font-black transition-colors hover:text-[#0058FF]">
          {value}
        </p>
      </button>
    );
  }

  return (
    <div className={className}>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        {label}
      </p>
      <p className="text-lg font-black">{value}</p>
    </div>
  );
}

const getRoleLabel = (role?: MemberRole) => {
  if (role === "VERIFIED_USER") return "인증회원";
  if (role === "ADMIN") return "관리자";
  if (role === "USER") return "일반회원";
  return "";
};

const getRoleBadgeClassName = (role?: MemberRole) => {
  if (role === "VERIFIED_USER") {
    return "bg-blue-50 text-blue-600";
  }

  if (role === "ADMIN") {
    return "bg-orange-50 text-orange-600";
  }

  return "bg-gray-100 text-gray-600";
};

export default function ProfileSidebar({
  profile,
  actionArea,
  relationArea,
  onClickFollowers,
  onClickFollowings,
}: ProfileSidebarProps) {
  const roleLabel = "role" in profile ? getRoleLabel(profile.role) : "";
  const hasRole = Boolean(roleLabel);

  return (
    <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
      <div className="flex flex-col items-center">
        <div className="relative h-24 w-24 mb-3 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50 overflow-hidden text-gray-400">
          <img
            src={profile.profileImgUrl || "/user_default.png"}
            alt="profile"
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = "/user_default.png";
            }}
          />
        </div>

        {hasRole ? (
          <span
            className={`inline-flex rounded-full mb-2 px-3 py-1 text-xs font-bold ${getRoleBadgeClassName(
              "role" in profile ? profile.role : undefined
            )}`}
          >
            {roleLabel}
          </span>
        ) : null}

        <h2 className="text-2xl font-black text-gray-900">{profile.nickname}</h2>

        <p className="text-sm text-gray-400 mt-1 font-medium text-center">
          {profile.profileMsg || "소개글이 없습니다."}
        </p>

        {relationArea ? <div className="mt-3 w-full">{relationArea}</div> : null}
        {actionArea ? <div className="mt-6 w-full">{actionArea}</div> : null}

        <div className="grid grid-cols-2 w-full mt-6 pt-6 border-t border-gray-50">
          <StatTag
            label="Followers"
            value={profile.followerCount}
            isClickable={Boolean(onClickFollowers)}
            onClick={onClickFollowers}
          />

          <StatTag
            label="Following"
            value={profile.followingCount}
            isClickable={Boolean(onClickFollowings)}
            onClick={onClickFollowings}
            hasLeftBorder
          />

          {/* <div className="text-center border-l border-gray-50">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Mangchi
            </p>
            <p className="text-lg font-black text-orange-500">
              {profile.bestCount}
            </p>
          </div> */}
        </div>
      </div>
    </section>
  );
}
