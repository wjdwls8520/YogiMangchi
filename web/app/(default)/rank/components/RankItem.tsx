"use client";

import { cn, getProfitColorClass } from "@/lib/utils/cs";
import { RankItemProps } from "../types/user";
import UserAvatar from "@/components/user/UserAvatar";
import { formatSignedNumber, formatNumber } from "@/lib/utils/number";
import Link from "next/link";
import Button from "@/components/ui/Button";

const medalColor = [
  "bg-[linear-gradient(139deg,rgba(255,215,0,1)_0%,rgba(255,215,0,1)_60%,rgba(223,117,0,1)_100%)]", 
  "bg-[linear-gradient(139deg,#E5E7EB_0%,#D1D5DB_60%,#9CA3AF_100%)]", 
  "bg-[linear-gradient(139deg,#CD7F32_0%,#B45309_60%,#92400E_100%)]"
];

export default function RankItem({
  rank,
  memberId,
  nickname,
  profileImgUrl,
  mode,
  profileMsg,
  followerCount = 0,
  bestCount = 0,
  followedByMe = false,
  onFollowToggle,
  isFollowLoading = false,
  profitRate = 0,
  realizedPnl = 0,
}: RankItemProps) {
  const isRanker: boolean = rank <= 3;

  return (
    <li className="relative border-gray-200 dark:border-gray-700 border p-[25px] rounded-2xl text-center bg-white dark:bg-gray-800 transition-colors shadow-sm hover:shadow-md">
      <p
        className={cn(
          "flex items-center justify-center absolute top-[15px] left-[15px] w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 font-extrabold text-sm text-slate-800 dark:text-gray-200",
          isRanker && `text-white ${medalColor[rank - 1]}`
        )}
      >
        {rank}
      </p>
      
      <article className="flex flex-col h-full justify-between">
        <header>
          <div className="flex justify-center mb-4">
            <Link href={`/member/${memberId}`} className="block transition-transform hover:scale-105">
              <UserAvatar profileImg={profileImgUrl || ""} classes="w-[64px] h-[64px]" />
            </Link>
          </div>
          <Link href={`/member/${memberId}`} className="block group">
            <h3 className="font-bold text-xl text-slate-900 dark:text-gray-100 truncate px-2 group-hover:text-blue-600 transition-colors">
              {nickname}
            </h3>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 pt-1 text-sm truncate min-h-[20px] max-w-[200px] mx-auto">
            {mode === "followers" ? (profileMsg || "한 줄 소개가 없습니다.") : "대회 참가자"}
          </p>
        </header>

        {mode === "contest" ? (
          <dl className="flex justify-center gap-6 bg-sky-50/50 dark:bg-zinc-900/50 rounded-xl mt-5 py-4 px-2">
            <div className="flex-1">
              <dt className="text-xs text-gray-400 dark:text-gray-500 pb-1">수익률</dt>
              <dd className={cn("text-base font-bold", getProfitColorClass(profitRate))}>
                {profitRate >= 0 ? "+" : ""}{profitRate.toFixed(2)}%
              </dd>
            </div>
            <div className="w-[1px] bg-gray-200 dark:bg-gray-750 self-stretch" />
            <div className="flex-1">
              <dt className="text-xs text-gray-400 dark:text-gray-500 pb-1">실현손익</dt>
              <dd className={cn("text-base font-bold truncate", getProfitColorClass(realizedPnl))}>
                {formatSignedNumber(realizedPnl)} <span className="text-xxs font-normal">USDT</span>
              </dd>
            </div>
          </dl>
        ) : (
          <dl className="flex justify-center gap-6 bg-sky-50/50 dark:bg-zinc-900/50 rounded-xl mt-5 py-4 px-2">
            <div className="flex-1">
              <dt className="text-xs text-gray-400 dark:text-gray-500 pb-1">팔로워</dt>
              <dd className="text-base font-bold text-slate-900 dark:text-gray-100">
                {formatNumber(followerCount)}명
              </dd>
            </div>
          </dl>
        )}

        {onFollowToggle && (
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (onFollowToggle) {
                onFollowToggle(memberId, followedByMe);
              }
            }}
            disabled={isFollowLoading}
            variant={followedByMe ? "gray" : "white"}
            className="w-full mt-5 h-10 text-sm font-semibold"
          >
            {isFollowLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : followedByMe ? (
              "팔로잉"
            ) : (
              "팔로우"
            )}
          </Button>
        )}
      </article>
    </li>
  );
}