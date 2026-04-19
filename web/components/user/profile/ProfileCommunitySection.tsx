"use client";

import Link from "next/link";

import SegmentTabs from "@/components/ui/SegmentTabs";
import { formatTime } from "@/lib/utils/date";
import type { Post, Reply } from "@/app/(default)/community/types/post";

import type { LikedPost, ProfileCommunityTab, ProfileReportItem } from "./types";

interface ProfileCommunitySectionProps {
  communityTab: ProfileCommunityTab;
  onChange: (value: ProfileCommunityTab) => void;
  posts: Post[];
  replies: Reply[];
  likedPosts?: LikedPost[];
  likedReplies?: Reply[];
  reports?: ProfileReportItem[];
  isLoadingPosts: boolean;
  isLoadingReplies: boolean;
  isLoadingLikedPosts?: boolean;
  isLoadingLikedReplies?: boolean;
  isLoadingReports?: boolean;
  postsErrorMessage?: string;
  repliesErrorMessage?: string;
  likedPostsErrorMessage?: string;
  likedRepliesErrorMessage?: string;
  reportsErrorMessage?: string;
  isOwnProfile?: boolean;
  onCancelReport?: (report: ProfileReportItem) => void;
  cancellingReportKey?: string | null;
  showTabs?: boolean;
  showSurface?: boolean;
}

export function ProfileEmptyState({ text }: { text: string }) {
  return <div className="py-32 text-center text-gray-300 font-bold">{text}</div>;
}

export default function ProfileCommunitySection({
  communityTab,
  onChange,
  posts,
  replies,
  likedPosts = [],
  likedReplies = [],
  reports = [],
  isLoadingPosts,
  isLoadingReplies,
  isLoadingLikedPosts = false,
  isLoadingLikedReplies = false,
  isLoadingReports = false,
  postsErrorMessage = "",
  repliesErrorMessage = "",
  likedPostsErrorMessage = "",
  likedRepliesErrorMessage = "",
  reportsErrorMessage = "",
  isOwnProfile = false,
  onCancelReport,
  cancellingReportKey = null,
  showTabs = true,
  showSurface = true,
}: ProfileCommunitySectionProps) {
  const tabs = isOwnProfile
    ? [
        { label: "게시글", value: "posts" },
        { label: "댓글", value: "replies" },
        { label: "좋아요", value: "likedPosts" },
        { label: "좋아요 댓글", value: "likedReplies" },
        { label: "신고내역", value: "reports" },
      ]
    : [
        { label: "게시글", value: "posts" },
        { label: "댓글", value: "replies" },
      ];

  const content = (
    <>
      {showTabs ? (
        <SegmentTabs
          tabs={tabs}
          activeTab={communityTab}
          onChange={(value) => onChange(value as ProfileCommunityTab)}
          fullWidth={false}
          size="lg"
          radius="full"
          className="flex-wrap"
        />
      ) : null}

      <div className={showTabs ? "mt-8" : ""}>
        {communityTab === "posts" ? (
          isLoadingPosts ? (
            <ProfileEmptyState
              text={isOwnProfile ? "작성한 게시글을 불러오는 중입니다." : "게시글을 불러오는 중입니다."}
            />
          ) : postsErrorMessage ? (
            <ProfileEmptyState text={postsErrorMessage} />
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <ProfilePostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              text={isOwnProfile ? "작성한 게시글이 없습니다." : "게시글이 없습니다."}
            />
          )
        ) : communityTab === "replies" ? (
          isLoadingReplies ? (
            <ProfileEmptyState
              text={isOwnProfile ? "작성한 댓글을 불러오는 중입니다." : "댓글을 불러오는 중입니다."}
            />
          ) : repliesErrorMessage ? (
            <ProfileEmptyState text={repliesErrorMessage} />
          ) : replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => (
                <ProfileReplyRow key={reply.id} reply={reply} />
              ))}
            </div>
          ) : (
            <ProfileEmptyState
              text={isOwnProfile ? "작성한 댓글이 없습니다." : "댓글이 없습니다."}
            />
          )
        ) : communityTab === "likedPosts" ? (
          isLoadingLikedPosts ? (
            <ProfileEmptyState text="좋아요한 게시글을 불러오는 중입니다." />
          ) : likedPostsErrorMessage ? (
            <ProfileEmptyState text={likedPostsErrorMessage} />
          ) : likedPosts.length > 0 ? (
            <div className="space-y-4">
              {likedPosts.map((post) => (
                <ProfileLikedPostRow key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <ProfileEmptyState text="좋아요한 게시글이 없습니다." />
          )
        ) : communityTab === "likedReplies" ? (
          isLoadingLikedReplies ? (
            <ProfileEmptyState text="좋아요한 댓글을 불러오는 중입니다." />
          ) : likedRepliesErrorMessage ? (
            <ProfileEmptyState text={likedRepliesErrorMessage} />
          ) : likedReplies.length > 0 ? (
            <div className="space-y-4">
              {likedReplies.map((reply) => (
                <ProfileReplyRow key={reply.id} reply={reply} />
              ))}
            </div>
          ) : (
            <ProfileEmptyState text="좋아요한 댓글이 없습니다." />
          )
        ) : communityTab === "reports" ? (
          isLoadingReports ? (
            <ProfileEmptyState text="신고내역을 불러오는 중입니다." />
          ) : reportsErrorMessage ? (
            <ProfileEmptyState text={reportsErrorMessage} />
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <ProfileReportRow
                  key={`${report.type}-${report.id}`}
                  report={report}
                  onCancelReport={onCancelReport}
                  isCancelling={cancellingReportKey === `${report.type}-${report.id}`}
                />
              ))}
            </div>
          ) : (
            <ProfileEmptyState text="신고한 게시글과 댓글이 없습니다." />
          )
        ) : (
          <ProfileEmptyState text="표시할 내역이 없습니다." />
        )}
      </div>
    </>
  );

  if (!showSurface) {
    return content;
  }

  return (
    <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
      {content}
    </section>
  );
}

