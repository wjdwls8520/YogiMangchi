"use client";


import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cs";
import { Post, Reply } from "../types/post";
import UserAvatar from "@/components/user/UserAvatar";
import Slider from "@/components/Slider/Slider";
import { formatTime } from "@/lib/utils/date";
import Image from "next/image";
import { deleteLike, deletePost, putLike } from "@/lib/api/post";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostStore } from "@/stores/usePostStore";
import { useModalStore } from "@/stores/useModalStore";
import HeartButton from "./ui/LikeButton";
import ActionMenu from "./ui/ActionMenu";
import ActionMenuButton from "./ui/ActionMenuButton";
import BubbleButton from "./ui/BubbleButton";
import { Share2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWithAuth } from "@/hooks/useWithAuth";
import { useActionMenuUIStore } from "@/stores/useActionMenuUIStore";

interface Props {
  post: Post;
  variant: "list" | "detail";
  replys?: Reply[];

}

export default function CommunityItem({ post, variant }: Props) {

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

    // actionMenu 상태 관리
    const openActionMenu = useActionMenuUIStore((state) => state.openActionMenu);
    const setActionMenu = useActionMenuUIStore((state) => state.setActionMenu);

    // 리스트 아이템 UI 상태 관리
    const textRef = useRef<HTMLDivElement>(null);
    const [isOverflow, setIsOverflow] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const isOpen = openActionMenu === post.id;


    // 내 정보 가져오기
    const { user } = useAuthStore();

    const isSlide = (currentPost?.files?.length ?? 0) > 2;

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
        
        await deletePost(postId);
        removePost(postId); // post[] 상태 삭제
        
    }

    const openReportModal = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        withAuth(() => ReportModalOpen(currentPost.id))();
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

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        setIsOverflow(el.scrollHeight > el.clientHeight);
    }, []);

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
    }, [openActionMenu]);

    return(
        <>
            <div className="border border-gray-200 rounded-2xl p-8">
                <header className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <Link
                        href={`/member/${currentPost.memberId}`}
                        className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-gray-50"
                        aria-label={`${currentPost.nickname} 프로필로 이동`}
                    >
                        <UserAvatar profileImg={currentPost.profileImg} />
                        <div className="min-w-0">
                            <p className="truncate font-semibold transition-colors hover:text-blue-600 hover:underline">
                                {currentPost.nickname}
                            </p>
                            <small className="text-gray-500">{formatTime(currentPost.createdAt)}</small>
                        </div>
                    </Link>
                    <div className="relative">
                        <ActionMenuButton toggleMenu={e => toggleActionMenu(e)} />
                        {
                            isOpen &&
                            <ActionMenu 
                                isOwner={post.memberId === user?.memberId} 
                                reportedByMe={post.reportedByMe}
                                onDelete={(e) => handleDelete(e, currentPost.id)} 
                                onEdit={openUpdateModal} 
                                onReport={openReportModal}
                            />
                        }
                    </div>
                </header>
                <Link href={`/community/${category}/${post.id}`}>
                    <div className="pt-3">
                        <p className="text-xl font-semibold">{currentPost.title}</p>
                        <div className={cn("pt-1", (!isExpanded && variant !== 'detail') &&"line-clamp-4")} ref={textRef}>
                            {currentPost.content}
                        </div>
                        {
                            (isOverflow && variant !== 'detail')&&
                            <button type="button" className="mt-7 text-gray-400"  
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsExpanded(prev => !prev);
                            }}>
                                {isExpanded ? "접기" : "더보기"}
                            </button>
                        }
                    </div>

                    {
                        currentPost?.files?.length > 0 && (
                            isSlide ? (
                                <Slider>
                                    <ul className="flex gap-2 w-full pt-6 pb-3">
                                        {
                                            currentPost?.files.map((file) => <li key={file.id}
                                                                            className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl overflow-hidden"
                                                                        >
                                                                            {
                                                                                file.previewUrl ? 
                                                                                <Image src={file.previewUrl} alt={"미리보기 이미지"} width={500} height={500} draggable={false} /> :
                                                                                <Image src={file.path} alt={file.originalname} width={500} height={500} draggable={false} />
                                                                            }
                                                                        </li>)
                                        }
                                    </ul>
                                </Slider>
                            ) : (
                                <ul className="flex gap-2 w-full pt-6 pb-3">
                                    {
                                        currentPost?.files.map((file) => <li key={file.id}
                                                                        className="snap-start shrink-0 w-[40%] border border-gray-200 rounded-2xl overflow-hidden"
                                                                    >
                                                                        {
                                                                            file.previewUrl ? 
                                                                            <Image src={file.previewUrl} alt={"미리보기 이미지"} width={500} height={500} draggable={false} /> :
                                                                            <Image src={file.path} alt={file.originalname} width={500} height={500} draggable={false} />
                                                                        }
                                                                    </li>)
                                    }
                                </ul>
                            )
                        )
                    }      
                </Link>
                <ul className="flex items-center gap-4 mt-4 text-gray-400 text-sm">
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
                        <button type="button" className="flex items-center gap-1"><Share2 className="text-xl" size={18} strokeWidth={2} /> 공유</button>
                    </li>                
                </ul>    
            </div>        
        </>
    )
}
