export type Info = {
    profile: string;
    nickName: string;
    title: string;
    rate: number;
    follower: number;
};

export type RankProps = Info & {
  rank: number;
};