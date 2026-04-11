
import UserAvatar from "@/components/user/UserAvatar";
import { cn } from "@/lib/utils/cs";
import { formatTime } from "@/lib/utils/date";
import { Post, Reply } from "../../types/post";
import { deleteReply, deleteReplyLike, getReplys, putReplyLike } from "@/lib/api/post";
import LikeButton from "../ui/LikeButton";
import { useEffect, useState } from "react";
import CommentForm from "./CommentForm";
import { useCommentStore } from "@/stores/useCommentStore";
import BubbleButton from "../ui/BubbleButton";
import { usePostStore } from "@/stores/usePostStore";
import { useWithAuth } from "@/hooks/useWithAuth";
import ActionMenuButton from "../ui/ActionMenuButton";
import ActionMenu from "../ui/ActionMenu";
import { useAuthStore } from "@/stores/useAuthStore";
import { useModalStore } from "@/stores/useModalStore";
import { useActionMenuUIStore } from "@/stores/useActionMenuUIStore";
import Link from "next/link";


interface Props {
    post: Post;
    rootComment: Reply;
    openCommentId: number | null;
    setOpenCommentId: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function CommentItem({ 
    post, 
    rootComment, 
    openCommentId, 
    setOpenCommentId, 
 }: Props) {

    const { user } = useAuthStore();

    const comments = useCommentStore((state) => state.commentsMap.get(post.id)) || []; 
    const moreComments = useCommentStore((state) => state.moreComments);
    const replaceComment = useCommentStore((state) => state.replaceComment);
    const currentComment = comments.find((c) => c.id === rootComment.id) ?? rootComment;

    const [highlightId, setHighlightId] = useState<number | null>(null);

    // 대댓글 배열
    const childComments = comments.filter(
        (c) => c.parentReplyId === rootComment.id
    );

    const postUpdate = usePostStore((state) => state.replacePost);

    const ReportModalOpen = useModalStore((state) => state.openReport)

    // actionMenu 상태 관리
    const openActionMenu = useActionMenuUIStore((state) => state.openActionMenu);
    const setActionMenu = useActionMenuUIStore((state) => state.setActionMenu);
    const isOpen = openActionMenu === currentComment.id;
    
    const [cursorId, setCursorid] = useState(undefined);

    // 댓글 수정 상태 관리
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);

    // 대댓글, 대대댓글 구분
    const hasParent = currentComment.parentReplyId != null;
    const hasTarget = currentComment.targetMemberId != null;

    const isRootComment = !hasParent;
    const isReply = hasParent && !hasTarget;
    const isNestedReply = hasParent && hasTarget;


    const withAuth = useWithAuth();

    const handleLike = async (e:React.MouseEvent) => {
        e.preventDefault();

        withAuth(async() => {
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

        
    }

    const toggleActionMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setActionMenu(openActionMenu === currentComment.id ? null : currentComment.id);
    }

    const handleDelete = async () => {
        const updated = {
            ...currentComment,
            deleteYn: "Y",
            nickname: "알 수 없음",
            content: "삭제된 댓글입니다.",
            updatedAt: new Date().toISOString(),
        };

        replaceComment(currentComment.postId, updated);
        postUpdate({...post, replyCount: post.replyCount - 1});
        try {
            await deleteReply(currentComment.postId, currentComment.id);
        } catch(e) {
            console.log(e)
             replaceComment(currentComment.postId, currentComment);
        }
    }

    const handleEdit = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsEdit(true);
    }

