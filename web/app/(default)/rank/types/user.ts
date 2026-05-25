export type RankItemProps = {
  rank: number;
  memberId: number;
  nickname: string;
  profileImgUrl: string | null;
  mode: "followers" | "contest";

  // Followers mode specific
  profileMsg?: string | null;
  followerCount?: number;
  bestCount?: number;
  followedByMe?: boolean;
  onFollowToggle?: (memberId: number, isFollowing: boolean) => void;
  isFollowLoading?: boolean;

  // Contest mode specific
  profitRate?: number;
  realizedPnl?: number;
};