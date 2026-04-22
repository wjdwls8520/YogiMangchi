"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, CornerDownRight } from "lucide-react";
import UserAvatar from "@/components/user/UserAvatar";
import { useWithAuth } from "@/hooks/useWithAuth";
import { cn } from "@/lib/utils/cs";
import { formatTime } from "@/lib/utils/date";
import {
  deleteReply,
  deleteReplyLike,
  getReplys,
  putReplyLike,
  unreportReply,
} from "@/lib/api/post";
import { useCommentStore } from "@/stores/useCommentStore";
import { usePostStore } from "@/stores/usePostStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useModalStore } from "@/stores/useModalStore";
import { useActionMenuUIStore } from "@/stores/useActionMenuUIStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { Post, Reply } from "../../types/post";
import LikeButton from "../ui/LikeButton";
import BubbleButton from "../ui/BubbleButton";
import ActionMenuButton from "../ui/ActionMenuButton";
import ActionMenu from "../ui/ActionMenu";
import CommentForm from "./CommentForm";

interface Props {
  post: Post;
  comments: Reply[];
  nextCursorId?: number;
}

interface CommentThreadItemProps {
  post: Post;
  rootComment: Reply;
  openCommentId: number | null;
  setOpenCommentId: Dispatch<SetStateAction<number | null>>;
}