    const openReportModal = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        withAuth(() => ReportModalOpen( post.id, currentComment.id))();
    }

    const openComments = async () => {
        if(currentComment.replyCount === 0) return;

        const result = await getReplys({postId: currentComment.postId, parentId: currentComment.id, cursorId});
        moreComments(post.id, result.content);
    }

    const handleForm = (commentId: number) => {
        setOpenCommentId(prev => prev === commentId ? null : commentId);
    }

    const handleScroll = (commentId: number | null) => {
        const el = document.getElementById(`comment-${commentId}`);
        if (!el) return;

        el.scrollIntoView({
            behavior: "smooth",
        });
        console.log(commentId)
        setHighlightId(commentId);

        setTimeout(() => {
            setHighlightId(null);
        }, 1500);        
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
    }, [openActionMenu]);


    return(
        <>
        { 
            isEdit ? 
             <div className={cn("relative mt-3", currentComment.parentReplyId && "pl-6 ml-5 border-l-3 border-gray-200")}>
                <CommentForm 
                    post={post}
                    currentComment={currentComment}
                    isEdit={isEdit}
                    setIsEdit={setIsEdit}
                        />
            </div>

            :

            <li 
            id={`comment-${currentComment.id}`}
            className={
                    cn("flex gap-2 mt-3 pb-2 border-t border-gray-200 pt-5", 
                        currentComment.parentReplyId && "border-t-0 border-l-3 pt-3 pl-6 ml-5 mb-6 border-gray-200",
                        highlightId === currentComment.id && "bg-gray-100 transition-colors duration-500"
                    )
            }>
                {currentComment.deleteYn !== "Y" ? (
                    <Link
                        href={`/member/${currentComment.memberId}`}
                        className="shrink-0 rounded-full transition-opacity hover:opacity-80"
                        aria-label={`${currentComment.nickname} 프로필로 이동`}
                    >
                        <UserAvatar 
                            profileImg={currentComment.profileImgUrl} 
                            classes={`${ currentComment.targetMemberId ? 'w-[36px] h-[36px]' : 'w-[30px] h-[30px]' }`} 
                        />
                    </Link>
                ) : (
                    <UserAvatar 
                        profileImg={currentComment.profileImgUrl} 
                        classes={`${ currentComment.targetMemberId ? 'w-[36px] h-[36px]' : 'w-[30px] h-[30px]' }`} 
                    />
                )}

                <div className="flex-1 relative">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                        {currentComment.deleteYn !== "Y" ? (
                            <Link
                                href={`/member/${currentComment.memberId}`}
                                className="min-w-0 rounded-md px-1 py-0.5 font-bold transition-colors hover:bg-gray-50 hover:text-blue-600 hover:underline"
                            >
                                <span className="block truncate">{currentComment.nickname}</span>
                            </Link>
                        ) : (
                            <p className="font-bold">{currentComment.nickname}</p>
                        )}
                        <p className="text-gray-400 text-sm">
                        {
                            currentComment.createdAt !== currentComment.updatedAt ? (
                                <>
                                {formatTime(currentComment.updatedAt)} <span> | 수정됨</span>
                                </>
                            ) : (
                                formatTime(currentComment.createdAt)
                            )
                        }
                        </p>
                        {
                            currentComment.deleteYn !== 'Y' && 
                            <div className="relative">
                            <ActionMenuButton toggleMenu={toggleActionMenu} />
                                {
                                    isOpen &&
                                    <ActionMenu 
                                        isOwner={currentComment.memberId === user?.memberId} 
                                        reportedByMe={currentComment.reportedByMe}
                                        onDelete={handleDelete} 
                                        onEdit={handleEdit}
                                        onReport={openReportModal}
                                    />
                                }
                            </div>
                        }
                    
                    </div>                
                    <pre className="pt-1">
                        {
                            isNestedReply && 
                            (<button type="button" className="text-blue-500 font-bold"
                                onClick={() => handleScroll(currentComment.targetReplyId)}
                            >
                            {`${currentComment.targetNickname} `} 
                            </button>)
                        }
                        {currentComment.content}
                    </pre>
                    <ul className="flex gap-4 mt-3 text-gray-400 text-sm">
                        <li>
                            <LikeButton 
                                likeCount={currentComment.likeCount} 
                                liked={currentComment.likedByMe} 
                                onLike={currentComment.deleteYn === 'N' ? handleLike : undefined} 
                            />
                        </li>  
                    {
                        isRootComment &&
                       <li>
                            <BubbleButton openComments={openComments}>
                                {currentComment.replyCount}
                            </BubbleButton>                            
                        </li>                         
                    }
                               
                        {currentComment.deleteYn !== 'Y' && <>
                        <li>
                            <button type="button" className="font-semibold" onClick={() => handleForm(currentComment.id)}>답글 달기</button>
                        </li>
                        </>
                        }       
                    </ul>  
                </div>

            </li>     
        }



            {
                (openCommentId === currentComment.id) &&
                <div className="relative mt-3">
                    <CommentForm 
                        post={post}
                        currentComment={currentComment}
                            />
                </div>
            }   
            { childComments.map((comment) => 
                <CommentItem key={comment.id} 
                    post={post}
                    rootComment={comment} 
                    openCommentId={openCommentId} 
                    setOpenCommentId={setOpenCommentId} 
                />) 
            }    


            
        </>
    )
}
