export interface File {
  id: number;
  originalname: string;
  size: number;
  path: string;
  contentType: string;
  createdAt: string;
  postId: number;

}


export interface Post {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  replyCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  memberId: number;
  nickname: string;
  profileImg: string;
  files: File[];
};