export interface Post {
  id: string;
  nickname: string;
  profileImg: string;
  title: string;
  content: string;
  images: string[];
  likeCount: number;
  unlikeCount: number;
  replyCount: number;
  reportCount: number;
  createAt: string;
  updateAt: string;
};