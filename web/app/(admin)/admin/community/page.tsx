"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import Input from "@/components/ui/Input";
import { ChevronDown } from "lucide-react";
import {
  getAdminPosts,
  getAdminReplies,
  type AdminPost,
  type AdminReply,
} from "@/lib/api/admin-community";
import PostDetailModal from "./components/PostDetailModal";
import ReplyDetailModal from "./components/ReplyDetailModal";
import CustomSelect from "../components/CustomSelect";

const PAGE_SIZE = 10;

export default function AdminCommunityPage() {
  const { alert } = useFeedback();
  const [activeTab, setActiveTab] = useState<"posts" | "replies">("posts");

  // 1. 게시글 상태
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [hasNextPosts, setHasNextPosts] = useState(false);
  const [nextPostsCursorId, setNextPostsCursorId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);

  // 게시글 필터 상태
  const [postAuthorStatus, setPostAuthorStatus] = useState<"ALL" | "ACTIVE" | "WITHDRAWN">("ALL");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postAuthorNickname, setPostAuthorNickname] = useState("");

  // 실제 API 요청에 쓰일 검색 필터 캐시 (리렌더링 무한 루프 방지를 위해 useRef 사용)
  const appliedPostFiltersRef = useRef({
    authorStatus: "ALL" as "ALL" | "ACTIVE" | "WITHDRAWN",
    title: "",
    content: "",
    authorNickname: "",
  });

  // 2. 댓글 상태
  const [replies, setReplies] = useState<AdminReply[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState(false);
  const [repliesError, setRepliesError] = useState<string | null>(null);
  const [hasNextReplies, setHasNextReplies] = useState(false);
  const [nextRepliesCursorId, setNextRepliesCursorId] = useState<number | null>(null);
  const [selectedReply, setSelectedReply] = useState<AdminReply | null>(null);

  // 댓글 필터 상태
  const [replyAuthorStatus, setReplyAuthorStatus] = useState<"ALL" | "ACTIVE" | "WITHDRAWN">("ALL");
  const [replyPostTitle, setReplyPostTitle] = useState("");
  const [replyPostContent, setReplyPostContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthorNickname, setReplyAuthorNickname] = useState("");

  // 실제 API 요청에 쓰일 검색 필터 캐시 (리렌더링 무한 루프 방지를 위해 useRef 사용)
  const appliedReplyFiltersRef = useRef({
    authorStatus: "ALL" as "ALL" | "ACTIVE" | "WITHDRAWN",
    postTitle: "",
    postContent: "",
    replyContent: "",
    authorNickname: "",
  });

  // 게시글 로드 함수 (useCallback을 제거하고 일반 함수로 선언하여 무한 루프 방지)
  const loadPosts = async ({
    reset = false,
    cursorId,
    overrideFilters,
  }: {
    reset?: boolean;
    cursorId?: number;
    overrideFilters?: {
      authorStatus: "ALL" | "ACTIVE" | "WITHDRAWN";
      title: string;
      content: string;
      authorNickname: string;
    };
  } = {}) => {
    if (reset) {
      setIsLoadingPosts(true);
      setPostsError(null);
    } else {
      setIsLoadingMorePosts(true);
    }

    try {
      const filters = overrideFilters
        ? overrideFilters
        : reset
        ? {
            authorStatus: postAuthorStatus,
            title: postTitle.trim(),
            content: postContent.trim(),
            authorNickname: postAuthorNickname.trim(),
          }
        : appliedPostFiltersRef.current;

      if (reset) {
        appliedPostFiltersRef.current = filters;
      }

      const response = await getAdminPosts(
        {
          title: filters.title || undefined,
          content: filters.content || undefined,
          authorNickname: filters.authorNickname || undefined,
          cursorId: reset ? undefined : cursorId,
          size: PAGE_SIZE,
        },
        filters.authorStatus
      );

      const nextContent = response.content ?? [];
      setPosts((prev) => (reset ? nextContent : [...prev, ...nextContent]));
      setHasNextPosts(response.hasNext === true);
      setNextPostsCursorId(response.nextCursorId ?? null);
    } catch (err) {
      console.error("게시글 조회 실패:", err);
      if (reset) {
        setPosts([]);
        setPostsError("게시글 목록을 불러오지 못했습니다.");
      } else {
        await alert("게시글 목록을 더 불러오지 못했습니다.");
      }
    } finally {
      if (reset) {
        setIsLoadingPosts(false);
      } else {
        setIsLoadingMorePosts(false);
      }
    }
  };

  // 댓글 로드 함수
  const loadReplies = async ({
    reset = false,
    cursorId,
    overrideFilters,
  }: {
    reset?: boolean;
    cursorId?: number;
    overrideFilters?: {
      authorStatus: "ALL" | "ACTIVE" | "WITHDRAWN";
      postTitle: string;
      postContent: string;
      replyContent: string;
      authorNickname: string;
    };
  } = {}) => {
    if (reset) {
      setIsLoadingReplies(true);
      setRepliesError(null);
    } else {
      setIsLoadingMoreReplies(true);
    }

    try {
      const filters = overrideFilters
        ? overrideFilters
        : reset
        ? {
            authorStatus: replyAuthorStatus,
            postTitle: replyPostTitle.trim(),
            postContent: replyPostContent.trim(),
            replyContent: replyContent.trim(),
            authorNickname: replyAuthorNickname.trim(),
          }
        : appliedReplyFiltersRef.current;

      if (reset) {
        appliedReplyFiltersRef.current = filters;
      }

      const response = await getAdminReplies(
        {
          postTitle: filters.postTitle || undefined,
          postContent: filters.postContent || undefined,
          replyContent: filters.replyContent || undefined,
          authorNickname: filters.authorNickname || undefined,
          cursorId: reset ? undefined : cursorId,
          size: PAGE_SIZE,
        },
        filters.authorStatus
      );

      const nextContent = response.content ?? [];
      setReplies((prev) => (reset ? nextContent : [...prev, ...nextContent]));
      setHasNextReplies(response.hasNext === true);
      setNextRepliesCursorId(response.nextCursorId ?? null);
    } catch (err) {
      console.error("댓글 조회 실패:", err);
      if (reset) {
        setReplies([]);
        setRepliesError("댓글 목록을 불러오지 못했습니다.");
      } else {
        await alert("댓글 목록을 더 불러오지 못했습니다.");
      }
    } finally {
      if (reset) {
        setIsLoadingReplies(false);
      } else {
        setIsLoadingMoreReplies(false);
      }
    }
  };

  // 탭 변경이나 초기 진입 시 데이터 로드
  useEffect(() => {
    if (activeTab === "posts") {
      void loadPosts({ reset: true });
    } else {
      void loadReplies({ reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handlePostSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadPosts({ reset: true });
  };

  const handlePostReset = () => {
    setPostAuthorStatus("ALL");
    setPostTitle("");
    setPostContent("");
    setPostAuthorNickname("");
    void loadPosts({
      reset: true,
      overrideFilters: {
        authorStatus: "ALL",
        title: "",
        content: "",
        authorNickname: "",
      },
    });
  };

  const handleReplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    void loadReplies({ reset: true });
  };

  const handleReplyReset = () => {
    setReplyAuthorStatus("ALL");
    setReplyPostTitle("");
    setReplyPostContent("");
    setReplyContent("");
    setReplyAuthorNickname("");
    void loadReplies({
      reset: true,
      overrideFilters: {
        authorStatus: "ALL",
        postTitle: "",
        postContent: "",
        replyContent: "",
        authorNickname: "",
      },
    });
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
    <div className="space-y-8">
      {/* 1. 상단 타이틀 */}
      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">커뮤니티 관리</h1>
      </section>

      {/* 2. 탭 인터페이스 */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`px-6 py-3 text-sm font-black border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-[#0058FF] text-[#0058FF]"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          게시글 관리
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("replies")}
          className={`px-6 py-3 text-sm font-black border-b-2 transition-colors ${
            activeTab === "replies"
              ? "border-[#0058FF] text-[#0058FF]"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          댓글 관리
        </button>
      </div>

      {/* 3. 탭별 레이아웃 */}
      {activeTab === "posts" ? (
        <div className="space-y-6">
          {/* 게시글 검색 필터 */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <form onSubmit={handlePostSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <CustomSelect
                  label="작성자 상태"
                  value={postAuthorStatus}
                  onChange={setPostAuthorStatus}
                  options={[
                    { value: "ALL", label: "전체" },
                    { value: "ACTIVE", label: "활성 회원만" },
                    { value: "WITHDRAWN", label: "탈퇴 회원만" },
                  ]}
                />

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">게시글 제목</span>
                  <Input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="제목 검색어"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">게시글 내용</span>
                  <Input
                    type="text"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="본문 검색어"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">작성자 닉네임</span>
                  <Input
                    type="text"
                    value={postAuthorNickname}
                    onChange={(e) => setPostAuthorNickname(e.target.value)}
                    placeholder="작성자 닉네임"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="white" onClick={handlePostReset}>
                  초기화
                </Button>
                <Button type="submit">검색</Button>
              </div>
            </form>
          </section>

          {/* 게시글 테이블 */}
          <section>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="w-[90px] px-3 py-4 text-center font-black">작성자ID</th>
                    <th className="w-[240px] px-3 py-4 text-left font-black">제목</th>
                    <th className="w-[70px] px-3 py-4 text-center font-black">좋아요</th>
                    <th className="w-[70px] px-3 py-4 text-center font-black">댓글수</th>
                    <th className="w-[70px] px-3 py-4 text-center font-black">신고수</th>
                    <th className="w-[85px] px-3 py-4 text-center font-black">상태</th>
                    <th className="w-[120px] px-3 py-4 text-center font-black">닉네임</th>
                    <th className="w-[165px] px-3 py-4 text-center font-black">작성 일자</th>
                    <th className="w-[85px] px-3 py-4 text-center font-black">관리</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoadingPosts ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-sm font-medium text-gray-500">
                        게시글을 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : postsError ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-sm font-medium text-red-500">
                        {postsError}
                      </td>
                    </tr>
                  ) : posts.length > 0 ? (
                    posts.map((post) => (
                      <tr
                        key={post.postId}
                        className="group border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-3 py-4 text-center font-bold text-gray-500 dark:text-gray-400">
                          {post.authorId}
                        </td>
                        <td className="px-3 py-4 font-black text-gray-900 dark:text-gray-100 truncate">
                          {post.title}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {post.likeCount}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {post.replyCount}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-red-500 dark:text-red-400">
                          {post.reportCount}
                        </td>
                        <td className="px-3 py-4 text-center">
                          {post.deleteYn === "Y" ? (
                            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-600 ring-1 ring-rose-100">
                              삭제됨
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-600 ring-1 ring-emerald-100">
                              정상
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-700 dark:text-gray-300 truncate">
                          {post.authorNickname}
                        </td>
                        <td className="px-3 py-4 text-center text-gray-600 dark:text-gray-400">
                          {formatDateTime(post.createdAt)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="white"
                              size="xs"
                              onClick={() => setSelectedPost(post)}
                            >
                              상세
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center text-sm font-medium text-gray-500">
                        게시글이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isLoadingPosts && !postsError && hasNextPosts ? (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="white"
                  onClick={() => void loadPosts({ cursorId: nextPostsCursorId ?? undefined })}
                  disabled={isLoadingMorePosts}
                >
                  {isLoadingMorePosts ? (
                    "불러오는 중..."
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      게시글 더보기
                      <ChevronDown size={16} />
                    </span>
                  )}
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 댓글 검색 필터 */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <form onSubmit={handleReplySearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <CustomSelect
                  label="작성자 상태"
                  value={replyAuthorStatus}
                  onChange={setReplyAuthorStatus}
                  options={[
                    { value: "ALL", label: "전체" },
                    { value: "ACTIVE", label: "활성 회원만" },
                    { value: "WITHDRAWN", label: "탈퇴 회원만" },
                  ]}
                />

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">부모글 제목</span>
                  <Input
                    type="text"
                    value={replyPostTitle}
                    onChange={(e) => setReplyPostTitle(e.target.value)}
                    placeholder="부모글 제목"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">부모글 내용</span>
                  <Input
                    type="text"
                    value={replyPostContent}
                    onChange={(e) => setReplyPostContent(e.target.value)}
                    placeholder="부모글 내용"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">댓글 내용</span>
                  <Input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="댓글 내용"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">댓글 작성자</span>
                  <Input
                    type="text"
                    value={replyAuthorNickname}
                    onChange={(e) => setReplyAuthorNickname(e.target.value)}
                    placeholder="작성자 닉네임"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="white" onClick={handleReplyReset}>
                  초기화
                </Button>
                <Button type="submit">검색</Button>
              </div>
            </form>
          </section>

          {/* 댓글 테이블 */}
          <section>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="w-[90px] px-3 py-4 text-center font-black">작성자ID</th>
                    <th className="w-[200px] px-3 py-4 text-left font-black">댓글 내용</th>
                    <th className="w-[70px] px-3 py-4 text-center font-black">좋아요</th>
                    <th className="w-[70px] px-3 py-4 text-center font-black">신고수</th>
                    <th className="w-[85px] px-3 py-4 text-center font-black">상태</th>
                    <th className="w-[80px] px-3 py-4 text-center font-black">부모글 ID</th>
                    <th className="w-[150px] px-3 py-4 text-left font-black">부모글 제목</th>
                    <th className="w-[100px] px-3 py-4 text-center font-black">닉네임</th>
                    <th className="w-[155px] px-3 py-4 text-center font-black">작성 일자</th>
                    <th className="w-[85px] px-3 py-4 text-center font-black">관리</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoadingReplies ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-sm font-medium text-gray-500">
                        댓글을 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : repliesError ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-sm font-medium text-red-500">
                        {repliesError}
                      </td>
                    </tr>
                  ) : replies.length > 0 ? (
                    replies.map((reply) => (
                      <tr
                        key={reply.replyId}
                        className="group border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-3 py-4 text-center font-bold text-gray-500 dark:text-gray-400">
                          {reply.authorId}
                        </td>
                        <td className="px-3 py-4 font-black text-gray-900 dark:text-gray-100 truncate">
                          {reply.content}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                          {reply.likeCount}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-red-500 dark:text-red-400">
                          {reply.reportCount}
                        </td>
                        <td className="px-3 py-4 text-center">
                          {reply.deleteYn === "Y" ? (
                            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-600 ring-1 ring-rose-100">
                              삭제됨
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-black text-emerald-600 ring-1 ring-emerald-100">
                              정상
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-500 dark:text-gray-400">
                          {reply.postId}
                        </td>
                        <td className="px-3 py-4 font-bold text-gray-600 dark:text-gray-400 truncate">
                          {reply.postTitle}
                        </td>
                        <td className="px-3 py-4 text-center font-bold text-gray-700 dark:text-gray-300 truncate">
                          {reply.authorNickname}
                        </td>
                        <td className="px-3 py-4 text-center text-gray-600 dark:text-gray-400">
                          {formatDateTime(reply.createdAt)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="white"
                              size="xs"
                              onClick={() => setSelectedReply(reply)}
                            >
                              상세
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-16 text-center text-sm font-medium text-gray-500">
                        댓글이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isLoadingReplies && !repliesError && hasNextReplies ? (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="white"
                  onClick={() => void loadReplies({ cursorId: nextRepliesCursorId ?? undefined })}
                  disabled={isLoadingMoreReplies}
                >
                  {isLoadingMoreReplies ? (
                    "불러오는 중..."
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      댓글 더보기
                      <ChevronDown size={16} />
                    </span>
                  )}
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      )}

      {/* 4. 상세 모달 */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDeleted={() => void loadPosts({ reset: true })}
        />
      )}

      {selectedReply && (
        <ReplyDetailModal
          reply={selectedReply}
          onClose={() => setSelectedReply(null)}
          onDeleted={() => void loadReplies({ reset: true })}
        />
      )}
    </div>
  );
}