function CommentThreadItem({
  post,
  rootComment,
  openCommentId,
  setOpenCommentId,
}: CommentThreadItemProps) {
  const { user } = useAuthStore();
  const withAuth = useWithAuth();
  const { alert, confirm, toast } = useFeedback();

  const comments = useCommentStore((state) => state.commentsMap.get(post.id)) || [];
  const moreComments = useCommentStore((state) => state.moreComments);
  const replaceComment = useCommentStore((state) => state.replaceComment);

  const currentComment = comments.find((comment) => comment.id === rootComment.id) ?? rootComment;
  const childComments = comments.filter(
    (comment) => comment.parentReplyId === rootComment.id
  );

  const replacePost = usePostStore((state) => state.replacePost);
  const currentPost = usePostStore((state) => state.postsMap.get(post.id) ?? post);

  const openReport = useModalStore((state) => state.openReport);
  const openActionMenu = useActionMenuUIStore((state) => state.openActionMenu);
  const setActionMenu = useActionMenuUIStore((state) => state.setActionMenu);

  const isOpen = openActionMenu === currentComment.id;
  const isReplyFormOpen = openCommentId === currentComment.id;
  const isDeleted = currentComment.deleteYn === "Y";
  const hasParent = currentComment.parentReplyId != null;
  const hasTarget = currentComment.targetMemberId != null;
  const isRootComment = !hasParent;
  const isNestedReply = hasParent && hasTarget;

  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [cursorId, setCursorId] = useState<number | null | undefined>(undefined);
  const [isEdit, setIsEdit] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();

    withAuth(async () => {
      if (currentComment.likedByMe) {
        replaceComment(post.id, {
          ...currentComment,
          likedByMe: false,
          likeCount: currentComment.likeCount - 1,
        });

        await deleteReplyLike(post.id, currentComment.id);
        return;
      }

      replaceComment(post.id, {
        ...currentComment,
        likedByMe: true,
        likeCount: currentComment.likeCount + 1,
      });

      try {
        await putReplyLike(currentComment.postId, currentComment.id);
      } catch {
        replaceComment(post.id, currentComment);
      }
    })();
  };

  const toggleActionMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActionMenu(openActionMenu === currentComment.id ? null : currentComment.id);
  };

  const handleDelete = async () => {
    setActionMenu(null);
    const confirmed = await confirm({
      description: "댓글을 삭제하시겠습니까?",
      confirmText: "삭제",
      cancelText: "취소",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const previousComment = currentComment;
    const previousPost = currentPost;
    const parentCommentId = currentComment.parentReplyId;
    const previousParentComment =
      parentCommentId != null
        ? comments.find((comment) => comment.id === parentCommentId) ?? null
        : null;

    replaceComment(currentComment.postId, {
      ...currentComment,
      deleteYn: "Y",
      nickname: "알 수 없음",
      content: "삭제된 댓글입니다.",
      updatedAt: new Date().toISOString(),
    });
    replacePost({
      ...currentPost,
      replyCount: currentPost.replyCount - 1,
    });

    if (previousParentComment) {
      replaceComment(currentComment.postId, {
        ...previousParentComment,
        replyCount: Math.max(0, previousParentComment.replyCount - 1),
      });
    }

    try {
      await deleteReply(currentComment.postId, currentComment.id);
      toast({
        title: "댓글이 삭제되었습니다.",
        tone: "success",
      });
    } catch {
      replaceComment(currentComment.postId, previousComment);
      replacePost(previousPost);
      if (previousParentComment) {
        replaceComment(currentComment.postId, previousParentComment);
      }
    }
  };

  const handleEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEdit(true);
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    setActionMenu(null);

    withAuth(async () => {
      if (currentComment.reportedByMe) {
        const confirmed = await confirm({
          description: "신고를 취소하시겠습니까?",
          confirmText: "확인",
          cancelText: "닫기",
        });

        if (!confirmed) {
          return;
        }

        try {
          const result = await unreportReply({
            postId: post.id,
            replyId: currentComment.id,
          });

          replaceComment(post.id, {
            ...currentComment,
            reportCount: result.reportCount,
            reportedByMe: result.reportedByMe,
          });

          toast({
            title: "신고가 취소되었습니다.",
            tone: "success",
          });
        } catch {
          await alert("신고 취소에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }

      openReport(post.id, currentComment.id);
    })();
  };

  const handleReplyToggle = () => {
    setOpenCommentId((prev) => (prev === currentComment.id ? null : currentComment.id));
  };

  const handleLoadReplies = async () => {
    if (currentComment.replyCount === 0 || cursorId === null) {
      return;
    }

    const result = await getReplys({
      postId: currentComment.postId,
      parentId: currentComment.id,
      cursorId,
    });

    setCursorId(result.nextCursorId ?? null);
    moreComments(post.id, result.content);
  };

  const handleScrollToTarget = (commentId: number | null) => {
    const element = document.getElementById(`comment-${commentId}`);
    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightId(commentId);
    window.setTimeout(() => {
      setHighlightId(null);
    }, 1500);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenu(null);
    };

    if (openActionMenu !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openActionMenu, setActionMenu]);

  const threadBody = isEdit ? (
    <div
      className={cn(
        "group/comment flex gap-3 rounded-xl py-4 transition-colors duration-300",
        hasParent && "ml-12 pl-4 dark:border-gray-700"
      )}
    >
      <div className="mt-0.5 shrink-0 self-start">
        <UserAvatar
          profileImg={currentComment.profileImgUrl}
          classes={hasParent ? "h-[32px] w-[32px]" : "h-[36px] w-[36px]"}
        />
      </div>
      <div
        className={cn(
          "min-w-0 flex-1",
          hasParent && "border-l-2 border-brand-primary/20 pl-4"
        )}
      >
        <CommentForm
          key={`edit-${currentComment.id}-${currentComment.updatedAt}`}
          post={post}
          currentComment={currentComment}
          isEdit={isEdit}
          setIsEdit={setIsEdit}
        />
      </div>
    </div>
  ) : (
    <div
      id={`comment-${currentComment.id}`}
      className={cn(
        "group/comment flex gap-3 rounded-xl py-4 transition-colors duration-300",
        hasParent && "ml-12 pl-4 dark:border-gray-700",
        highlightId === currentComment.id && "border-l-brand-primary bg-brand-primary/5"
      )}
    >
      {isDeleted ? (
        <div className="mt-0.5 shrink-0 self-start opacity-40">
          <UserAvatar
            profileImg={currentComment.profileImgUrl}
            classes={hasParent ? "h-[32px] w-[32px]" : "h-[36px] w-[36px]"}
          />
        </div>
      ) : (
        <Link
          href={`/member/${currentComment.memberId}`}
          className="mt-0.5 shrink-0 self-start rounded-full transition-opacity hover:opacity-80"
          aria-label={`${currentComment.nickname} 프로필로 이동`}
        >
          <UserAvatar
            profileImg={currentComment.profileImgUrl}
            classes={hasParent ? "h-[32px] w-[32px]" : "h-[36px] w-[36px]"}
          />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isDeleted ? (
              <span className="truncate text-[13px] font-bold text-gray-400">
                {currentComment.nickname}
              </span>
            ) : (
              <Link
                href={`/member/${currentComment.memberId}`}
                className="truncate text-[13px] font-bold text-gray-900 transition-colors hover:text-brand-primary dark:text-gray-100"
              >
                {currentComment.nickname}
              </Link>
            )}
            <span className="h-3 w-px shrink-0 bg-gray-200 dark:bg-gray-700" />
            <span className="shrink-0 text-xs text-gray-400">
              {currentComment.createdAt !== currentComment.updatedAt ? (
                <>
                  {formatTime(currentComment.updatedAt)}{" "}
                  <span className="text-gray-300">· 수정됨</span>
                </>
              ) : (
                formatTime(currentComment.createdAt)
              )}
            </span>
          </div>

          {!isDeleted && (
            <div className="relative shrink-0 opacity-0 transition-opacity duration-150 group-hover/comment:opacity-100">
              <ActionMenuButton toggleMenu={toggleActionMenu} />
              {isOpen && (
                <ActionMenu
                  isOwner={currentComment.memberId === user?.memberId}
                  reportedByMe={currentComment.reportedByMe}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onReport={handleReport}
                />
              )}
            </div>
          )}
        </div>

        <pre className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {isNestedReply && (
            <button
              type="button"
              className="mr-1 inline-flex items-center gap-0.5 text-[13px] font-semibold text-brand-primary hover:underline"
              onClick={() => handleScrollToTarget(currentComment.targetReplyId)}
            >
              <CornerDownRight size={12} strokeWidth={2.5} />
              {currentComment.targetNickname}
            </button>
          )}
          {currentComment.content}
        </pre>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <LikeButton
            likeCount={currentComment.likeCount}
            liked={currentComment.likedByMe}
            onLike={!isDeleted ? handleLike : undefined}
          />

          {isRootComment && (
            <BubbleButton openComments={handleLoadReplies}>
              {currentComment.replyCount}
            </BubbleButton>
          )}

          {!isDeleted && (
            <button
              type="button"
              className="text-xs font-semibold text-gray-400 transition-colors duration-150 hover:text-brand-primary"
              onClick={handleReplyToggle}
            >
              답글 달기
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    isRootComment ? (
      <li className="border-b border-gray-100 dark:border-gray-800">
        {threadBody}

        {isReplyFormOpen && (
          <div className="relative ml-12 mt-3">
            <CommentForm
              key={`reply-${currentComment.id}`}
              post={post}
              currentComment={currentComment}
              autoFocus
              onSuccess={() => setOpenCommentId(null)}
            />
          </div>
        )}

        {childComments.length > 0 && (
          <ul>
            {childComments.map((comment) => (
              <CommentThreadItem
                key={comment.id}
                post={post}
                rootComment={comment}
                openCommentId={openCommentId}
                setOpenCommentId={setOpenCommentId}
              />
            ))}
          </ul>
        )}
      </li>
    ) : (
      <>
        <li>{threadBody}</li>

        {isReplyFormOpen && (
          <li
            className={cn(
              "relative mt-3",
              hasParent ? "ml-12 border-l-2 border-brand-primary/20 pl-4" : "ml-12"
            )}
          >
            <CommentForm
              key={`reply-${currentComment.id}`}
              post={post}
              currentComment={currentComment}
              autoFocus
              onSuccess={() => setOpenCommentId(null)}
            />
          </li>
        )}

        {childComments.map((comment) => (
          <CommentThreadItem
            key={comment.id}
            post={post}
            rootComment={comment}
            openCommentId={openCommentId}
            setOpenCommentId={setOpenCommentId}
          />
        ))}
      </>
    )
  );
}

export default function CommentContainer({ post, comments, nextCursorId }: Props) {
  const setComments = useCommentStore((state) => state.setComments);
  const moreComments = useCommentStore((state) => state.moreComments);

  const commentMap = useCommentStore((state) => state.commentsMap);
  const currentComments = useMemo(
    () => commentMap.get(post.id) || [],
    [commentMap, post.id]
  );

  const rootComments = currentComments.filter(
    (comment) => comment.parentReplyId === null
  );

  const replacePost = usePostStore((state) => state.replacePost);
  const currentPost = usePostStore((state) => state.postsMap.get(post.id) ?? post);

  const [openCommentId, setOpenCommentId] = useState<number | null>(null);
  const [currentCursorId, setCurrentCursorId] = useState(nextCursorId);

  const handleLoadMoreRootComments = async () => {
    if (currentCursorId == null) {
      return;
    }

    const result = await getReplys({
      postId: post.id,
      cursorId: currentCursorId,
    });

    setCurrentCursorId(result.nextCursorId ?? null);
    moreComments(post.id, result.content);
  };

  useEffect(() => {
    replacePost(post);
    setComments(post.id, comments);
  }, [comments, post, replacePost, setComments]);

  return (
    <section className="mt-10">
      <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <h3 className="text-lg font-bold tracking-tight">
          답글
          <span className="ml-1.5 text-brand-primary">{currentPost.replyCount}</span>
        </h3>
      </div>

      <div className="relative mt-5">
        <CommentForm key={`root-${currentPost.id}`} post={currentPost} />
      </div>

      <ul className="mt-2">
        {rootComments.map((comment) => (
          <CommentThreadItem
            key={`${comment.postId}-${comment.id}`}
            post={currentPost}
            rootComment={comment}
            openCommentId={openCommentId}
            setOpenCommentId={setOpenCommentId}
          />
        ))}
      </ul>

      {currentCursorId && (
        <button
          type="button"
          className="group mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-blue-50/60 hover:text-brand-primary dark:hover:bg-blue-950/20"
          onClick={handleLoadMoreRootComments}
        >
          답글 더보기
          <ChevronDown
            size={16}
            className="transition-transform duration-200 group-hover:translate-y-0.5"
          />
        </button>
      )}
    </section>
  );
}
