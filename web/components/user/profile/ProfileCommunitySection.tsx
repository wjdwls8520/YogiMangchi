"use client";

import Link from "next/link";

import Tabs from "@/components/ui/Tabs";
import { formatTime } from "@/lib/utils/date";
import type { Post, Reply } from "@/app/(default)/community/types/post";

import type { LikedPost, ProfileCommunityTab } from "./types";

interface ProfileCommunitySectionProps {
  communityTab: ProfileCommunityTab;
  onChange: (value: ProfileCommunityTab) => void;
  posts: Post[];
  replies: Reply[];
  likedPosts?: LikedPost[];
  likedReplies?: Reply[];
  isLoadingPosts: boolean;
  isLoadingReplies: boolean;
  isLoadingLikedPosts?: boolean;
  isLoadingLikedReplies?: boolean;
  postsErrorMessage?: string;
  repliesErrorMessage?: string;
  likedPostsErrorMessage?: string;
  likedRepliesErrorMessage?: string;
  isOwnProfile?: boolean;
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
  isLoadingPosts,
  isLoadingReplies,
  isLoadingLikedPosts = false,
  isLoadingLikedReplies = false,
  postsErrorMessage = "",
  repliesErrorMessage = "",
  likedPostsErrorMessage = "",
  likedRepliesErrorMessage = "",
  isOwnProfile = false,
}: ProfileCommunitySectionProps) {
  const tabs = isOwnProfile
    ? [
        { label: "내 게시글", value: "posts" },
        { label: "내 댓글", value: "replies" },
        { label: "좋아요한 게시글", value: "likedPosts" },
        { label: "좋아요한 댓글", value: "likedReplies" },
      ]
    : [
        { label: "게시글", value: "posts" },
        { label: "댓글", value: "replies" },
      ];

  return (
    <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
      <Tabs
        tabs={tabs}
        activeTab={communityTab}
        onChange={(value) => onChange(value as ProfileCommunityTab)}
      />

      <div className="mt-8">
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
        ) : isLoadingLikedReplies ? (
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
        )}
      </div>
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