function ProfilePostRow({ post }: { post: Post }) {
  return (
    <Link
      href={`/community/latest/${post.id}`}
      className="block rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-black text-gray-900">
            {post.title}
          </h4>
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {post.content}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-gray-400">
          {formatTime(post.createdAt)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
        <span>좋아요 {post.likeCount}</span>
        <span>댓글 {post.replyCount}</span>
      </div>
    </Link>
  );
}

function ProfileReplyRow({ reply }: { reply: Reply }) {
  return (
    <Link
      href={`/community/latest/${reply.postId}`}
      className="block rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-gray-900">
            {reply.targetNickname
              ? `${reply.targetNickname}님에게 남긴 댓글`
              : "작성한 댓글"}
          </h4>
          <p className="mt-2 line-clamp-3 text-sm text-gray-500">
            {reply.content}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-gray-400">
          {formatTime(reply.createdAt)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
        <span>좋아요 {reply.likeCount}</span>
        <span>답글 {reply.replyCount}</span>
      </div>
    </Link>
  );
}

function ProfileLikedPostRow({ post }: { post: LikedPost }) {
  return (
    <Link
      href={`/community/latest/${post.id}`}
      className="block rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-black text-gray-900">
            {post.title}
          </h4>
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {post.content}
          </p>
        </div>

        <span className="shrink-0 text-xs font-bold text-gray-400">
          {formatTime(post.createdAt)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
        <span>좋아요 {post.likeCount}</span>
        <span>댓글 {post.replyCount}</span>
      </div>
    </Link>
  );
}

function ProfileReportRow({
  report,
  onCancelReport,
  isCancelling = false,
}: {
  report: ProfileReportItem;
  onCancelReport?: (report: ProfileReportItem) => void;
  isCancelling?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-6 transition-all hover:border-blue-100 hover:shadow-md">
      <Link href={`/community/latest/${report.postId}`} className="block">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
                  report.type === "post"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                {report.type === "post" ? "신고한 게시글" : "신고한 댓글"}
              </span>
              <span className="truncate text-xs font-bold text-red-500">
                신고 사유: {report.reportReasonLabel}
              </span>
            </div>

            <h4 className="truncate text-base font-black text-gray-900">
              {report.title}
            </h4>
            <p className="mt-2 line-clamp-3 text-sm text-gray-500">
              {report.content}
            </p>
          </div>

          <span className="shrink-0 text-xs font-bold text-gray-400">
            {formatTime(report.createdAt)}
          </span>
        </div>
      </Link>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
          <span>좋아요 {report.likeCount}</span>
          <span>댓글 {report.replyCount}</span>
          <span>신고 {report.reportCount}</span>
        </div>

        {onCancelReport ? (
          <button
            type="button"
            onClick={() => onCancelReport(report)}
            disabled={isCancelling}
            className="inline-flex w-fit items-center justify-center rounded-full border border-red-200 px-4 py-2 text-xs font-black text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
          >
            {isCancelling ? "취소 중..." : "신고 취소"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
