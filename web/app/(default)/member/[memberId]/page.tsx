"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";

import type { Post, Reply } from "@/app/(default)/community/types/post";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import Button from "@/components/ui/Button";
import ProfileSidebar from "@/components/user/profile/ProfileSidebar";
import ProfileCommunitySection, {
  ProfileEmptyState,
} from "@/components/user/profile/ProfileCommunitySection";
import type { MemberProfileInfo } from "@/components/user/profile/types";
import { getMemberPosts, getMemberReplies } from "@/lib/api/me-community";
import { followMember, getMemberInfo, unfollowMember } from "@/lib/api/member";
import { useAuthStore } from "@/stores/useAuthStore";

type MainTab = "portfolio" | "community";
type CommunityTab = "posts" | "replies";

export default function MemberProfilePage() {
  const params = useParams<{ memberId: string }>();
  const router = useRouter();
  const memberId = Number(params.memberId);
  const isLogin = useAuthStore((state) => state.isLogin);
  const currentUser = useAuthStore((state) => state.user);
  const { alert, toast } = useFeedback();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileErrorMessage, setProfileErrorMessage] = useState("");
  const [memberProfile, setMemberProfile] = useState<MemberProfileInfo | null>(
    null
  );
  const [mainTab, setMainTab] = useState<MainTab>("portfolio");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("posts");
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [communityReplies, setCommunityReplies] = useState<Reply[]>([]);
  const [isLoadingCommunityPosts, setIsLoadingCommunityPosts] = useState(false);
  const [isLoadingCommunityReplies, setIsLoadingCommunityReplies] = useState(false);
  const [communityPostsErrorMessage, setCommunityPostsErrorMessage] = useState("");
  const [communityRepliesErrorMessage, setCommunityRepliesErrorMessage] =
    useState("");
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setIsLoadingProfile(false);
      setProfileErrorMessage("올바른 회원 정보를 찾을 수 없습니다.");
      return;
    }

    let isActive = true;

    const loadMemberProfile = async () => {
      try {
        const data = await getMemberInfo(memberId);

        if (!isActive) return;

        setMemberProfile(data);
        setProfileErrorMessage("");
      } catch (error) {
        console.error("failed to load public member profile:", error);

        if (!isActive) return;

        setMemberProfile(null);
        setProfileErrorMessage("회원 정보를 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadMemberProfile();

    return () => {
      isActive = false;
    };
  }, [memberId]);

  useEffect(() => {
    if (!memberProfile) return;
    if (mainTab !== "community" || communityTab !== "posts") return;

    let isActive = true;

    const loadCommunityPosts = async () => {
      setIsLoadingCommunityPosts(true);
      setCommunityPostsErrorMessage("");

      try {
        const response = await getMemberPosts(memberProfile.memberId, { size: 5 });
        const nextPosts =
          response && Array.isArray(response.content) ? (response.content as Post[]) : [];

        if (!isActive) return;

        setCommunityPosts(nextPosts);
      } catch (error) {
        console.error("failed to load public member posts:", error);

        if (!isActive) return;

        setCommunityPosts([]);
        setCommunityPostsErrorMessage("게시글을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingCommunityPosts(false);
        }
      }
    };

    void loadCommunityPosts();

    return () => {
      isActive = false;
    };
  }, [communityTab, mainTab, memberProfile]);

  useEffect(() => {
    if (!memberProfile) return;
    if (mainTab !== "community" || communityTab !== "replies") return;

    let isActive = true;

    const loadCommunityReplies = async () => {
      setIsLoadingCommunityReplies(true);
      setCommunityRepliesErrorMessage("");

      try {
        const response = await getMemberReplies(memberProfile.memberId, { size: 5 });
        const nextReplies =
          response && Array.isArray(response.content)
            ? (response.content as Reply[])
            : [];

        if (!isActive) return;

        setCommunityReplies(nextReplies);
      } catch (error) {
        console.error("failed to load public member replies:", error);

        if (!isActive) return;

        setCommunityReplies([]);
        setCommunityRepliesErrorMessage("댓글을 불러오지 못했습니다.");
      } finally {
        if (isActive) {
          setIsLoadingCommunityReplies(false);
        }
      }
    };

    void loadCommunityReplies();

    return () => {
      isActive = false;
    };
  }, [communityTab, mainTab, memberProfile]);

  const relationBadges = useMemo(() => {
    if (!memberProfile) return [];

    return [
      memberProfile.followedByMe ? "내가 팔로우 중" : "",
      memberProfile.followingMe ? "나를 팔로우 중" : "",
    ].filter(Boolean);
  }, [memberProfile]);

  if (isLoadingProfile) {
    return <div className="p-20 text-center">Loading...</div>;
  }

  if (profileErrorMessage) {
    return <div className="p-20 text-center">{profileErrorMessage}</div>;
  }

  if (!memberProfile) {
    return <div className="p-20 text-center">회원 정보를 찾을 수 없습니다.</div>;
  }

  const isOwnProfile = currentUser?.memberId === memberProfile.memberId;

  const handleToggleFollow = async () => {
    if (isSubmittingFollow || isOwnProfile) return;

    if (!isLogin) {
      router.push("/login");
      return;
    }

    setIsSubmittingFollow(true);

    try {
      const response = memberProfile.followedByMe
        ? await unfollowMember(memberProfile.memberId)
        : await followMember(memberProfile.memberId);

      setMemberProfile((prev) =>
        prev
          ? {
              ...prev,
              followerCount: response.followerCount,
              followedByMe: response.followedByMe,
            }
          : prev
      );
      toast({
        title: memberProfile.followedByMe
          ? "팔로우를 취소했습니다."
          : "팔로우했습니다.",
        tone: "success",
      });
    } catch (error) {
      console.error("failed to toggle follow state:", error);

      if (
        error instanceof Error &&
        (error.message === "API 에러: 401" || error.message === "API 에러: 403")
      ) {
        router.push("/login");
        return;
      }

      await alert("팔로우 상태를 변경하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-[400px] lg:sticky lg:top-24 space-y-6">
          <ProfileSidebar
            profile={memberProfile}
            relationArea={
              <div className="w-full space-y-3">
                {!isOwnProfile ? (
                  <Button
                    variant={memberProfile.followedByMe ? "white" : "blue"}
                    fullWidth={true}
                    onClick={handleToggleFollow}
                    disabled={isSubmittingFollow}
                    className="gap-1.5"
                  >
                    {memberProfile.followedByMe ? (
                      <>
                        <Check size={15} strokeWidth={2.4} />
                        팔로잉
                      </>
                    ) : (
                      "팔로우"
                    )}
                  </Button>
                ) : null}

                {relationBadges.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {relationBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            }
          />
        </aside>

        <main className="flex-1 w-full space-y-6">
          <div className="flex p-1 bg-gray-200/50 rounded-2xl gap-1">
            <button
              onClick={() => setMainTab("portfolio")}
              className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${
                mainTab === "portfolio"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              포트폴리오
            </button>

            <button
              onClick={() => setMainTab("community")}
              className={`flex-1 py-4 text-sm font-black rounded-xl transition-all ${
                mainTab === "community"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              커뮤니티
            </button>
          </div>

          {mainTab === "portfolio" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <section className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                <div className="mb-6">
                  <h3 className="text-lg font-black text-gray-900">포트폴리오</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    다른 유저의 포트폴리오와 대회 정보는 아직 제공되지 않습니다.
                  </p>
                </div>
                <ProfileEmptyState text="공개된 포트폴리오 데이터가 없습니다." />
              </section>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-300">
              <ProfileCommunitySection
                communityTab={communityTab}
                onChange={(value) => setCommunityTab(value as CommunityTab)}
                posts={communityPosts}
                replies={communityReplies}
                isLoadingPosts={isLoadingCommunityPosts}
                isLoadingReplies={isLoadingCommunityReplies}
                postsErrorMessage={communityPostsErrorMessage}
                repliesErrorMessage={communityRepliesErrorMessage}
                isOwnProfile={false}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
