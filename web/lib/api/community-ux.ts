export type PostCreatedUxEvent = {
  postId: number;
  title: string;
  authorMemberId: number;
  authorNickname: string;
  createdAt: string;
};

export const COMMUNITY_UX_POST_CREATED_EVENT = "UX_COMMUNITY_POST_CREATED";

export const subscribeCommunityFeed = () => {
  return new EventSource(`/api/v1/community/ux/subscribe/feed`, {
    withCredentials: true,
  });
};

export const isPostCreatedUxEvent = (
  value: unknown
): value is PostCreatedUxEvent => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;

  return (
    typeof event.postId === "number" &&
    typeof event.title === "string" &&
    typeof event.authorMemberId === "number" &&
    typeof event.authorNickname === "string" &&
    typeof event.createdAt === "string"
  );
};
