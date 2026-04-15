export interface MemberInfo {
    memberId: number;
    provider: string;
    nickname: string;
    profileImgUrl: string;
    profileMsg: string;
    bestCount: number;
    followerCount: number;
    followingCount: number;
    term_agree: boolean;
    private_agree: boolean;
    role: "USER" | "VERIFIED_USER" | "ADMIN";
}
