"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cs";
import { Post } from "../types/post";
import UserAvatar from "@/components/user/UserAvatar";
import Slider from "@/components/Slider/Slider";
import { formatTime } from "@/lib/utils/date";
import Image from "next/image";
import { deleteLike, deletePost, putLike, unreportPost } from "@/lib/api/post";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostStore } from "@/stores/usePostStore";
import { useModalStore } from "@/stores/useModalStore";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import HeartButton from "./ui/LikeButton";
import ActionMenu from "./ui/ActionMenu";
import ActionMenuButton from "./ui/ActionMenuButton";
import BubbleButton from "./ui/BubbleButton";
import { Share2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWithAuth } from "@/hooks/useWithAuth";
import { useActionMenuUIStore } from "@/stores/useActionMenuUIStore";
import ImageViewerModal from "@/components/ImageViewerModal";

interface Props {
  post: Post;
  isDetail?: boolean;
}

export default function CommunityItem({ post, isDetail = false }: Props) {

    const params = useParams();
    const category = params.category;    
    const router = useRouter();

    // 로그인 여부 확인
    const withAuth = useWithAuth();

    // post 상태 관리
    const postFromStore = usePostStore((state) => state.postsMap.get(post.id));
    const currentPost = postFromStore ?? post;    
    const removePost = usePostStore((state) => state.removePost);
    const replacePost = usePostStore((state) => state.replacePost);

    // modal 상태 관리
    const WriteModalOpen = useModalStore((state) => state.openWrite);
    const ReportModalOpen = useModalStore((state) => state.openReport);
    const { alert, confirm, toast } = useFeedback();

    // actionMenu 상태 관리
    const openActionMenu = useActionMenuUIStore((state) => state.openActionMenu);
    const setActionMenu = useActionMenuUIStore((state) => state.setActionMenu);

    const isOpen = openActionMenu === post.id;


    // 내 정보 가져오기
    const { user } = useAuthStore();

    const isSlide = (currentPost?.files?.length ?? 0) > 2;
    const profileImage = currentPost.profileImgUrl ?? currentPost.profileImg;

    // 이미지 뷰어 상태
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

    const toggleActionMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActionMenu(openActionMenu === post.id ? null : post.id);
    }

    const openUpdateModal = async (e: React.MouseEvent) => {
        e.preventDefault();

        WriteModalOpen({mode: "edit", post: currentPost});
    }

    const handleDelete = async (e: React.MouseEvent, postId: number) => {
        e.preventDefault();

        setActionMenu(null);
        const confirmed = await confirm({
          description: "게시글을 삭제하시겠습니까?",
          confirmText: "삭제",
          cancelText: "취소",
          tone: "danger",
        });

        if (!confirmed) {
          return;
        }

        await deletePost(postId);
        removePost(postId); // post[] 상태 삭제
        toast({
          title: "게시글이 삭제되었습니다.",
          tone: "success",
        });
        
    }

    const openReportModal = async (e: React.MouseEvent) => {
        e.preventDefault();
        setActionMenu(null);

        withAuth(async () => {
            if (currentPost.reportedByMe) {
                const confirmed = await confirm({
                    description: "신고를 취소하시겠습니까?",
                    confirmText: "확인",
                    cancelText: "닫기",
                });

                if (!confirmed) {
                    return;
                }

                try {
                    const result = await unreportPost(currentPost.id);
                    replacePost({
                        ...currentPost,
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

            ReportModalOpen(currentPost.id);
        })();
    }

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();

        if (!currentPost) return;

        withAuth(async() => {
            if (currentPost.likedByMe) {
                replacePost({
                ...currentPost,
                likedByMe: false,
                likeCount: currentPost.likeCount - 1,
                });
                await deleteLike(currentPost.id);
                return;
            }

            replacePost({
                ...currentPost,
                likedByMe: true,
                likeCount: currentPost.likeCount + 1,
            });

            try {
                await putLike(currentPost.id);
            } catch {
                replacePost(currentPost);
            }
        })();

    };
    // actionMenu 밖 클릭 시 닫기
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

    const handleImageClick = (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setViewerInitialIndex(index);
      setIsViewerOpen(true);
    };

    const contentSection = (
      <>
        <div>
          <h3
            className="mb-1.5 break-words text-lg font-bold leading-snug text-gray-900"
          >
            {currentPost.title}
          </h3>
          <div
            className={cn(
              "break-words text-[15px] leading-relaxed text-gray-700",
              isDetail
                ? "whitespace-pre-wrap"
                : "line-clamp-3"
            )}
          >
            {currentPost.content}
          </div>
        </div>

        {currentPost?.files?.length > 0 && (
          <div className="mt-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {isSlide ? (
              <Slider snap={false}>
                <ul className="flex gap-2.5 w-full pb-2">
                  {currentPost?.files.map((file, index) => (
                    <li 
                      key={file.id}
                      className="relative z-10 snap-start shrink-0 w-[45%] md:w-[40%] aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer"
                      onClick={(e) => handleImageClick(e, index)}
                    >
                      <Image 
                        src={file.previewUrl ? file.previewUrl : file.path} 
                        alt={file.originalname || "게시글 이미지"} 
                        width={500} 
                        height={500} 
                        draggable={false}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 pointer-events-none"
                      />
                    </li>
                  ))}
                </ul>
              </Slider>
            ) : (
              <ul className="flex gap-2.5 w-full">
                {currentPost?.files.map((file, index) => (
                  <li 
                    key={file.id}
                    className="relative z-10 shrink-0 w-[45%] md:w-[40%] aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 bg-gray-50 cursor-pointer"
                    onClick={(e) => handleImageClick(e, index)}
                  >
                    <Image 
                      src={file.previewUrl ? file.previewUrl : file.path} 
                      alt={file.originalname || "게시글 이미지"} 
                      width={500} 
                      height={500} 
                      draggable={false}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 pointer-events-none"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}      
      </>
    );

    return(
        <>
      <div className="card group">
        {/* Header Section */}
        <header className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center min-w-0 gap-3">
            <Link
              href={`/member/${currentPost.memberId}`}
              className="shrink-0 transition-transform hover:scale-105"
              aria-label={`${currentPost.nickname} 프로필로 이동`}
            >
              <UserAvatar profileImg={profileImage ?? undefined} />
            </Link>
            <div className="flex flex-col min-w-0">
              <Link
                href={`/member/${currentPost.memberId}`}
                className="block truncate text-base font-bold text-gray-900 transition-colors hover:text-blue-600"
                aria-label={`${currentPost.nickname} 프로필로 이동`}
              >
                {currentPost.nickname}
              </Link>
              <small className="block text-xs font-medium text-gray-500 mt-0.5">
                {formatTime(currentPost.createdAt)}
              </small>
            </div>
          </div>
          <div className="relative self-start -mt-3">
            <ActionMenuButton toggleMenu={e => toggleActionMenu(e)} />
            {isOpen && (
                <ActionMenu 
                isOwner={currentPost.memberId === user?.memberId} 
                reportedByMe={currentPost.reportedByMe}
                onDelete={(e) => handleDelete(e, currentPost.id)} 
                onEdit={openUpdateModal} 
                onReport={openReportModal}
              />
            )}
          </div>
        </header>

        {/* Content Section */}
        {isDetail ? (
          <div>{contentSection}</div>
        ) : (
          <Link href={`/community/${category}/${currentPost.id}`} className="block outline-none">
            {contentSection}
          </Link>
        )}

        {/* Footer Actions Section */}
        <div className="mt-5 pt-3.5 border-t border-gray-100/80">
          <ul className="flex items-center gap-6 text-gray-500 font-medium text-[14px]">
            <li>
              <HeartButton 
                likeCount={currentPost.likeCount} 
                liked={currentPost.likedByMe} 
                onLike={handleLike} 
              />
            </li>                
            <li>
              <BubbleButton openComments={() => router.push(`/community/${category}/${post.id}`)}>
                {currentPost.replyCount}
              </BubbleButton>
            </li>                
            <li>
              <button 
                type="button" 
                className="flex items-center gap-1.5 hover:text-gray-800 transition-colors"
                onClick={(e) => {
                  e.preventDefault(); // 기본 이동 방지용 추가
                  // 공유 로직이 있다면 여기에 추가
                }}
              >
                <Share2 size={18} strokeWidth={2} />
                <span>공유</span>
              </button>
            </li>                
          </ul>
        </div>
      </div>
      
      {/* ImageViewerModal */}
      {isViewerOpen && (
        <ImageViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          initialIndex={viewerInitialIndex}
          images={currentPost?.files?.map((file) => ({
            id: file.id,
            url: file.previewUrl ? file.previewUrl : file.path,
            alt: file.originalname || "게시글 이미지",
          })) ?? []}
        />
      )}
    </>
    )
}
